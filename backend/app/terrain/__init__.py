"""Azelux terrain module (S0 interface; real DEM provider arrives in S1)."""

from __future__ import annotations

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
    TileResult,
)
from .mock import MockTerrain


def get_terrain_provider(
    use_mock: bool, fixtures_dir: Path, data_dir: Path, dem_far: str = "far_160m.tif"
) -> TerrainProvider:
    """Mock provider, or the real DEM provider. Never falls back to synthetic data silently."""
    if use_mock:
        return MockTerrain(fixtures_dir)
    from .real import RealTerrain  # lazy: rasterio/pyproj are not needed for mock runs

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
    "TileResult",
    "dip_deg",
    "geometric_skyline",
    "get_terrain_provider",
]
