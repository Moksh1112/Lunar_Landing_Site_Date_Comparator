"""Health and /api/v1 routes. Mock mode serves fixtures; real mode computes (compare) or is not
implemented yet (sweep, skyline, terrain-tile: S3)."""
import base64
import importlib
import logging
import math
import re
import threading
import time
from datetime import UTC, date, datetime, timedelta
from typing import Annotated

import numpy as np
from fastapi import APIRouter, Query, Request

from app.api.errors import ApiError, OrjsonResponse
from app.api.mock import load_fixture
from app.api.models import (
    CompareRequest,
    SitesResponse,
    SkylineQuery,
    SkylineResponse,
    SweepRequest,
    TerrainTileQuery,
    TerrainTileResponse,
)
from app.ephemeris import kernels_loaded
from app.paths import FIXTURES_DIR
from app.settings import APP_VERSION, CONTRACT_VERSION, Settings
from app.sites.loader import load_sites
from app.terrain import get_terrain_provider
from app.terrain.interface import NotInCoverage, TerrainProvider

log = logging.getLogger("azelux.api")
_terrain_lock = threading.Lock()

MAX_SWEEP_DAYS = 183
MAX_MISSION_HOURS = 8760
# TRD 10.1: "sample count capped (<= 60,000 per request)". Compare: the sum over all scenarios' grids.
# Sweep: the requested 30-min grid (range + mission); the internal 10-min refinement of the top 5
# days is server work, not requested samples (interpretation submitted to the Coordinator, C04).
MAX_SAMPLES_PER_REQUEST = 60_000
SWEEP_STEP_MINUTES = 30


def sample_count(mission_hours: float, step_minutes: float) -> int:
    """Samples on the grid start + k*step, both ends included (last step may be partial)."""
    return math.ceil(mission_hours * 60 / step_minutes) + 1


def _check_mission(mission_hours: float, prefix: str) -> None:
    if mission_hours > MAX_MISSION_HOURS:
        raise ApiError("RANGE_TOO_LARGE", "Mission length must be 8,760 hours (12 months) or less.",
                       [{"field": f"{prefix}mission_hours", "reason": "longer than 8760 hours"}])


def _check_request_samples(total: int, field: str) -> None:
    if total > MAX_SAMPLES_PER_REQUEST:
        raise ApiError("RANGE_TOO_LARGE",
                       f"Too many time samples in this request ({total:,}; max 60,000): "
                       "use a larger step or shorter missions.",
                       [{"field": field, "reason": f"{total} samples requested, max 60000 per request"}])

# DE440s covers 1849-12-26..2150-01-22; the Moon PCK/frame kernels are wider. Anything outside this span
# (or a start_utc SPICE would read differently from Python, e.g. year 0001 -> 2001) is rejected up front so
# SPICE text never reaches a client. Pre-1970 dates work (windows.py formats timestamps via
# epoch + timedelta, so negative Unix times are fine on Windows), so Apollo-era scenarios are allowed.
EPHEMERIS_FIRST_DAY = date(1900, 1, 1)
EPHEMERIS_LAST_DAY = date(2149, 12, 31)
_SITE_ID_RE = re.compile(r"^[A-Za-z0-9._-]{1,64}$")
_START_UTC_RE = re.compile(r"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\.[0-9]{1,9})?Z$")
_SPAN_ERROR = (f"Date is outside the supported span ({EPHEMERIS_FIRST_DAY.year}-{EPHEMERIS_LAST_DAY.year}).")
_SPAN_REASON = f"must be within {EPHEMERIS_FIRST_DAY.isoformat()} and {EPHEMERIS_LAST_DAY.isoformat()}"


def _check_span(first: datetime, last_end: datetime, start_field: str, end_field: str) -> None:
    if first.date() < EPHEMERIS_FIRST_DAY:
        raise ApiError("INVALID_INPUT", _SPAN_ERROR,
                       [{"field": start_field, "reason": _SPAN_REASON}])
    if last_end.date() > EPHEMERIS_LAST_DAY:
        raise ApiError("INVALID_INPUT", _SPAN_ERROR,
                       [{"field": end_field, "reason": "mission must end by " + EPHEMERIS_LAST_DAY.isoformat()}])


def _check_site(site, field: str) -> None:
    """An empty/odd site_id passes the Site model but would reach the pipeline with no coordinates (500)."""
    if site.site_id is not None and not _SITE_ID_RE.fullmatch(site.site_id):
        raise ApiError("INVALID_INPUT", "site_id must be 1-64 characters: letters, digits, '.', '_' or '-'.",
                       [{"field": f"{field}.site_id", "reason": "invalid site id"}])


