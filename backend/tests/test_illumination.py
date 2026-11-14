"""PGDA 69 visibility map tests (skipped when the map files are absent)."""
from __future__ import annotations

import math
import os
from pathlib import Path

import pytest

from app.terrain.illumination import EARTH_FILE, SUN_FILE, VisibilityMaps

DATA = Path(os.environ.get("AZX_DATA_DIR", "C:/azelux-data")) / "illumination"
pytestmark = pytest.mark.skipif(
    not ((DATA / SUN_FILE).exists() and (DATA / EARTH_FILE).exists()),
    reason="PGDA 69 maps not present",
)


@pytest.fixture(scope="module")
def maps():
    with VisibilityMaps(DATA) as m:
        yield m


def test_scaling_and_max_sun(maps):
    mx, _, _ = maps.max_fraction("sun")
    assert 0.85 <= mx <= 0.90  # PGDA reports ~0.88-0.89
    emax, _, _ = maps.max_fraction("earth")
    assert 0.0 < emax <= 1.0


def test_pole_finite_and_range_contains_centre(maps):
    f = maps.fractions(-89.9, 129.0)
    for k in ("sun", "earth"):
        assert math.isfinite(f[k]) and 0.0 <= f[k] <= 1.0
        lo, hi = f[f"{k}_range"]
        assert lo <= f[k] <= hi


def test_outside_coverage(maps):
    assert not maps.covers(-80.13, 1.44)
    f = maps.fractions(-80.13, 1.44)
    assert math.isnan(f["sun"]) and math.isnan(f["earth"]) and f["row"] is None


def test_im2_is_inside_square_edge(maps):
    # the square raster reaches ~84.8 S at its edges, so IM-2 (-84.79) is covered
    assert maps.covers(-84.79, 29.2)
    assert math.isfinite(maps.fractions(-84.79, 29.2)["sun"])


def test_candidates_valid(maps):
    cands = maps.find_candidates(5)
    assert len(cands) == 5
    for c in cands:
        assert maps.covers(c["lat"], c["lon_east"])
        assert 0.0 < c["sun"] <= 1.0 and 0.0 <= c["earth"] <= 1.0
    assert cands[0]["sun"] >= cands[-1]["sun"]


def test_bilinear_option():
    with VisibilityMaps(DATA, bilinear=True) as b:
        f = b.fractions(-89.9, 129.0)
        assert 0.0 <= f["sun"] <= 1.0
