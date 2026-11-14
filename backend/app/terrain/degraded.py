"""Terrain provider used when the DEM libraries (rasterio/pyproj) cannot be loaded on this host.

TRD 4.1: points north of 80.7 deg S use the geometric horizon in every configuration, so they need
no DEM and are served exactly as the real provider serves them ("geometric", no DEM, label REAL).
Points inside south-pole DEM coverage would need terrain: they raise TerrainUnavailable, which the
API reports as an honest error. Nothing is downgraded silently and no fixture is ever used.
"""

from __future__ import annotations

from .geometric import geometric_skyline
from .interface import COVERAGE_LAT_MAX_DEG, HorizonMode, SkylineResult, TerrainUnavailable, TileResult


class GeometricOnlyTerrain:
    """Real (non-mock) provider for hosts where DEM libraries are unavailable."""

    def __init__(self, reason: str) -> None:
        self.reason = reason

    def _require_outside_coverage(self, lat_deg: float, lon_east_deg: float) -> None:
        if lat_deg <= COVERAGE_LAT_MAX_DEG:
            raise TerrainUnavailable(lat_deg, lon_east_deg, self.reason)

    def coverage(self, lat_deg: float, lon_east_deg: float) -> HorizonMode:
        self._require_outside_coverage(lat_deg, lon_east_deg)
        return "geometric"

    def skyline(self, lat_deg: float, lon_east_deg: float, h_obs_m: float) -> SkylineResult:
        self._require_outside_coverage(lat_deg, lon_east_deg)
        return geometric_skyline(h_obs_m)

    def site_height(self, lat_deg: float, lon_east_deg: float) -> float:
        self._require_outside_coverage(lat_deg, lon_east_deg)
        return 0.0

    def terrain_tile(self, lat_deg: float, lon_east_deg: float, size_km: float) -> TileResult:
        raise TerrainUnavailable(lat_deg, lon_east_deg, self.reason)
