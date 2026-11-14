"""Health and /api/v1 routes. Mock mode serves fixtures; real mode computes (compare) or is not
implemented yet (sweep, skyline, terrain-tile: S3)."""
import base64
import importlib
import logging
import math
import threading
import time
from datetime import UTC, datetime
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
MAX_SAMPLES_PER_SCENARIO = 60_000  # S0 proposal C04: cap per scenario, both grid ends included
SWEEP_STEP_MINUTES = 30


def sample_count(mission_hours: float, step_minutes: float) -> int:
    """Samples on the grid start + k*step, both ends included (last step may be partial)."""
    return math.ceil(mission_hours * 60 / step_minutes) + 1


def _check_mission(mission_hours: float, step_minutes: float, prefix: str) -> None:
    field = f"{prefix}mission_hours"
    if mission_hours > MAX_MISSION_HOURS:
        raise ApiError("RANGE_TOO_LARGE", "Mission length must be 8,760 hours (12 months) or less.",
                       [{"field": field, "reason": "longer than 8760 hours"}])
    if sample_count(mission_hours, step_minutes) > MAX_SAMPLES_PER_SCENARIO:
        raise ApiError("RANGE_TOO_LARGE",
                       "Too many time samples: use a larger step or a shorter mission (max 60,000 per scenario).",
                       [{"field": field, "reason": "more than 60000 samples at this step"}])

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
    """Real mode: load DEM libraries, open the far DEM and import the compare pipeline ahead of the
    first request (cold start ~3 s otherwise). Failures are logged; requests then report them."""
    try:
        started = time.perf_counter()
        importlib.import_module("app.compare")  # not "import app.compare": that would rebind `app`

        terrain_for(app).coverage(-85.0, 0.0)
        log.info("warm-up done in %.2f s", time.perf_counter() - started)
    except Exception as exc:  # noqa: BLE001
        log.error("warm-up failed: %s", exc)


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
        _check_mission(scenario.mission_hours, body.step_minutes, f"scenarios[{i}].")
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
    _check_mission(body.mission_hours, SWEEP_STEP_MINUTES, "")
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
