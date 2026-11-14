"""Azelux terrain module (S0 interface; real DEM provider arrives in S1)."""

from __future__ import annotations

import logging
from pathlib import Path

from .geometric import dip_deg, geometric_skyline
from .interface import (
    AZ_STEP_DEG,
    COVERAGE_LAT_MAX_DEG,
    MOON_RADIUS_M,
    N_AZ,
    TILE_PX,
    HorizonMode,
    NotInCoverage,
    SkylineResult,
    TerrainProvider,
    TerrainUnavailable,
    TileResult,
)
from .mock import MockTerrain


def get_terrain_provider(
    use_mock: bool, fixtures_dir: Path, data_dir: Path, dem_far: str = "far_160m.tif"
) -> TerrainProvider:
    """Mock provider, or the real DEM provider. Never falls back to synthetic data silently."""
    if use_mock:
        return MockTerrain(fixtures_dir)
    try:
        from .real import RealTerrain  # lazy: rasterio/pyproj are not needed for mock runs
    except (ImportError, OSError) as exc:
        # DEM libraries cannot load on this host (e.g. an OS application-control policy). Serve only
        # what needs no DEM: points north of 80.7 S (geometric by TRD 4.1). Covered points raise
        # TerrainUnavailable. Never a fixture, never a silent downgrade.
        from .degraded import GeometricOnlyTerrain

        logging.getLogger(__name__).error("DEM libraries unavailable, geometric-only provider: %s", exc)
        return GeometricOnlyTerrain(f"DEM libraries unavailable on this server ({type(exc).__name__})")

    return RealTerrain(data_dir, dem_far=dem_far)


__all__ = [
    "AZ_STEP_DEG",
    "COVERAGE_LAT_MAX_DEG",
    "MOON_RADIUS_M",
    "N_AZ",
    "TILE_PX",
    "HorizonMode",
    "MockTerrain",
    "NotInCoverage",
    "SkylineResult",
    "TerrainProvider",
    "TerrainUnavailable",
    "TileResult",
    "dip_deg",
    "geometric_skyline",
    "get_terrain_provider",
]