def _check_start_utc(scenario, field: str) -> None:
    if not _START_UTC_RE.fullmatch(scenario.start_utc):
        raise ApiError("INVALID_INPUT", "start_utc must look like 2027-03-01T00:00:00Z.",
                       [{"field": field, "reason": "must be YYYY-MM-DDTHH:MM:SS[.fff]Z"}])
    start = scenario.start_dt
    if start.year > EPHEMERIS_LAST_DAY.year:  # avoids timedelta overflow near year 9999
        _check_span(start, start, field, field)
    _check_span(start, start + timedelta(hours=scenario.mission_hours), field, field)


def _check_sweep_span(body) -> None:
    for fld, day in (("range_start", body.range_start), ("range_end", body.range_end)):
        if not EPHEMERIS_FIRST_DAY <= day <= EPHEMERIS_LAST_DAY:
            raise ApiError("INVALID_INPUT", _SPAN_ERROR,
                           [{"field": fld, "reason": _SPAN_REASON}])
    last_start = datetime(body.range_end.year, body.range_end.month, body.range_end.day, tzinfo=UTC)
    _check_span(last_start, last_start + timedelta(hours=body.mission_hours), "range_start", "range_end")


health_router = APIRouter()
api_router = APIRouter(prefix="/api/v1")


def _settings(request: Request) -> Settings:
    return request.app.state.settings


def terrain_for(app) -> TerrainProvider:
    """Terrain provider, created on first use so the server (and /health) start without DEM libraries."""
    state = app.state
    with _terrain_lock:
        if getattr(state, "terrain", None) is None:
            settings = state.settings
            try:
                state.terrain = get_terrain_provider(settings.use_mock, FIXTURES_DIR, settings.data_dir,
                                                     dem_far=settings.dem_far)
            except Exception as exc:
                log.error("terrain provider unavailable: %s", exc)
                raise ApiError("INTERNAL", "Terrain data is not available on this server.", http=500) from exc
        return state.terrain


def _terrain(request: Request) -> TerrainProvider:
    return terrain_for(request.app)


def warm_up(app) -> None:
    """Real mode: pay the one-time start-up costs ahead of the first request: import the compare and
    sweep pipelines, open the DEMs, and run one tiny compare (2 curated sites, 1 hour) so SPICE segment
    loading, the on-disk skyline cache, numpy/pydantic first-use paths and the response model are all hot.
    Failures are logged; real requests then report them."""
    try:
        started = time.perf_counter()
        importlib.import_module("app.compare")  # not "import app.compare": that would rebind `app`
        importlib.import_module("app.sweep")
        provider = terrain_for(app)
        provider.coverage(-85.0, 0.0)
        _warm_compare(provider)
        log.info("warm-up done in %.2f s", time.perf_counter() - started)
    except Exception as exc:  # noqa: BLE001
        log.error("warm-up failed: %s", exc)


def _warm_compare(provider: TerrainProvider) -> None:
    if not kernels_loaded():
        return
    covered = [s["site_id"] for s in load_sites() if s["terrain_coverage"]][:2]
    if len(covered) < 2:
        return
    from app.compare import run_compare

    scenarios = [
        {"id": sid, "label": sid, "site": {"site_id": site}, "start_utc": "2027-03-01T00:00:00Z",
         "mission_hours": 1}
        for sid, site in zip("AB", covered, strict=True)
    ]
    run_compare(CompareRequest.model_validate({"mode": "site_vs_site", "scenarios": scenarios}), provider)


def _dems_loaded(request: Request) -> list[str]:
    try:
        return list(_terrain(request).dems_loaded())
    except ApiError:
        return []


def _serve(request: Request, fixture: str) -> OrjsonResponse:
    if not _settings(request).use_mock:
        raise ApiError("INTERNAL", "Not implemented yet in this build (S0)", http=500)
    return OrjsonResponse(load_fixture(fixture))


@health_router.get("/health")
def health(request: Request) -> OrjsonResponse:
    if _settings(request).use_mock:
        return OrjsonResponse(load_fixture("health.ok"))
    # Only what is actually loaded/available is claimed.
    return OrjsonResponse(
        {
            "status": "ok",
            "app_version": APP_VERSION,
            "contract_version": CONTRACT_VERSION,
            "kernels_loaded": kernels_loaded(),
            "dems_loaded": _dems_loaded(request),
            "mock": False,
        }
    )


@api_router.get("/sites")
def sites(request: Request) -> OrjsonResponse:
    if _settings(request).use_mock:
        return OrjsonResponse(load_fixture("sites.ok"))
    return OrjsonResponse(SitesResponse(sites=load_sites()).model_dump(mode="json"))


