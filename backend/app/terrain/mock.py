"""Mock terrain provider serving SYNTHETIC fixtures for polar points."""

from __future__ import annotations

import base64
import json
from functools import cached_property
from pathlib import Path
from typing import Any

import numpy as np

from .geometric import geometric_skyline
from .interface import (
    COVERAGE_LAT_MAX_DEG,
    N_AZ,
    TILE_PX,
    HorizonMode,
    NotInCoverage,
    SkylineResult,
    TileResult,
)


class MockTerrain:
    """Implements TerrainProvider using fixtures/skyline.ok.json and terrain-tile.ok.json."""

    def __init__(self, fixtures_dir: Path) -> None:
        self._dir = Path(fixtures_dir)

    @cached_property
    def _skyline_fixture(self) -> dict[str, Any]:
        with open(self._dir / "skyline.ok.json", encoding="utf-8") as f:
            return json.load(f)

    @cached_property
    def _tile_fixture(self) -> dict[str, Any]:
        with open(self._dir / "terrain-tile.ok.json", encoding="utf-8") as f:
            return json.load(f)

    def coverage(self, lat_deg: float, lon_east_deg: float) -> HorizonMode:
        return "terrain" if lat_deg <= COVERAGE_LAT_MAX_DEG else "geometric"

    def skyline(self, lat_deg: float, lon_east_deg: float, h_obs_m: float) -> SkylineResult:
        if self.coverage(lat_deg, lon_east_deg) == "geometric":
            return geometric_skyline(h_obs_m)
        fx = self._skyline_fixture
        sky = fx["skyline"]
        elev = np.array(sky["elev_deg"], dtype=np.float64)
        block = sky.get("block_dist_km")
        block_arr = np.array(block, dtype=np.float64) if block is not None else None
        if elev.shape != (N_AZ,):
            raise ValueError(f"fixture elev_deg has shape {elev.shape}, expected ({N_AZ},)")
        return SkylineResult(
            elev_deg=elev,
            block_dist_km=block_arr,
            mode="terrain",
            dem_name=fx.get("meta", {}).get("dem"),
            data_label="SYNTHETIC",
        )

    def site_height(self, lat_deg: float, lon_east_deg: float) -> float:
        """Always 0.0: the synthetic fixtures carry no site height."""
        return 0.0

    def terrain_tile(self, lat_deg: float, lon_east_deg: float, size_km: float) -> TileResult:
        if self.coverage(lat_deg, lon_east_deg) == "geometric":
            raise NotInCoverage(lat_deg, lon_east_deg, "latitude north of -80.7 deg: no terrain tile")
        fx = self._tile_fixture
        raw = base64.b64decode(fx["heights_m_b64"])
        heights = np.frombuffer(raw, dtype="<f4").astype(np.float32).reshape(TILE_PX, TILE_PX)
        px = fx["site_px"]
        # Synthetic heights are returned as-is; they are not rescaled to size_km.
        return TileResult(
            heights_m=heights,
            min_m=float(fx["min_m"]),
            max_m=float(fx["max_m"]),
            site_px=(int(px[0]), int(px[1])),
            size_km=float(size_km),
            data_label="SYNTHETIC",
        )
