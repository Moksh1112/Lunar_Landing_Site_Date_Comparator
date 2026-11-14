"""V3 synthetic validation of the terrain skyline algorithm (TRD 4.3 / 9.1). No data files."""

from __future__ import annotations

import math

import numpy as np
import pytest

from app.terrain.interface import MOON_RADIUS_M as R
from app.terrain.sampling import FunctionSampler
from app.terrain.skyline import compute_skyline, destination, ray_distances_km

SITES = [(0.0, 10.0), (-85.5, 30.0)]
IDS = ["equator", "south-pole"]


def _gc(lat0, lon0, lat, lon):
    """Great-circle distance (km) and initial bearing (deg) from the site to points."""
    p1, p2 = math.radians(lat0), np.radians(lat)
    dl = np.radians(lon) - math.radians(lon0)
    a = np.sin((p2 - p1) / 2) ** 2 + math.cos(p1) * np.cos(p2) * np.sin(dl / 2) ** 2
    dist = 2 * R * np.arcsin(np.sqrt(np.clip(a, 0, 1))) / 1000.0
    brg = np.degrees(
        np.arctan2(np.sin(dl) * np.cos(p2), math.cos(p1) * np.sin(p2) - math.sin(p1) * np.cos(p2) * np.cos(dl))
    )
    return dist, brg % 360.0


def _wall(lat0, lon0, centre_km, height=1000.0):
    lo, hi = centre_km - 0.1, centre_km + 0.1

    def f(lat, lon):
        dist, brg = _gc(lat0, lon0, lat, lon)
        inside = (dist >= lo) & (dist <= hi) & (np.abs(brg - 90.0) <= 2.0)
        return np.where(inside, height, 0.0)

    return f


def _flat(lat, lon):
    return np.zeros(np.shape(lat))


def _exact(height, d_km):
    th = d_km * 1000.0 / R
    return math.degrees(math.atan2((R + height) * math.cos(th) - R, (R + height) * math.sin(th)))


@pytest.mark.parametrize("lat,lon", SITES, ids=IDS)
def test_flat_terrain_equals_minus_dip(lat, lon):
    res = compute_skyline(lat, lon, 2.0, FunctionSampler(_flat))
    assert res.dip_deg == pytest.approx(0.0869, abs=1e-3)
    assert np.all(np.abs(res.elev_deg + res.dip_deg) < 0.01)
    assert res.elev_deg.shape == (720,)
    assert res.nodata_fraction == 0.0


@pytest.mark.parametrize("lat,lon", SITES, ids=IDS)
def test_ridge_10km_east(lat, lon):
    res = compute_skyline(lat, lon, 0.0, FunctionSampler(_wall(lat, lon, 10.0)))
    az90 = res.elev_deg[180]
    exact_centre = _exact(1000.0, 10.0)
    exact_edge = _exact(1000.0, 9.9)
    print(f"\nridge {lat}: az90={az90:.4f} exact@10km={exact_centre:.4f} exact@9.9km={exact_edge:.4f} "
          f"block={res.block_dist_km[180]:.3f} az270={res.elev_deg[540]:.5f}")
    assert exact_centre == pytest.approx(5.55, abs=0.01)
    # The wall is 200 m deep: its near edge (9.9 km) gives the larger angle, so the result lies
    # between the far-edge and near-edge exact values (and within 0.07 deg of the 10 km value).
    assert _exact(1000.0, 10.1) - 0.01 <= az90 <= exact_edge + 0.01
    assert az90 == pytest.approx(exact_centre, abs=0.07)
    assert res.block_dist_km[180] == pytest.approx(10.0, abs=0.15)
    assert res.elev_deg[540] == pytest.approx(0.0, abs=0.01)


@pytest.mark.parametrize("lat,lon", SITES, ids=IDS)
def test_far_field_wall_50km(lat, lon):
    near = FunctionSampler(_flat)
    far = FunctionSampler(_wall(lat, lon, 50.0))
    res = compute_skyline(lat, lon, 0.0, near, far)
    az90 = res.elev_deg[180]
    exact = _exact(1000.0, 50.0)
    print(f"\nfar wall {lat}: az90={az90:.4f} exact={exact:.4f} block={res.block_dist_km[180]:.3f}")
    assert az90 == pytest.approx(exact, abs=0.05)
    assert res.block_dist_km[180] == pytest.approx(50.0, abs=0.3)


def test_nodata_patch_counted_and_outside_not():
    lat0, lon0 = -85.5, 30.0

    def patchy(lat, lon):
        dist, brg = _gc(lat0, lon0, lat, lon)
        return np.where((dist > 5) & (dist < 6) & (brg < 90), np.nan, 0.0)

    def footprint(lat, lon):
        dist, _ = _gc(lat0, lon0, lat, lon)
        return dist <= 30.0

    near = FunctionSampler(patchy, footprint=footprint)
    res = compute_skyline(lat0, lon0, 2.0, near, None, max_range_km=100.0)
    assert res.nodata_fraction > 0
    assert np.all(np.isfinite(res.elev_deg))
    # Outside-footprint samples (> 30 km) must not count as nodata: compare with no-patch case.
    clean = compute_skyline(lat0, lon0, 2.0, FunctionSampler(_flat, footprint=footprint), None, max_range_km=100.0)
    assert clean.nodata_fraction == 0.0
    assert np.all(np.isfinite(clean.elev_deg))


def test_site_nan_raises():
    with pytest.raises(ValueError):
        compute_skyline(0.0, 0.0, 2.0, FunctionSampler(lambda lat, lon: np.full(np.shape(lat), np.nan)))


def test_ray_distances():
    d = ray_distances_km()
    assert d[0] == pytest.approx(0.02)
    assert d[999] == pytest.approx(20.0)
    assert np.all(np.diff(d) > 0)
    assert np.sum(d <= 20.0 + 1e-9) == 1000
    assert d[1000] == pytest.approx(20.0 * 1.01)
    assert np.allclose(d[1001:] / d[1000:-1], 1.01)
    assert d[-1] <= 400.0 and d[-1] > 400.0 / 1.01


def test_destination():
    az = np.array([[0.0], [90.0]])
    lat, lon = destination(0.0, 0.0, az, np.array([[2 * math.pi * R / 360.0 / 1000.0]]))
    assert lat[0, 0] == pytest.approx(1.0, abs=1e-6)
    assert lat[1, 0] == pytest.approx(0.0, abs=1e-9)
    assert lon[1, 0] == pytest.approx(1.0, abs=1e-6)
    # 1 deg of arc on the Moon (R = 1,737.4 km) is 30.32 km (111.2 km is the Earth value).
    lat, _ = destination(0.0, 0.0, np.array([[0.0]]), np.array([[30.3223]]))
    assert lat[0, 0] == pytest.approx(1.0, abs=0.001)


def test_performance_flat_400km():
    s = FunctionSampler(_flat)
    res = compute_skyline(-85.5, 30.0, 2.0, s, s, max_range_km=400.0)
    print(f"\nperf: {res.n_samples} samples in {res.elapsed_s:.2f}s")
    assert res.elapsed_s < 5.0