@api_router.post("/compare")
def compare(request: Request, body: CompareRequest) -> OrjsonResponse:
    for i, scenario in enumerate(body.scenarios):
        _check_mission(scenario.mission_hours, f"scenarios[{i}].")
        _check_site(scenario.site, f"scenarios[{i}].site")
        _check_start_utc(scenario, f"scenarios[{i}].start_utc")
    _check_request_samples(sum(sample_count(s.mission_hours, body.step_minutes) for s in body.scenarios),
                           "scenarios")
    if _settings(request).use_mock:
        return OrjsonResponse(load_fixture("compare.ok"))
    from app.compare import run_compare  # local import: keeps mock-only runs light

    return OrjsonResponse(run_compare(body, _terrain(request)))


@api_router.post("/sweep")
def sweep(request: Request, body: SweepRequest) -> OrjsonResponse:
    if (body.range_end - body.range_start).days + 1 > MAX_SWEEP_DAYS:
        raise ApiError(
            "RANGE_TOO_LARGE",
            "Date range must be 183 days or less.",
            [{"field": "range_end", "reason": "range longer than 183 days"}],
        )
    _check_mission(body.mission_hours, "")
    span_hours = (body.range_end - body.range_start).days * 24 + body.mission_hours
    _check_request_samples(sample_count(span_hours, SWEEP_STEP_MINUTES), "mission_hours")
    _check_site(body.site, "site")
    _check_sweep_span(body)
    if _settings(request).use_mock:
        return OrjsonResponse(load_fixture("sweep.ok"))
    from app.sweep import run_sweep  # local import: keeps mock-only runs light

    return OrjsonResponse(run_sweep(body, _terrain(request)))


def _site_point(query) -> dict:
    return {"site_id": None, "name": None, "lat_deg": query.lat_deg, "lon_east_deg": query.lon_east_deg}


def _not_in_coverage(exc: NotInCoverage) -> ApiError:
    return ApiError(
        "NOT_IN_COVERAGE",
        "No terrain data covers this point; only the geometric horizon applies here.",
        [{"field": "lat_deg", "reason": exc.reason}],
    )


@api_router.get("/skyline")
def skyline(request: Request, query: Annotated[SkylineQuery, Query()]) -> OrjsonResponse:
    if _settings(request).use_mock:
        return _serve(request, "skyline.ok")
    kernels = kernels_loaded()
    if not kernels:
        raise ApiError("INTERNAL", "Ephemeris data is not loaded on this server.", http=500)
    h_obs = float(query.observer_height_m)
    try:
        sky = _terrain(request).skyline(query.lat_deg, query.lon_east_deg, h_obs)
    except NotInCoverage as exc:
        raise _not_in_coverage(exc) from exc
    if sky.mode == "geometric":
        raise _not_in_coverage(NotInCoverage(query.lat_deg, query.lon_east_deg, "geometric horizon only"))
    block = None
    if sky.block_dist_km is not None:
        block = [0.0 if not math.isfinite(float(v)) else round(float(v), 3) for v in sky.block_dist_km]
    body = {
        "site": _site_point(query),
        "meta": {
            "ephemeris": "SPICE DE440 (JPL NAIF)",
            "kernels": kernels,
            "horizon_mode": sky.mode,
            "dem": sky.dem_name,
            "step_minutes": 0,  # no time grid on this endpoint; contract requires the field
            "observer_height_m": h_obs,
            "app_version": APP_VERSION,
            "contract_version": CONTRACT_VERSION,
            "computed_at": datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "data_label": sky.data_label,
        },
        "skyline": {
            "az_step_deg": 0.5,
            "elev_deg": [round(float(v), 3) for v in sky.elev_deg],
            "block_dist_km": block,
        },
    }
    return OrjsonResponse(SkylineResponse.model_validate(body).model_dump(mode="json"))


@api_router.get("/terrain-tile")
def terrain_tile(request: Request, query: Annotated[TerrainTileQuery, Query()]) -> OrjsonResponse:
    if _settings(request).use_mock:
        return _serve(request, "terrain-tile.ok")
    try:
        tile = _terrain(request).terrain_tile(query.lat_deg, query.lon_east_deg, float(query.size_km))
    except NotInCoverage as exc:
        raise _not_in_coverage(exc) from exc
    heights = np.ascontiguousarray(tile.heights_m, dtype="<f4")
    body = {
        "site": _site_point(query),
        "size_km": tile.size_km,
        "width": 256,
        "height": 256,
        "heights_m_b64": base64.b64encode(heights.tobytes()).decode("ascii"),
        "min_m": tile.min_m,
        "max_m": tile.max_m,
        "site_px": [tile.site_px[0], tile.site_px[1]],
        "data_label": tile.data_label,
    }
    return OrjsonResponse(TerrainTileResponse.model_validate(body).model_dump(mode="json"))
