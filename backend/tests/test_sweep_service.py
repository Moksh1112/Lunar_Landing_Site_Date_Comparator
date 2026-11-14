"""Best-date sweep service (TRD 5.4). Pure helpers run anywhere; the ephemeris tests need local kernels."""
import os
import time
from pathlib import Path

import numpy as np
import pytest

from app.api.models import SweepRequest
from app.ephemeris.spice import _reset_for_tests, load_kernels
from app.sweep import service
from app.sweep.service import rank_key, run_sweep, slice_window
from app.terrain.interface import N_AZ, SkylineResult

DATA = Path(os.environ.get("AZX_DATA_DIR") or "C:/azelux-data")
KERNELS = ["naif0012.tls", "de440s.bsp", "pck00011.tpc", "moon_pa_de440_200625.bpc", "moon_de440_250416.tf"]
HAVE_KERNELS = all((DATA / "kernels" / k).is_file() for k in KERNELS)
HAVE_FAR = (DATA / "dem" / "far_160m.tif").is_file() or (DATA / "dem" / "LDEM_80S_80MPP_ADJ.TIF").is_file()
needs_kernels = pytest.mark.skipif(not HAVE_KERNELS, reason=f"SPICE kernels not found in {DATA / 'kernels'}")
needs_terrain = pytest.mark.skipif(not (HAVE_KERNELS and HAVE_FAR), reason=f"kernels/DEM not found in {DATA}")


@pytest.fixture(autouse=True)
def _kernels():
    if HAVE_KERNELS:
        load_kernels(DATA / "kernels", KERNELS)
    yield
    _reset_for_tests()


def _day(date, level, both, dark):
    return {"date": date, "verdict": {"level": level, "failed": []},
            "metrics": {"both_hours": both, "longest_dark_h": dark}}


def test_rank_key_orders_level_then_both_then_dark_then_date():
    days = [
        _day("2027-03-01", "red", 500, 1),
        _day("2027-03-02", "amber", 100, 5),
        _day("2027-03-03", "green", 50, 9),
        _day("2027-03-04", "green", 80, 9),
        _day("2027-03-05", "green", 80, 3),
        _day("2027-03-06", "green", 80, 3),
    ]
    order = [d["date"] for d in sorted(days, key=rank_key)]
    assert order == ["2027-03-05", "2027-03-06", "2027-03-04", "2027-03-03", "2027-03-02", "2027-03-01"]


def test_slice_window_on_grid_and_interpolated_end():
    t = np.arange(0, 7200.0 + 1, 1800.0)  # 0..2 h, 30 min
    v = t / 1800.0
    ts, (vs,) = slice_window(t, [v], 1800.0, 5400.0)
    assert ts.tolist() == [1800.0, 3600.0, 5400.0] and vs.tolist() == [1.0, 2.0, 3.0]
    ts, (vs,) = slice_window(t, [v], 0.0, 4500.0)  # end between samples: appended and interpolated
    assert ts.tolist() == [0.0, 1800.0, 3600.0, 4500.0]
    assert vs[-1] == pytest.approx(2.5)


class FlatTerrain:
    def skyline(self, lat, lon, h):
        return SkylineResult(np.zeros(N_AZ), None, "geometric", None, "REAL")

    def site_height(self, lat, lon):
        return 0.0


def _req(start="2027-03-01", end="2027-03-10", hours=100, **kw):
    site = {"site_id": None, "name": "t", "lat_deg": -85.0, "lon_east_deg": 20.0}
    return SweepRequest.model_validate({"site": site, "range_start": start, "range_end": end,
                                        "mission_hours": hours, **kw})


@needs_kernels
def test_sweep_structure_and_ranking():
    out = run_sweep(_req(), FlatTerrain())
    days = out["days"]
    assert [d["date"] for d in days] == sorted(d["date"] for d in days) and len(days) == 10
    assert sorted(d["rank"] for d in days) == list(range(1, 11))
    assert sum(d["refined"] for d in days) == 5
    by_rank = sorted(days, key=lambda d: d["rank"])
    assert out["top"] == [d["date"] for d in by_rank[:5]]
    assert all(d["refined"] for d in by_rank[:5]) and not any(d["refined"] for d in by_rank[5:])
    assert [rank_key(d) for d in by_rank[:5]] == sorted(rank_key(d) for d in by_rank[:5])
    assert [rank_key(d) for d in by_rank[5:]] == sorted(rank_key(d) for d in by_rank[5:])
    assert out["meta"]["step_minutes"] == 30 and out["meta"]["data_label"] == "REAL"


@needs_kernels
def test_sweep_small_range_and_fractional_end():
    out = run_sweep(_req(end="2027-03-03", hours=10.25), FlatTerrain())
    assert len(out["days"]) == 3 and len(out["top"]) == 3
    assert sorted(d["rank"] for d in out["days"]) == [1, 2, 3]
    assert all(d["metrics"]["sun_hours"] <= 10.25 for d in out["days"])


@needs_kernels
def test_refined_agrees_with_coarse(monkeypatch):
    with_refine = run_sweep(_req(end="2027-03-03", hours=200), FlatTerrain())
    monkeypatch.setattr(service, "TOP_N", 0)  # nothing refined: 30-min metrics for every day
    pure30 = run_sweep(_req(end="2027-03-03", hours=200), FlatTerrain())
    assert not any(d["refined"] for d in pure30["days"])
    coarse = {d["date"]: d for d in pure30["days"]}
    for fine in with_refine["days"]:
        assert fine["refined"]
        c = coarse[fine["date"]]
        assert abs(c["metrics"]["sun_pct"] - fine["metrics"]["sun_pct"]) < 3.0
        assert abs(c["metrics"]["earth_pct"] - fine["metrics"]["earth_pct"]) < 3.0


@needs_terrain
def test_sweep_60_days_im2_athena_timing():
    from app.terrain.real import RealTerrain
    terrain = RealTerrain(DATA)
    req = SweepRequest.model_validate({"site": {"site_id": "im2-athena"}, "range_start": "2027-03-01",
                                       "range_end": "2027-04-29", "mission_hours": 708})
    started = time.perf_counter()
    out = run_sweep(req, terrain)
    elapsed = time.perf_counter() - started
    by_date = {d["date"]: d for d in out["days"]}
    print(f"\nsweep 60 days x 708 h, IM-2 Athena: {elapsed:.2f} s; horizon {out['meta']['horizon_mode']}")
    for dt in out["top"]:
        d = by_date[dt]
        print(f"  #{d['rank']} {dt} {d['verdict']['level']} both {d['metrics']['both_hours']} h "
              f"dark {d['metrics']['longest_dark_h']} h refined={d['refined']}")
    assert len(out["days"]) == 60 and len(out["top"]) == 5
    assert elapsed < 15.0
