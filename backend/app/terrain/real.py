"""Real terrain provider (P3 S2): DEM-backed coverage rule, skyline with disk cache, tiles.

Coverage rule (contract C08), evaluated per point:
1. lat > -80.7                                  -> "geometric"
2. a 20 m tile in data_dir/tiles/*.tif holds the whole 20 km near-field disc around the
   point and the site pixel is not nodata       -> "terrain"
3. the far DEM covers the point, site not nodata -> "terrain_coarse"
4. otherwise                                     -> "geometric"
After a skyline is computed, nodata_fraction >= 2 % downgrades one level and recomputes.

Skylines are cached on disk (data_dir/cache/skyline_<lat>_<lon>_<h_obs>.npz) together with
a signature (name, size, mtime) of the DEM files used, so a changed DEM invalidates them.
Open rasters are shared process-wide behind locks (rasterio datasets are not thread-safe).
"""
from __future__ import annotations

import math
import os
import threading
from pathlib import Path

import numpy as np

from .geometric import geometric_skyline
from .interface import (
    COVERAGE_LAT_MAX_DEG,
    TILE_PX,
    HorizonMode,
    NotInCoverage,
    SkylineResult,
    TileResult,
)
from .raster import RasterSampler
from .skyline import compute_skyline

NEAR_FIELD_M = 20_000.0  # 20 km near-field disc
NODATA_LIMIT = 0.02
MAX_TILE_KM = 40.0
FAR_DEFAULT = "far_160m.tif"
FAR_FALLBACK = "LDEM_80S_80MPP_ADJ.TIF"
NEAR_DEM_LABEL = "LDEM_80S_20MPP_ADJ"

_DOWNGRADE: dict[HorizonMode, HorizonMode] = {"terrain": "terrain_coarse", "terrain_coarse": "geometric"}

_REGISTRY_LOCK = threading.Lock()
_REGISTRY: dict[tuple[str, int, int], GuardedSampler] = {}


