"""Health and /api/v1 routes. S0: mock mode serves fixtures; real mode is not implemented."""
import math
from typing import Annotated

from fastapi import APIRouter, Query, Request

from app.api.errors import ApiError, OrjsonResponse
from app.api.mock import load_fixture
from app.api.models import (
    CompareRequest,
    SitesResponse,
    SkylineQuery,
    SweepRequest,
    TerrainTileQuery,
)
from app.ephemeris import kernels_loaded
from app.settings import APP_VERSION, CONTRACT_VERSION, Settings
from app.sites.loader import load_sites

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


def _serve(request: Request, fixture: str) -> OrjsonResponse:
    if not _settings(request).use_mock:
        raise ApiError("INTERNAL", "Not implemented yet in this build (S0)", http=500)
    return OrjsonResponse(load_fixture(fixture))


@health_router.get("/health")
def health(request: Request) -> OrjsonResponse:
    if _settings(request).use_mock:
        return OrjsonResponse(load_fixture("health.ok"))
    # Only what is actually loaded is claimed (terrain is not wired yet).
    return OrjsonResponse(
        {
            "status": "ok",
            "app_version": APP_VERSION,
            "contract_version": CONTRACT_VERSION,
            "kernels_loaded": kernels_loaded(),
            "dems_loaded": [],
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
    return _serve(request, "compare.ok")


@api_router.post("/sweep")
def sweep(request: Request, body: SweepRequest) -> OrjsonResponse:
    if (body.range_end - body.range_start).days + 1 > MAX_SWEEP_DAYS:
        raise ApiError(
            "RANGE_TOO_LARGE",
            "Date range must be 183 days or less.",
            [{"field": "range_end", "reason": "range longer than 183 days"}],
        )
    _check_mission(body.mission_hours, SWEEP_STEP_MINUTES, "")
    return _serve(request, "sweep.ok")


@api_router.get("/skyline")
def skyline(request: Request, query: Annotated[SkylineQuery, Query()]) -> OrjsonResponse:
    return _serve(request, "skyline.ok")


@api_router.get("/terrain-tile")
def terrain_tile(request: Request, query: Annotated[TerrainTileQuery, Query()]) -> OrjsonResponse:
    return _serve(request, "terrain-tile.ok")
