"""P3 S4.1: terrain edge cases (coverage boundary, nodata holes, observer height, cache, lon wrap)."""
from __future__ import annotations

import os
import shutil
import threading
from collections.abc import Callable
from pathlib import Path

import numpy as np
import pytest

rasterio = pytest.importorskip("rasterio")
pytest.importorskip("pyproj")
from pyproj import CRS, Transformer
from rasterio.transform import from_origin

from app.terrain.interface import N_AZ, SkylineResult
from app.terrain.real import RealTerrain

_DATA = Path(os.environ.get("AZX_DATA_DIR", "C:/azelux-data"))
FAR_REAL = _DATA / "dem" / "far_160m.tif"
needs_real = pytest.mark.skipif(not FAR_REAL.is_file(), reason="real far DEM not available")

LAT, LON = -85.0, 30.0
CRS_WKT = (
    'PROJCS["Moon polar",GEOGCS["Moon sphere",DATUM["Moon sphere",SPHEROID["Moon",1737400,0]],'
    'PRIMEM["Reference Meridian",0],UNIT["degree",0.0174532925199433]],'
    'PROJECTION["Polar_Stereographic"],PARAMETER["latitude_of_origin",-90],'
    'PARAMETER["central_meridian",0],PARAMETER["false_easting",0],PARAMETER["false_northing",0],'
    'UNIT["metre",1]]'
)
Field = Callable[[np.ndarray, np.ndarray], np.ndarray]  # (dx, dy) metres from site -> heights


def _site_xy() -> tuple[float, float]:
    crs = CRS.from_wkt(CRS_WKT)
    x, y = Transformer.from_crs(crs.geodetic_crs, crs, always_xy=True).transform(LON, LAT)
    return float(x), float(y)


def _write(path: Path, half_m: float, px: float, field: Field, shift: tuple[float, float] = (0.0, 0.0)) -> None:
    """Square DEM of half-width half_m centred on the site shifted by `shift` metres."""
    sx, sy = _site_xy()
    cx, cy = sx + shift[0], sy + shift[1]
    n = int(2 * half_m / px)
    xs = cx - half_m + (np.arange(n) + 0.5) * px
    ys = cy + half_m - (np.arange(n) + 0.5) * px
    gx, gy = np.meshgrid(xs - sx, ys - sy)
    data = field(gx, gy).astype(np.float32)
    path.parent.mkdir(parents=True, exist_ok=True)
    with rasterio.open(
        path, "w", driver="GTiff", dtype="float32", count=1, width=n, height=n, crs=CRS_WKT,
        transform=from_origin(cx - half_m, cy + half_m, px, px), nodata=float("nan"),
    ) as dst:
        dst.write(data, 1)


def _flat(h: float = 100.0) -> Field:
    return lambda x, y: np.full(x.shape, h)


def _with_hole(base: Field, cx: float, cy: float, r: float) -> Field:
    def f(x: np.ndarray, y: np.ndarray) -> np.ndarray:
        h = base(x, y).astype(float)
        h[(x - cx) ** 2 + (y - cy) ** 2 <= r * r] = np.nan
        return h

    return f


def _ridge(x: np.ndarray, y: np.ndarray) -> np.ndarray:
    """Flat 0 m with a 600 m ridge ~3 km north of the site."""
    return 600.0 * np.exp(-(((y - 3000.0) / 500.0) ** 2)) + 0.0 * x


def _assert_clean(r: SkylineResult) -> None:
    assert r.elev_deg.shape == (N_AZ,)
    assert np.all(np.isfinite(r.elev_deg))


# -- 1. coverage boundary ------------------------------------------------------------------
@pytest.fixture(scope="module")
def real_copy(tmp_path_factory: pytest.TempPathFactory) -> Path:
    """Private data dir with a copy of the real far DEM (never touches the shared cache)."""
    d = tmp_path_factory.mktemp("realdata")
    (d / "dem").mkdir()
    shutil.copy(FAR_REAL, d / "dem" / "far_160m.tif")
    return d


@needs_real
def test_boundary_exact_minus_80_7_is_terrain_and_80_69_geometric(real_copy: Path) -> None:
    t = RealTerrain(real_copy)
    assert t.coverage(-80.7, 45.0) == "terrain_coarse"
    assert t.coverage(-80.69, 45.0) == "geometric"
    assert t.coverage(-80.2, 45.0) == "geometric"  # inside the square raster corner, but north of the rule


