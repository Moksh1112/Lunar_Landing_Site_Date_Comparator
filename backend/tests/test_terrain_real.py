"""Tests for RealTerrain (coverage rule, skyline disk cache) and the DEM preparation helpers."""
from __future__ import annotations

import os
import struct
import sys
import zlib
from pathlib import Path

import numpy as np
import pytest

rasterio = pytest.importorskip("rasterio")
pytest.importorskip("pyproj")
from rasterio.transform import from_origin

from app.terrain.interface import NotInCoverage, TerrainUnavailable
from app.terrain.real import RealTerrain

SCRIPTS = Path(__file__).resolve().parents[2] / "scripts"
sys.path.insert(0, str(SCRIPTS))

_DATA = Path(os.environ.get("AZX_DATA_DIR", "C:/azelux-data"))
DEM_80 = _DATA / "dem" / "LDEM_80S_80MPP_ADJ.TIF"

LAT, LON = -85.0, 30.0
CRS_WKT = (
    'PROJCS["Moon polar",GEOGCS["Moon sphere",DATUM["Moon sphere",SPHEROID["Moon",1737400,0]],'
    'PRIMEM["Reference Meridian",0],UNIT["degree",0.0174532925199433]],'
    'PROJECTION["Polar_Stereographic"],PARAMETER["latitude_of_origin",-90],'
    'PARAMETER["central_meridian",0],PARAMETER["false_easting",0],PARAMETER["false_northing",0],'
    'UNIT["metre",1]]'
)


def _site_xy() -> tuple[float, float]:
    from pyproj import CRS, Transformer

    crs = CRS.from_wkt(CRS_WKT)
    x, y = Transformer.from_crs(crs.geodetic_crs, crs, always_xy=True).transform(LON, LAT)
    return float(x), float(y)


