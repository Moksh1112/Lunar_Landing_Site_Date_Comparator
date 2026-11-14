import math
import os
from pathlib import Path

import numpy as np
import pytest

from app.ephemeris import spice as eph
from app.settings import Settings

DATA_DIR = Path(os.environ.get("AZX_DATA_DIR", "C:/azelux-data"))
KERNEL_DIR = DATA_DIR / "kernels"
KERNELS = Settings().kernel_list
HAVE_KERNELS = all((KERNEL_DIR / k).is_file() for k in KERNELS)
needs_kernels = pytest.mark.skipif(not HAVE_KERNELS, reason=f"SPICE kernels not found in {KERNEL_DIR}")


@pytest.fixture(autouse=True)
def _clean_spice():
    eph._reset_for_tests()
    yield
    eph._reset_for_tests()


@pytest.fixture
def kernels():
    return eph.load_kernels(KERNEL_DIR, KERNELS)


@pytest.mark.parametrize("lat,lon", [(-85.5, 30.0), (0.0, 0.0), (-84.7906, 29.1957), (45.0, -120.0)])
def test_site_frame_orthonormal_right_handed(lat, lon):
    obs, east, north, up = eph.site_frame(lat, lon, 2.0)
    for a in (east, north, up):
        assert np.linalg.norm(a) == pytest.approx(1.0)
    assert east @ north == pytest.approx(0, abs=1e-12)
    assert east @ up == pytest.approx(0, abs=1e-12)
    assert north @ up == pytest.approx(0, abs=1e-12)
    assert np.cross(east, north) == pytest.approx(up)
    assert np.linalg.norm(obs) == pytest.approx(1737.402)
    assert north[2] > 0 or abs(lat) > 89


@pytest.mark.parametrize("lat", [89.995, -90.0, -89.9901])
def test_site_frame_rejects_pole(lat):
    with pytest.raises(ValueError):
        eph.site_frame(lat, 0.0, 0.0)


@needs_kernels
def test_time_grid_full_month(kernels):
    t, ets = eph.time_grid("2027-03-01T00:00:00Z", 708, 10)
    assert len(t) == len(ets) == 4249
    assert t.dtype == np.int64
    assert t[-1] - t[0] == 708 * 3600
    assert np.all(np.diff(t) == 600)


@needs_kernels
def test_time_grid_partial_last_step(kernels):
    t, ets = eph.time_grid("2027-03-01T00:00:00Z", 1, 25)
    assert list((t - t[0]) // 60) == [0, 25, 50, 60]
    assert t.dtype == np.int64
    assert ets[-1] - ets[0] == pytest.approx(3600.0)


@needs_kernels
def test_load_kernels(kernels):
    assert sorted(kernels) == sorted(KERNELS)
    assert eph.load_kernels(KERNEL_DIR, KERNELS) == kernels  # idempotent
    assert sorted(eph.kernels_loaded()) == sorted(KERNELS)


def test_load_kernels_missing_not_raised(tmp_path):
    assert eph.load_kernels(tmp_path, KERNELS) == []
    assert eph.kernels_loaded() == []


@needs_kernels
def test_south_pole_sun_earth_bounds(kernels):
    r = eph.sun_earth_series(-89.0, 0.0, 2.0, "2027-03-01T00:00:00Z", 720, 60)
    assert np.all((r["sun_az"] >= 0) & (r["sun_az"] < 360))
    assert np.all((r["earth_az"] >= 0) & (r["earth_az"] < 360))
    assert np.max(np.abs(r["sun_el"])) <= 2.5
    assert np.max(np.abs(r["earth_el"])) <= 8.0


@needs_kernels
def test_cache_identical_and_read_only(kernels):
    args = (-84.7906, 29.1957, 2.0, "2027-03-01T00:00:00Z", 6, 30)
    a = eph.sun_earth_series(*args)
    b = eph.sun_earth_series(*args)
    assert a is b
    for arr in a.values():
        assert not arr.flags.writeable
        with pytest.raises(ValueError):
            arr[0] = 0


@needs_kernels
def test_agrees_with_azlcpo(kernels):
    import spiceypy as sp

    if not hasattr(sp, "azlcpo"):
        pytest.skip("spiceypy lacks azlcpo")
    lat, lon = -84.7906, 29.1957
    obs, east, north, up = eph.site_frame(lat, lon, 0.0)
    ets = eph.time_grid("2027-03-01T00:00:00Z", 120, 24)[1][:6]
    for target in ("SUN", "EARTH"):
        az, el = eph.az_el_series(target, ets, obs, east, north, up)
        for i, et in enumerate(ets):
            with eph.SPICE_LOCK:
                st, _lt = sp.azlcpo("ELLIPSOID", target, float(et), "LT+S", False, True, obs, "MOON", "MOON_ME")
            ref_az, ref_el = math.degrees(st[1]), math.degrees(st[2])
            d_az = abs((az[i] - ref_az + 180) % 360 - 180)
            assert d_az < 0.01, (target, i, az[i], ref_az)
            assert abs(el[i] - ref_el) < 0.01, (target, i, el[i], ref_el)