@needs_real
@pytest.mark.parametrize("lon", [0.0, 45.0, 225.0, 300.0])
def test_boundary_edge_skyline_is_sensible(real_copy: Path, lon: float) -> None:
    """At -80.71 the DEM edge is ~1 km away on one side: outside samples are ignored, not nodata."""
    t = RealTerrain(real_copy)
    assert t.coverage(-80.71, lon) == "terrain_coarse"
    r = t.skyline(-80.71, lon, 2.0)
    assert r.mode == "terrain_coarse"  # not downgraded (was the negative-site-height bug)
    _assert_clean(r)
    assert r.elev_deg.min() > -5.0 and r.elev_deg.max() < 30.0


def test_edge_site_outside_samples_are_not_nodata(tmp_path: Path) -> None:
    """Site 1 km from the DEM edge: rays leaving the raster must not trigger the nodata downgrade."""
    _write(tmp_path / "dem" / "far_160m.tif", 40_000.0, 160.0, lambda x, y: _ridge(x, -y), shift=(0.0, -39_000.0))
    t = RealTerrain(tmp_path)  # ridge 3 km south in grid y; the raster edge is 1 km north
    assert t.coverage(LAT, LON) == "terrain_coarse"
    r = t.skyline(LAT, LON, 2.0)
    assert r.mode == "terrain_coarse"
    _assert_clean(r)
    assert r.elev_deg.max() > 5.0  # some azimuth sees the ridge; others leave the raster after ~1 km


def test_site_outside_raster_is_geometric(tmp_path: Path) -> None:
    _write(tmp_path / "dem" / "far_160m.tif", 20_000.0, 160.0, _flat(), shift=(100_000.0, 0.0))
    t = RealTerrain(tmp_path)
    assert t.coverage(LAT, LON) == "geometric"
    r = t.skyline(LAT, LON, 2.0)
    assert r.mode == "geometric"
    _assert_clean(r)


# -- 2. nodata holes -----------------------------------------------------------------------
def test_small_hole_keeps_terrain_and_no_nan(tmp_path: Path) -> None:
    _write(tmp_path / "dem" / "far_160m.tif", 100_000.0, 160.0, _with_hole(_ridge, 1500.0, 0.0, 250.0))
    r = RealTerrain(tmp_path).skyline(LAT, LON, 2.0)
    assert r.mode == "terrain_coarse"
    _assert_clean(r)
    with np.load(next((tmp_path / "cache").glob("*.npz"))) as z:
        assert 0.0 < float(z["nodata_fraction"]) < 0.02


def test_big_hole_downgrades_to_geometric(tmp_path: Path) -> None:
    _write(tmp_path / "dem" / "far_160m.tif", 100_000.0, 160.0, _with_hole(_flat(), 6000.0, 0.0, 5000.0))
    t = RealTerrain(tmp_path)
    assert t.coverage(LAT, LON) == "terrain_coarse"  # site pixel itself is valid
    r = t.skyline(LAT, LON, 2.0)
    assert r.mode == "geometric"
    _assert_clean(r)


def test_site_pixel_nan_is_geometric(tmp_path: Path) -> None:
    _write(tmp_path / "dem" / "far_160m.tif", 100_000.0, 160.0, _with_hole(_flat(), 0.0, 0.0, 600.0))
    t = RealTerrain(tmp_path)
    assert t.coverage(LAT, LON) == "geometric"
    r = t.skyline(LAT, LON, 2.0)
    assert r.mode == "geometric"
    _assert_clean(r)


def test_tile_with_big_hole_downgrades_to_coarse(tmp_path: Path) -> None:
    _write(tmp_path / "dem" / "far_160m.tif", 100_000.0, 160.0, _ridge)
    _write(tmp_path / "tiles" / "t.tif", 25_000.0, 100.0, _with_hole(_ridge, 7000.0, 0.0, 4000.0))
    t = RealTerrain(tmp_path)
    assert t.coverage(LAT, LON) == "terrain"
    r = t.skyline(LAT, LON, 2.0)
    assert r.mode == "terrain_coarse"
    _assert_clean(r)


def test_negative_site_height_not_downgraded(tmp_path: Path) -> None:
    """Regression: h_site + h_obs < 0 (crater floor) made dip_deg raise and fell back to geometric."""
    _write(tmp_path / "dem" / "far_160m.tif", 50_000.0, 160.0, _flat(-3000.0))
    for h_obs in (0.0, 2.0, 20.0):
        r = RealTerrain(tmp_path).skyline(LAT, LON, h_obs)
        assert r.mode == "terrain_coarse"
        _assert_clean(r)


# -- 3. observer height --------------------------------------------------------------------
def test_observer_height_0_vs_20(tmp_path: Path) -> None:
    _write(tmp_path / "dem" / "far_160m.tif", 100_000.0, 160.0, _ridge)
    t = RealTerrain(tmp_path)
    r0, r20 = t.skyline(LAT, LON, 0.0), t.skyline(LAT, LON, 20.0)
    _assert_clean(r0)
    _assert_clean(r20)
    # a higher observer sees every fixed terrain point at a lower angle: skyline cannot rise
    assert np.all(r20.elev_deg <= r0.elev_deg + 1e-9)
    assert r20.elev_deg[0] < r0.elev_deg[0]  # ridge direction strictly lower
    names = sorted(p.name for p in (tmp_path / "cache").glob("*.npz"))  # one cache entry per h_obs
    assert len(names) == 2 and any("_0.00." in n for n in names) and any("_20.00." in n for n in names)


