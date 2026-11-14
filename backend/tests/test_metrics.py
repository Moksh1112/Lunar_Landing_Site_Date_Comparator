import json
from datetime import datetime
from pathlib import Path

import numpy as np
import pytest

from app.metrics import METRIC_KEYS, deltas, scenario_metrics

H = 3600.0
FIXTURE = Path(__file__).resolve().parents[2] / "fixtures" / "compare.ok.json"


def test_scenario_metrics_known_series():
    t = np.arange(6) * H
    sun_m = np.array([-1, 1, 3, -1, -1, 2], dtype=float)
    sun_el = np.array([-1, 1, 3, -1, -1, 2], dtype=float) + 0.5
    earth_m = np.array([1, 1, 1, 1, -1, -1], dtype=float)
    m, w = scenario_metrics(t, sun_el, sun_m, earth_m, mission_hours=5.0)
    assert set(m) == set(METRIC_KEYS)
    assert m["sun_hours"] == 2.9  # 2.25 + 0.667 = 2.9167
    assert m["sun_pct"] == 58.3
    assert m["earth_hours"] == 3.5
    assert m["both_hours"] == pytest.approx(2.25, abs=0.06)
    assert m["sun_el_max_deg"] == 3.5
    assert m["sun_el_mean_up_deg"] == pytest.approx((1.5 + 3.5 + 2.5) / 3, abs=1e-3)
    assert m["longest_dark_h"] == 1.6  # 5700 s
    assert m["longest_blackout_h"] == 1.5  # 3.5h..5h
    assert len(w["sun"]) == 2 and len(w["earth"]) == 1 and len(w["both"]) == 1
    assert w["earth"][0].start_censored and not w["earth"][0].end_censored


def test_never_visible_metrics():
    t = np.arange(4) * H
    m, w = scenario_metrics(t, -np.ones(4), -np.ones(4), -np.ones(4), 3.0)
    assert m["sun_hours"] == 0.0 and m["sun_pct"] == 0.0
    assert m["sun_el_mean_up_deg"] is None
    assert m["longest_dark_h"] == 3.0 and m["longest_blackout_h"] == 3.0
    assert w == {"sun": [], "earth": [], "both": []}


def test_all_visible_metrics():
    t = np.arange(4) * H
    m, w = scenario_metrics(t, np.full(4, 2.0), np.ones(4), np.ones(4), 3.0)
    assert m["sun_pct"] == 100.0 and m["both_pct"] == 100.0
    assert m["longest_dark_h"] == 0.0
    assert w["sun"][0].start_censored and w["sun"][0].end_censored


def test_rounding_degrees_three_hours_one():
    t = np.arange(3) * H
    m, _ = scenario_metrics(t, np.array([1.23456, 1.0, 1.0]), np.ones(3), np.ones(3), 2.0)
    assert m["sun_el_max_deg"] == 1.235
    assert m["sun_el_mean_up_deg"] == 1.078


def test_deltas_sign_and_none():
    a = {k: 10.0 for k in METRIC_KEYS}
    b = {k: 4.0 for k in METRIC_KEYS}
    a["sun_el_max_deg"], b["sun_el_max_deg"] = 1.5004, 0.2
    d = deltas(a, b)
    assert d["sun_hours"] == 6.0
    assert d["sun_el_max_deg"] == 1.3
    a["sun_el_mean_up_deg"] = None
    assert deltas(a, b)["sun_el_mean_up_deg"] is None
    b["sun_el_mean_up_deg"] = None
    a["sun_el_mean_up_deg"] = 1.0
    assert deltas(a, b)["sun_el_mean_up_deg"] is None
    assert deltas(b, a)["sun_hours"] == -6.0


# ---- consistency with synthetic fixtures ----

def _sky_at(elev, az):
    x = (np.asarray(az) % 360.0) / 0.5
    i0 = np.floor(x).astype(int) % 720
    i1 = (i0 + 1) % 720
    f = x - np.floor(x)
    e = np.asarray(elev)
    return e[i0] * (1 - f) + e[i1] * f


def _unix(s):
    return datetime.fromisoformat(s).timestamp()


@pytest.mark.parametrize("idx", [0, 1])
def test_matches_compare_ok_fixture(idx):
    sc = json.loads(FIXTURE.read_text())["scenarios"][idx]
    s, sky = sc["series"], sc["skyline"]["elev_deg"]
    t = np.array(s["t_unix"], dtype=float)
    sun_m = np.array(s["sun_el"]) - _sky_at(sky, s["sun_az"])
    earth_m = np.array(s["earth_el"]) - _sky_at(sky, s["earth_az"])
    assert list((sun_m > 0).astype(int)) == s["sun_vis"]
    assert list((earth_m > 0).astype(int)) == s["earth_vis"]
    mission_h = (t[-1] - t[0]) / H
    m, w = scenario_metrics(t, np.array(s["sun_el"]), sun_m, earth_m, mission_h)
    fm = sc["metrics"]
    for k in METRIC_KEYS:
        if fm[k] is None:
            assert m[k] is None
        elif k.endswith("_deg"):
            assert m[k] == pytest.approx(fm[k], abs=0.01)
        else:
            assert m[k] == pytest.approx(fm[k], abs=0.1), k
    for name in ("sun", "earth", "both"):
        fw = sc["windows"][name]
        assert len(w[name]) == len(fw), name
        for got, exp in zip(w[name], fw):
            assert got.start_unix == pytest.approx(_unix(exp["start"]), abs=1)
            assert got.end_unix == pytest.approx(_unix(exp["end"]), abs=1)
            assert got.start_censored == exp["start_censored"]
            assert got.end_censored == exp["end_censored"]
