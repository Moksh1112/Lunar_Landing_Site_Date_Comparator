import base64
import json
import math
from pathlib import Path

import numpy as np
import pytest

from app.terrain import (
    MOON_RADIUS_M,
    MockTerrain,
    NotInCoverage,
    dip_deg,
    geometric_skyline,
    get_terrain_provider,
)

FIXTURES = Path(__file__).resolve().parents[2] / "fixtures"


def _load(name: str) -> dict:
    return json.loads((FIXTURES / name).read_text(encoding="utf-8"))


def test_dip_deg_two_metres() -> None:
    d = dip_deg(0.0, 2.0)
    assert d == pytest.approx(0.0869, abs=1e-4)
    assert d == math.degrees(math.acos(MOON_RADIUS_M / (MOON_RADIUS_M + 2.0)))


def test_geometric_skyline() -> None:
    s = geometric_skyline(2.0)
    assert s.elev_deg.shape == (720,)
    assert np.all(s.elev_deg == -dip_deg(0.0, 2.0))
    assert s.block_dist_km is None
    assert s.mode == "geometric"


@pytest.mark.parametrize(
    ("lat", "mode"),
    [(-85.5, "terrain"), (-80.7, "terrain"), (-80.69, "geometric"), (10.0, "geometric")],
)
def test_coverage(lat: float, mode: str) -> None:
    assert MockTerrain(FIXTURES).coverage(lat, 0.0) == mode


def test_polar_skyline_matches_fixture() -> None:
    fx = _load("skyline.ok.json")
    s = MockTerrain(FIXTURES).skyline(-85.5, 30.0, 2.0)
    assert s.elev_deg.shape == (720,)
    assert np.array_equal(s.elev_deg, np.array(fx["skyline"]["elev_deg"]))
    assert s.block_dist_km is not None
    assert np.array_equal(s.block_dist_km, np.array(fx["skyline"]["block_dist_km"]))
    assert s.data_label == "SYNTHETIC"
    assert s.mode == "terrain"
    assert s.dem_name == fx["meta"]["dem"]


def test_non_polar_skyline_is_geometric() -> None:
    s = MockTerrain(FIXTURES).skyline(10.0, 0.0, 2.0)
    assert s.mode == "geometric"
    assert s.data_label == "REAL"


def test_tile() -> None:
    fx = _load("terrain-tile.ok.json")
    t = MockTerrain(FIXTURES).terrain_tile(-85.5, 30.0, 20.0)
    assert t.heights_m.shape == (256, 256)
    assert t.heights_m.dtype == np.float32
    assert t.min_m == pytest.approx(fx["min_m"], abs=0.1)
    assert t.max_m == pytest.approx(fx["max_m"], abs=0.1)
    assert float(t.heights_m.min()) == pytest.approx(fx["min_m"], abs=0.1)
    assert float(t.heights_m.max()) == pytest.approx(fx["max_m"], abs=0.1)
    assert t.site_px == (128, 128)
    assert t.data_label == "SYNTHETIC"
    raw = np.frombuffer(base64.b64decode(fx["heights_m_b64"]), dtype="<f4")
    assert np.array_equal(t.heights_m.ravel(), raw)


def test_tile_outside_coverage() -> None:
    with pytest.raises(NotInCoverage) as ei:
        MockTerrain(FIXTURES).terrain_tile(10.0, 0.0, 20.0)
    assert ei.value.lat_deg == 10.0


def test_real_mode_not_implemented() -> None:
    with pytest.raises(NotImplementedError):
        get_terrain_provider(False, FIXTURES, Path("data"))
    assert isinstance(get_terrain_provider(True, FIXTURES, Path("data")), MockTerrain)
