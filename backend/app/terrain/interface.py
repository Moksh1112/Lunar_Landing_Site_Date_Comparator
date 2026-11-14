"""Terrain provider interface (S0): types, constants and the provider protocol."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal, Protocol

import numpy as np

HorizonMode = Literal["terrain", "terrain_coarse", "geometric"]
DataLabel = Literal["REAL", "SYNTHETIC"]

MOON_RADIUS_M = 1_737_400.0
AZ_STEP_DEG = 0.5
N_AZ = 720
COVERAGE_LAT_MAX_DEG = -80.7
TILE_PX = 256


class NotInCoverage(Exception):
    """Point lies outside terrain coverage (P2 maps this to HTTP 422 NOT_IN_COVERAGE)."""

    def __init__(self, lat_deg: float, lon_east_deg: float, reason: str) -> None:
        super().__init__(f"({lat_deg}, {lon_east_deg}) not in coverage: {reason}")
        self.lat_deg = lat_deg
        self.lon_east_deg = lon_east_deg
        self.reason = reason


class TerrainUnavailable(Exception):
    """Point needs DEM terrain but the DEM libraries/data cannot be used on this server (honest error)."""

    def __init__(self, lat_deg: float, lon_east_deg: float, reason: str) -> None:
        super().__init__(f"({lat_deg}, {lon_east_deg}) needs terrain data that is unavailable: {reason}")
        self.lat_deg = lat_deg
        self.lon_east_deg = lon_east_deg
        self.reason = reason


@dataclass(frozen=True)
class SkylineResult:
    """Horizon elevation per azimuth (0.5 deg steps from north, clockwise)."""

    elev_deg: np.ndarray  # (720,) float64
    block_dist_km: np.ndarray | None  # (720,) or None
    mode: HorizonMode
    dem_name: str | None
    data_label: DataLabel


@dataclass(frozen=True)
class TileResult:
    """Terrain height tile, row-major float32 metres."""

    heights_m: np.ndarray  # (256, 256) float32
    min_m: float
    max_m: float
    site_px: tuple[int, int]
    size_km: float
    data_label: DataLabel


class TerrainProvider(Protocol):
    """What the API layer needs from any terrain backend."""

    def coverage(self, lat_deg: float, lon_east_deg: float) -> HorizonMode: ...

    def skyline(self, lat_deg: float, lon_east_deg: float, h_obs_m: float) -> SkylineResult: ...

    def site_height(self, lat_deg: float, lon_east_deg: float) -> float:
        """Surface height in metres (0.0 in geometric mode)."""
        ...

    def terrain_tile(self, lat_deg: float, lon_east_deg: float, size_km: float) -> TileResult:
        """Raises NotInCoverage when coverage() is "geometric"."""
        ...
