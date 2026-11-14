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


def get_terrain_provider(use_mock: bool, fixtures_dir: Path, data_dir: Path) -> TerrainProvider:
    """Return the mock provider, or fail loudly: never fall back to synthetic data."""
    if use_mock:
        return MockTerrain(fixtures_dir)
    raise NotImplementedError("Real terrain provider arrives in S1")


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