def _write(path: Path, half_m: float, px: float, value: float = 100.0, nan_centre: bool = False) -> None:
    cx, cy = _site_xy()
    n = int(2 * half_m / px)
    rng = np.random.default_rng(1)
    data = (value + rng.normal(0, 1, (n, n))).astype(np.float32)
    if nan_centre:
        data[n // 2 - 3 : n // 2 + 3, n // 2 - 3 : n // 2 + 3] = np.nan
    path.parent.mkdir(parents=True, exist_ok=True)
    with rasterio.open(
        path, "w", driver="GTiff", dtype="float32", count=1, width=n, height=n, crs=CRS_WKT,
        transform=from_origin(cx - half_m, cy + half_m, px, px), nodata=float("nan"),
    ) as dst:
        dst.write(data, 1)


@pytest.fixture
def far_only(tmp_path: Path) -> Path:
    _write(tmp_path / "dem" / "far_160m.tif", 120_000.0, 160.0)
    return tmp_path


def test_geometric_north_of_limit(far_only: Path) -> None:
    assert RealTerrain(far_only).coverage(-80.0, 10.0) == "geometric"


def test_far_only_is_terrain_coarse(far_only: Path) -> None:
    t = RealTerrain(far_only)
    assert t.coverage(LAT, LON) == "terrain_coarse"
    assert t.dems_loaded() == ["far_160m.tif"]
    assert abs(t.site_height(LAT, LON) - 100.0) < 6


def test_tile_gives_terrain_and_edge_downgrades(far_only: Path) -> None:
    _write(far_only / "tiles" / "x.tif", 25_000.0, 100.0, value=50.0)
    t = RealTerrain(far_only)
    assert t.coverage(LAT, LON) == "terrain"
    assert abs(t.site_height(LAT, LON) - 50.0) < 6
    # 15 km along grid +y: the 20 km disc no longer fits the 50 km tile
    from pyproj import CRS, Transformer

    crs = CRS.from_wkt(CRS_WKT)
    cx, cy = _site_xy()
    lon, lat = Transformer.from_crs(crs, crs.geodetic_crs, always_xy=True).transform(cx, cy + 15_000.0)
    assert t.coverage(lat, lon) == "terrain_coarse"


def test_nodata_site_downgrades(tmp_path: Path) -> None:
    _write(tmp_path / "dem" / "far_160m.tif", 120_000.0, 160.0, nan_centre=True)
    assert RealTerrain(tmp_path).coverage(LAT, LON) == "geometric"
    _write(tmp_path / "tiles" / "x.tif", 25_000.0, 100.0, nan_centre=True)
    _write(tmp_path / "dem" / "far_160m.tif", 120_000.0, 160.0)
    assert RealTerrain(tmp_path).coverage(LAT, LON) == "terrain_coarse"


def test_skyline_disk_cache_and_invalidation(far_only: Path) -> None:
    import time

    t = RealTerrain(far_only)
    t0 = time.perf_counter()
    a = t.skyline(LAT, LON, 2.0)
    d1 = time.perf_counter() - t0
    assert a.mode == "terrain_coarse" and a.data_label == "REAL" and a.dem_name == "far_160m"
    assert a.elev_deg.shape == (720,) and np.all(np.isfinite(a.elev_deg))
    assert list((far_only / "cache").glob("skyline_*.npz"))
    t0 = time.perf_counter()
    b = RealTerrain(far_only).skyline(LAT, LON, 2.0)
    d2 = time.perf_counter() - t0
    assert d2 < d1
    assert np.array_equal(a.elev_deg, b.elev_deg) and b.mode == a.mode
    # changed DEM file -> cache invalidated
    _write(far_only / "dem" / "far_160m.tif", 120_000.0, 160.0, value=400.0)
    t3 = RealTerrain(far_only)
    cp = t3._cache_path(LAT, LON, 2.0)
    tile, far = None, t3._far()
    assert t3._load_cache(cp, "terrain_coarse", t3._signature(tile, far)) is None
    c = t3.skyline(LAT, LON, 2.0)
    assert c.mode == "terrain_coarse"


def test_terrain_tile_shape_and_geometric(far_only: Path) -> None:
    t = RealTerrain(far_only)
    tile = t.terrain_tile(LAT, LON, 10.0)
    assert tile.heights_m.shape == (256, 256) and tile.heights_m.dtype == np.float32
    assert tile.data_label == "REAL" and tile.site_px == (128, 128)
    with pytest.raises(NotInCoverage):
        t.terrain_tile(-80.0, 1.0, 10.0)


def test_far_averaging_nan_aware(tmp_path: Path) -> None:
    from prepare_dems import average_2x2_nan, build_far

    a = np.array([[1, 3, np.nan, np.nan], [5, 7, np.nan, 2], [np.nan] * 4, [np.nan] * 4], dtype=np.float32)
    out = average_2x2_nan(a)
    assert out[0, 0] == 4.0 and out[0, 1] == 2.0 and np.isnan(out[1, 0]) and np.isnan(out[1, 1])
    src, dst = tmp_path / "s.tif", tmp_path / "d.tif"
    with rasterio.open(
        src, "w", driver="GTiff", dtype="float32", count=1, width=4, height=4, crs=CRS_WKT,
        transform=from_origin(-320.0, 320.0, 80.0, 80.0), nodata=float("nan"),
    ) as w:
        w.write(a, 1)
    build_far(src, dst)
    with rasterio.open(dst) as r:
        assert r.transform.a == 160.0 and r.transform.e == -160.0 and r.transform.c == -320.0
        assert (r.width, r.height) == (2, 2)
        assert r.read(1)[0, 0] == 4.0


def test_png_writer_valid() -> None:
    from prepare_dems import png_bytes

    rgba = np.zeros((16, 24, 4), dtype=np.uint8)
    rgba[..., 3] = 255
    data = png_bytes(rgba)
    assert data[:8] == b"\x89PNG\r\n\x1a\n"
    length, tag = struct.unpack(">I4s", data[8:16])
    assert tag == b"IHDR" and length == 13
    w, h, depth, ctype = struct.unpack(">IIBB", data[16:26])
    assert (w, h, depth, ctype) == (24, 16, 8, 6)
    # IDAT decompresses to h * (1 + 4w) bytes
    idat_len = struct.unpack(">I", data[33:37])[0]
    assert len(zlib.decompress(data[41 : 41 + idat_len])) == 16 * (1 + 24 * 4)


@pytest.mark.skipif(not DEM_80.exists(), reason=f"DEM not found: {DEM_80}")
def test_real_data_sites(tmp_path: Path) -> None:
    t = RealTerrain(_DATA)
    t.tiles_dir = tmp_path / "no_tiles"  # no 20 m tiles: coarse mode regardless of local data
    t.cache_dir = tmp_path / "cache"
    assert t.coverage(-84.7906, 29.1957) == "terrain_coarse"
    r = t.skyline(-84.7906, 29.1957, 2.0)
    assert r.data_label == "REAL" and r.elev_deg.shape == (720,) and np.all(np.isfinite(r.elev_deg))
    assert t.coverage(-80.13, 1.44) == "geometric"
    assert t.skyline(-80.13, 1.44, 2.0).mode == "geometric"


# -- regression: horizon mode must match the DEMs actually used (contract: terrain = near + far) --

def test_near_only_is_not_reported_as_terrain(tmp_path: Path) -> None:
    _write(tmp_path / "tiles" / "x.tif", 25_000.0, 100.0, value=50.0)
    t = RealTerrain(tmp_path)
    with pytest.raises(TerrainUnavailable, match=r"near \+ far"):
        t.coverage(LAT, LON)
    with pytest.raises(TerrainUnavailable):
        t.skyline(LAT, LON, 2.0)


def test_near_plus_far_is_terrain_with_both_in_label(far_only: Path) -> None:
    _write(far_only / "tiles" / "x.tif", 25_000.0, 100.0, value=50.0)
    sky = RealTerrain(far_only).skyline(LAT, LON, 2.0)
    assert sky.mode == "terrain" and sky.dem_name is not None and "far_160m" in sky.dem_name


def test_far_not_covering_site_with_tile_is_unavailable(tmp_path: Path) -> None:
    _write(tmp_path / "tiles" / "x.tif", 25_000.0, 100.0)
    # far DEM placed 300 km away: does not cover the site
    cx, cy = _site_xy()
    n = 100
    path = tmp_path / "dem" / "far_160m.tif"
    path.parent.mkdir(parents=True, exist_ok=True)
    with rasterio.open(path, "w", driver="GTiff", dtype="float32", count=1, width=n, height=n, crs=CRS_WKT,
                       transform=from_origin(cx + 300_000.0, cy + 8_000.0, 160.0, 160.0), nodata=float("nan")) as dst:
        dst.write(np.full((n, n), 10.0, np.float32), 1)
    with pytest.raises(TerrainUnavailable):
        RealTerrain(tmp_path).coverage(LAT, LON)


def test_neither_dem_is_unavailable(tmp_path: Path) -> None:
    with pytest.raises(TerrainUnavailable):
        RealTerrain(tmp_path).coverage(LAT, LON)


def test_cache_does_not_survive_far_removal(far_only: Path) -> None:
    _write(far_only / "tiles" / "x.tif", 25_000.0, 100.0, value=50.0)
    assert RealTerrain(far_only).skyline(LAT, LON, 2.0).mode == "terrain"  # cached near+far
    import shutil

    moved = far_only.parent / (far_only.name + "_nofar")  # same tile + skyline cache, far DEM gone
    shutil.copytree(far_only / "tiles", moved / "tiles")
    shutil.copytree(far_only / "cache", moved / "cache")
    with pytest.raises(TerrainUnavailable):
        RealTerrain(moved).skyline(LAT, LON, 2.0)
