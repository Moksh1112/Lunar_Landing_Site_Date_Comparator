"""Tests for the real DEM sampler against the PGDA 80 m LOLA south-polar GeoTIFF.

Skipped when rasterio/pyproj cannot be imported or the DEM is not on disk (CI has no DEMs).
"""
from __future__ import annotations

import math
import os
from pathlib import Path

import numpy as np
import pytest

try:
    from app.terrain.raster import RasterSampler
except ImportError as exc:  # rasterio/pyproj missing or blocked
    pytest.skip(f"rasterio/pyproj unavailable: {exc}", allow_module_level=True)

R_MOON = 1_737_400.0
_DATA = Path(os.environ.get("AZX_DATA_DIR", "C:/azelux-data"))
DEM_80 = _DATA / "dem" / "LDEM_80S_80MPP_ADJ.TIF"

if not DEM_80.exists():
    pytest.skip(f"DEM not found: {DEM_80}", allow_module_level=True)

POINTS = [(-80.13, 1.44), (-85.5, 30.0), (-89.5, 300.0), (-86.2, 210.0), (-82.0, 120.0)]


def trd_xy(lat: float, lon: float) -> tuple[float, float]:
    r = 2 * R_MOON * math.tan(math.pi / 4 + math.radians(lat) / 2)
    return r * math.sin(math.radians(lon)), r * math.cos(math.radians(lon))


@pytest.fixture(scope="module")
def dem() -> RasterSampler:
    s = RasterSampler(DEM_80, preload=True)
    yield s
    s.close()


def test_round_trip_under_1m(dem: RasterSampler) -> None:
    for lat, lon in POINTS:
        x, y = dem.xy(lat, lon)
        lat2, lon2 = dem.latlon(x, y)
        dlat_m = abs(float(lat2) - lat) * math.pi / 180 * R_MOON
        dlon = (float(lon2) - lon + 180) % 360 - 180
        dlon_m = abs(dlon) * math.pi / 180 * R_MOON * math.cos(math.radians(lat))
        assert dlat_m < 1.0 and dlon_m < 1.0, (lat, lon, dlat_m, dlon_m)


def test_pole_maps_to_origin_and_centre_pixel(dem: RasterSampler) -> None:
    x, y = dem.xy(-90.0, 0.0)
    assert abs(float(x)) < 1e-6 and abs(float(y)) < 1e-6
    row, col = dem.pixel(x, y)
    assert abs(float(row) - (dem.height - 1) / 2) < 1.0
    assert abs(float(col) - (dem.width - 1) / 2) < 1.0


def test_pyproj_matches_trd_formula(dem: RasterSampler) -> None:
    for lat, lon in POINTS:
        x, y = dem.xy(lat, lon)
        tx, ty = trd_xy(lat, lon)
        assert abs(float(x) - tx) < 1.0 and abs(float(y) - ty) < 1.0, (lat, lon, x, y, tx, ty)
    print("\nSIGN CONVENTION: raster CRS uses x = r sin(lon), y = r cos(lon) (matches TRD 4.2)")


def test_im1_height_and_sign(dem: RasterSampler) -> None:
    lat, lon = -80.13, 1.44
    x, y = trd_xy(lat, lon)
    cands = {"(x,y)": (x, y), "(-x,y)": (-x, y), "(x,-y)": (x, -y), "(-x,-y)": (-x, -y)}
    got = {}
    for k, (cx, cy) in cands.items():
        la, lo = dem.latlon(cx, cy)
        got[k] = float(dem.heights(np.array([la]), np.array([lo]))[0])
    print("\nIM-1 NASA 2579 m; DEM heights at candidates:", got)
    assert abs(got["(x,y)"] - 2579.0) < 150.0
    for k in ("(-x,y)", "(x,-y)", "(-x,-y)"):
        assert abs(got[k] - 2579.0) > abs(got["(x,y)"] - 2579.0)


def test_covers(dem: RasterSampler) -> None:
    assert not dem.covers(np.array([-79.0]), np.array([0.0]))[0]
    assert dem.covers(np.array([-85.0]), np.array([0.0]))[0]
    assert np.isnan(dem.heights(np.array([-79.0]), np.array([0.0]))[0])


def test_pixel_centre_returns_raw_value(dem: RasterSampler) -> None:
    import rasterio

    for row, col in [(dem.height // 2 + 37, dem.width // 2 - 91), (dem.height // 2, dem.width // 2)]:
        x, y = rasterio.transform.xy(dem.transform, row, col, offset="center")
        lat, lon = dem.latlon(x, y)
        h = dem.heights(np.array([float(lat)]), np.array([float(lon)]))[0]
        with rasterio.open(DEM_80) as ds:
            raw = float(ds.read(1, window=((row, row + 1), (col, col + 1)))[0, 0])
        assert abs(h - raw) < 0.05, (h, raw)


def test_window_read_matches_preload() -> None:
    a = RasterSampler(DEM_80)
    b = RasterSampler(DEM_80, preload=True)
    lat = np.array([-85.5, -80.13, -89.5])
    lon = np.array([30.0, 1.44, 300.0])
    np.testing.assert_allclose(a.heights(lat, lon), b.heights(lat, lon), equal_nan=True)
    assert a.name == "LDEM_80S_80MPP_ADJ" and a.resolution_m == pytest.approx(80.0)
    a.close()
    b.close()