class GuardedSampler:
    """RasterSampler behind a lock; implements HeightSampler (name, resolution_m, heights, covers)."""

    def __init__(self, path: Path) -> None:
        self.path = path
        self._lock = threading.RLock()
        self._s = RasterSampler(path, preload=True)
        self.name = self._s.name
        self.resolution_m = self._s.resolution_m
        t = self._s.transform
        x1, y1 = t.c + t.a * self._s.width, t.f + t.e * self._s.height
        self.bounds = (min(t.c, x1), min(t.f, y1), max(t.c, x1), max(t.f, y1))  # l, b, r, t

    def heights(self, lat_deg: np.ndarray, lon_east_deg: np.ndarray) -> np.ndarray:
        with self._lock:
            return self._s.heights(lat_deg, lon_east_deg)

    def covers(self, lat_deg: np.ndarray, lon_east_deg: np.ndarray) -> np.ndarray:
        with self._lock:
            return self._s.covers(lat_deg, lon_east_deg)

    def xy(self, lat_deg: float, lon_east_deg: float) -> tuple[float, float]:
        with self._lock:
            x, y = self._s.xy(lat_deg, lon_east_deg)
        return float(x), float(y)

    def latlon(self, x: np.ndarray, y: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
        with self._lock:
            return self._s.latlon(x, y)

    def height_at(self, lat_deg: float, lon_east_deg: float) -> float:
        return float(self.heights(np.array([lat_deg]), np.array([lon_east_deg]))[0])

    def edge_distance_m(self, lat_deg: float, lon_east_deg: float) -> float:
        """Projected distance from the point to the nearest tile edge (negative if outside)."""
        x, y = self.xy(lat_deg, lon_east_deg)
        left, bottom, right, top = self.bounds
        return min(x - left, right - x, y - bottom, top - y)


def _sig(path: Path) -> str:
    st = path.stat()
    return f"{path.name}:{st.st_size}:{st.st_mtime_ns}"


def _open(path: Path) -> GuardedSampler:
    st = path.stat()
    key = (str(path.resolve()), st.st_size, st.st_mtime_ns)
    with _REGISTRY_LOCK:
        s = _REGISTRY.get(key)
        if s is None:
            for old in [k for k in _REGISTRY if k[0] == key[0]]:  # stale version of this file
                _REGISTRY.pop(old)
            s = GuardedSampler(path)
            _REGISTRY[key] = s
        return s


class RealTerrain:
    """TerrainProvider backed by the PGDA LOLA DEMs in data_dir (label REAL)."""

    def __init__(self, data_dir: Path, dem_far: str = FAR_DEFAULT) -> None:
        self.data_dir = Path(data_dir)
        self.dem_dir = self.data_dir / "dem"
        self.tiles_dir = self.data_dir / "tiles"
        self.cache_dir = self.data_dir / "cache"
        self.dem_far = dem_far
        self._cache_lock = threading.Lock()
        self.far_name_used: str | None = None

    # -- sources -------------------------------------------------------------------
    def _far_path(self) -> Path | None:
        for name in (self.dem_far, FAR_FALLBACK):
            p = self.dem_dir / name
            if p.is_file():
                self.far_name_used = name
                return p
        return None

    def _far(self) -> GuardedSampler | None:
        p = self._far_path()
        return _open(p) if p else None

    def _tile_paths(self) -> list[Path]:
        return sorted(self.tiles_dir.glob("*.tif")) if self.tiles_dir.is_dir() else []

    def _find_tile(self, lat: float, lon: float) -> GuardedSampler | None:
        """Tile whose extent holds the whole 20 km disc and with a valid site pixel."""
        for p in self._tile_paths():
            t = _open(p)
            if t.edge_distance_m(lat, lon) >= NEAR_FIELD_M and math.isfinite(t.height_at(lat, lon)):
                return t
        return None

    def dems_loaded(self) -> list[str]:
        """Names of DEM files available to this provider (far first, then tiles)."""
        names = []
        far = self._far_path()
        if far:
            names.append(far.name)
        names.extend(p.name for p in self._tile_paths())
        return names

    # -- coverage ------------------------------------------------------------------
    def _plan(self, lat: float, lon: float) -> tuple[HorizonMode, GuardedSampler | None, GuardedSampler | None]:
        """(mode, tile, far) for the point under rule C08."""
        if lat > COVERAGE_LAT_MAX_DEG:
            return "geometric", None, None
        far = self._far()
        tile = self._find_tile(lat, lon)
        if tile is not None:
            return "terrain", tile, far
        if far is not None:
            lo, la = np.array([lon]), np.array([lat])
            if bool(far.covers(la, lo)[0]) and math.isfinite(far.height_at(lat, lon)):
                return "terrain_coarse", None, far
        return "geometric", None, None

    def coverage(self, lat_deg: float, lon_east_deg: float) -> HorizonMode:
        return self._plan(lat_deg, lon_east_deg)[0]

    # -- skyline -------------------------------------------------------------------
    def _dem_name(self, mode: HorizonMode, tile: GuardedSampler | None, far: GuardedSampler | None) -> str | None:
        if mode == "terrain" and tile is not None:
            far_part = f" + {far.name}" if far is not None else ""
            return f"{NEAR_DEM_LABEL} tile {tile.path.stem}{far_part}"
        if mode == "terrain_coarse" and far is not None:
            return far.name
        return None

    def _cache_path(self, lat: float, lon: float, h_obs: float) -> Path:
        return self.cache_dir / f"skyline_{lat:.5f}_{lon:.5f}_{h_obs:.2f}.npz"

    def _signature(self, tile: GuardedSampler | None, far: GuardedSampler | None) -> str:
        parts = [_sig(tile.path) if tile else "-", _sig(far.path) if far else "-"]
        return "|".join(parts)

    def _load_cache(self, path: Path, initial: HorizonMode, sig: str) -> SkylineResult | None:
        try:
            with np.load(path, allow_pickle=False) as z:
                if str(z["initial_mode"]) != initial or str(z["sig"]) != sig:
                    return None
                block = z["block"]
                dem = str(z["dem_name"])
                return SkylineResult(
                    elev_deg=z["elev"].astype(np.float64),
                    block_dist_km=block.astype(np.float64) if block.size else None,
                    mode=str(z["mode"]),  # type: ignore[arg-type]
                    dem_name=dem or None,
                    data_label="REAL",
                )
        except (OSError, KeyError, ValueError):
            return None

    def _store_cache(
        self,
        path: Path,
        res: SkylineResult,
        initial: HorizonMode,
        sig: str,
        h_site: float,
        nodata_fraction: float,
    ) -> None:
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        tmp = path.with_name(f"{path.name}.{os.getpid()}.{threading.get_ident()}.tmp")
        block = res.block_dist_km if res.block_dist_km is not None else np.empty(0)
        with self._cache_lock, tmp.open("wb") as fh:
            np.savez(
                fh,
                elev=res.elev_deg,
                block=block,
                mode=np.array(res.mode),
                initial_mode=np.array(initial),
                dem_name=np.array(res.dem_name or ""),
                h_site=np.array(h_site),
                nodata_fraction=np.array(nodata_fraction),
                sig=np.array(sig),
            )
        tmp.replace(path)

    def skyline(self, lat_deg: float, lon_east_deg: float, h_obs_m: float) -> SkylineResult:
        mode, tile, far = self._plan(lat_deg, lon_east_deg)
        if mode == "geometric":
            return geometric_skyline(h_obs_m)
        sig = self._signature(tile, far)
        cpath = self._cache_path(lat_deg, lon_east_deg, h_obs_m)
        hit = self._load_cache(cpath, mode, sig)
        if hit is not None:
            return hit
        initial = mode
        while mode != "geometric":
            try:
                if mode == "terrain":
                    assert tile is not None
                    comp = compute_skyline(lat_deg, lon_east_deg, h_obs_m, near=tile, far=far)
                else:
                    assert far is not None
                    comp = compute_skyline(lat_deg, lon_east_deg, h_obs_m, near=far, far=far)
            except ValueError:  # site height NaN in the near sampler
                mode = _DOWNGRADE[mode]
                continue
            if comp.nodata_fraction >= NODATA_LIMIT:
                mode = _DOWNGRADE[mode]
                continue
            res = SkylineResult(
                elev_deg=comp.elev_deg,
                block_dist_km=comp.block_dist_km,
                mode=mode,
                dem_name=self._dem_name(mode, tile, far),
                data_label="REAL",
            )
            self._store_cache(cpath, res, initial, sig, comp.h_site_m, comp.nodata_fraction)
            return res
        res = geometric_skyline(h_obs_m)
        self._store_cache(cpath, res, initial, sig, 0.0, 1.0)
        return res

    # -- heights -------------------------------------------------------------------
    def site_height(self, lat_deg: float, lon_east_deg: float) -> float:
        mode, tile, far = self._plan(lat_deg, lon_east_deg)
        src = tile if mode == "terrain" else far if mode == "terrain_coarse" else None
        return 0.0 if src is None else src.height_at(lat_deg, lon_east_deg)

    def terrain_tile(self, lat_deg: float, lon_east_deg: float, size_km: float) -> TileResult:
        if not (0.0 < size_km <= MAX_TILE_KM):
            raise ValueError(f"size_km must be in (0, {MAX_TILE_KM}], got {size_km}")
        mode, tile, far = self._plan(lat_deg, lon_east_deg)
        if mode == "geometric":
            raise NotInCoverage(lat_deg, lon_east_deg, "no terrain data for this point (geometric horizon only)")
        half = size_km * 500.0
        src = far if far is not None else tile
        if tile is not None and tile.edge_distance_m(lat_deg, lon_east_deg) >= half:
            src = tile  # whole square fits in the 20 m tile
        assert src is not None
        cx, cy = src.xy(lat_deg, lon_east_deg)
        xs = cx + np.linspace(-half, half, TILE_PX)
        ys = cy + np.linspace(half, -half, TILE_PX)  # row 0 = +y (grid-up)
        gx, gy = np.meshgrid(xs, ys)
        lat, lon = src.latlon(gx, gy)
        h = src.heights(lat, lon).astype(np.float32)
        site_h = src.height_at(lat_deg, lon_east_deg)
        h = np.where(np.isfinite(h), h, np.float32(site_h)).astype(np.float32)  # fill nodata/outside
        return TileResult(
            heights_m=h,
            min_m=float(h.min()),
            max_m=float(h.max()),
            site_px=(TILE_PX // 2, TILE_PX // 2),
            size_km=float(size_km),
            data_label="REAL",
        )


__all__ = ["GuardedSampler", "RealTerrain"]