def test_observer_height_dip_flat_terrain(tmp_path: Path) -> None:
    from app.terrain.geometric import dip_deg

    _write(tmp_path / "dem" / "far_160m.tif", 30_000.0, 160.0, _flat(0.0))
    t = RealTerrain(tmp_path)
    r0, r20 = t.skyline(LAT, LON, 0.0), t.skyline(LAT, LON, 20.0)
    assert np.all(r0.elev_deg >= -1e-9)  # flat ground at zero height: horizon at ~0
    assert r20.elev_deg.max() <= 1e-3
    assert dip_deg(0.0, 20.0) > dip_deg(0.0, 0.0)


# -- 4. cache robustness -------------------------------------------------------------------
@pytest.fixture
def prov(tmp_path: Path) -> RealTerrain:
    _write(tmp_path / "dem" / "far_160m.tif", 60_000.0, 160.0, _ridge)
    return RealTerrain(tmp_path)


def test_corrupt_cache_is_recomputed(prov: RealTerrain, tmp_path: Path) -> None:
    good = prov.skyline(LAT, LON, 2.0)
    f = next((tmp_path / "cache").glob("*.npz"))
    for payload in (b"", b"not a zip at all", f.read_bytes()[:200]):
        f.write_bytes(payload)
        again = prov.skyline(LAT, LON, 2.0)
        assert np.array_equal(again.elev_deg, good.elev_deg)
        assert again.mode == good.mode
    assert np.array_equal(prov.skyline(LAT, LON, 2.0).elev_deg, good.elev_deg)  # healed


def test_cache_is_written_atomically_and_leaves_no_tmp(
    prov: RealTerrain, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    calls: list[tuple[str, str]] = []
    orig = Path.replace

    def spy(self: Path, target: str | Path) -> Path:
        calls.append((self.name, Path(target).name))
        return orig(self, target)

    monkeypatch.setattr(Path, "replace", spy)
    prov.skyline(LAT, LON, 2.0)
    assert len(calls) == 1 and calls[0][0].endswith(".tmp") and calls[0][1].endswith(".npz")
    assert not list((tmp_path / "cache").glob("*.tmp"))


def test_cache_invalidated_when_dem_changes(prov: RealTerrain, tmp_path: Path) -> None:
    a = prov.skyline(LAT, LON, 2.0)
    _write(tmp_path / "dem" / "far_160m.tif", 60_000.0, 160.0, _flat(0.0))
    b = RealTerrain(tmp_path).skyline(LAT, LON, 2.0)
    assert not np.array_equal(a.elev_deg, b.elev_deg)


def test_concurrent_same_site_consistent(prov: RealTerrain, tmp_path: Path) -> None:
    out: list[np.ndarray] = []
    errs: list[BaseException] = []
    barrier = threading.Barrier(4)

    def work() -> None:
        try:
            barrier.wait()
            out.append(prov.skyline(LAT, LON, 2.0).elev_deg)
        except BaseException as e:  # noqa: BLE001
            errs.append(e)

    th = [threading.Thread(target=work) for _ in range(4)]
    for x in th:
        x.start()
    for x in th:
        x.join()
    assert not errs, errs
    assert len(out) == 4 and all(np.array_equal(out[0], o) for o in out)
    assert len(list((tmp_path / "cache").glob("*.npz"))) == 1
    assert not list((tmp_path / "cache").glob("*.tmp"))


# -- 5. longitude wrap ---------------------------------------------------------------------
@needs_real
def test_lon_wrap_lon0_vs_359_9999(real_copy: Path) -> None:
    t = RealTerrain(real_copy)
    a, b = t.skyline(-85.0, 0.0, 2.0), t.skyline(-85.0, 359.9999, 2.0)
    assert a.mode == b.mode == "terrain_coarse"
    assert np.max(np.abs(a.elev_deg - b.elev_deg)) < 0.5  # 1e-4 deg ~ 3 m shift
    assert abs(float(np.mean(a.elev_deg - b.elev_deg))) < 0.05


def test_lon_wrap_synthetic_equivalence(prov: RealTerrain) -> None:
    a, b = prov.skyline(LAT, LON, 2.0), prov.skyline(LAT, LON + 360.0, 2.0)
    assert np.max(np.abs(a.elev_deg - b.elev_deg)) < 1e-6
