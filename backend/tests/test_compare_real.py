"""Real-mode POST /api/v1/compare (P2 S2.2/S2.3). Needs local kernels (and the far DEM for terrain cases);
skips cleanly where the data is absent (CI)."""
import copy
import os
import time
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.ephemeris.spice import _reset_for_tests
from app.main import create_app
from app.settings import Settings

DATA = Path(os.environ.get("AZX_DATA_DIR") or "C:/azelux-data")
KERNELS = ["naif0012.tls", "de440s.bsp", "pck00011.tpc", "moon_pa_de440_200625.bpc", "moon_de440_250416.tf"]
HAVE_KERNELS = all((DATA / "kernels" / k).is_file() for k in KERNELS)
HAVE_FAR = (DATA / "dem" / "far_160m.tif").is_file() or (DATA / "dem" / "LDEM_80S_80MPP_ADJ.TIF").is_file()

needs_kernels = pytest.mark.skipif(not HAVE_KERNELS, reason=f"SPICE kernels not found in {DATA / 'kernels'}")
needs_terrain = pytest.mark.skipif(not (HAVE_KERNELS and HAVE_FAR), reason=f"kernels/DEM not found in {DATA}")


def body(site_a: dict, site_b: dict, start_b: str = "2027-03-01T00:00:00Z", mode: str = "site_vs_site") -> dict:
    return {
        "mode": mode,
        "scenarios": [
            {"id": "A", "label": "Plan A", "site": site_a, "start_utc": "2027-03-01T00:00:00Z", "mission_hours": 708},
            {"id": "B", "label": "Plan B", "site": site_b, "start_utc": start_b, "mission_hours": 708},
        ],
    }


@pytest.fixture()
def real_client():
    _reset_for_tests()
    with TestClient(create_app(Settings(use_mock=False, data_dir=DATA))) as client:
        yield client
    _reset_for_tests()


@needs_terrain
def test_real_compare_two_pole_sites(real_client):
    started = time.perf_counter()
    r = real_client.post("/api/v1/compare", json=body({"site_id": "im2-athena"}, {"site_id": "im2-intended"}))
    elapsed = time.perf_counter() - started
    assert r.status_code == 200, r.text
    data = r.json()
    a, b = data["scenarios"]
    for s in (a, b):
        assert s["meta"]["data_label"] == "REAL"
        assert s["meta"]["horizon_mode"] in ("terrain", "terrain_coarse")
        assert s["meta"]["dem"]
        assert len(s["series"]["t_unix"]) == 4249  # 708 h at 10 min, both ends
        assert len(s["skyline"]["elev_deg"]) == 720
        m = s["metrics"]
        assert 0 <= m["sun_pct"] <= 100 and 0 <= m["earth_pct"] <= 100
        assert m["both_hours"] <= min(m["sun_hours"], m["earth_hours"]) + 0.1
        assert s["verdict"]["level"] in ("green", "amber", "red")
    assert a["site"]["site_id"] == "im2-athena" and b["site"]["lat_deg"] == -84.78
    assert data["deltas"]["sun_hours"] == pytest.approx(a["metrics"]["sun_hours"] - b["metrics"]["sun_hours"], abs=0.11)
    print(f"\nreal compare (2 pole sites, 708 h, 10 min): {elapsed:.2f} s, "
          f"A sun {a['metrics']['sun_pct']}% earth {a['metrics']['earth_pct']}% | "
          f"B sun {b['metrics']['sun_pct']}% earth {b['metrics']['earth_pct']}%")


@needs_kernels
def test_real_compare_geometric_site_and_date_shift(real_client):
    im1 = {"site_id": "im1-odysseus"}  # north of -80.7: geometric horizon only
    r = real_client.post("/api/v1/compare", json=body(im1, im1, start_b="2027-03-15T00:00:00Z", mode="date_shift"))
    assert r.status_code == 200, r.text
    data = r.json()
    for s in data["scenarios"]:
        assert s["meta"]["horizon_mode"] == "geometric"
        assert s["meta"]["dem"] is None and s["skyline"]["block_dist_km"] is None
    assert any("geometric horizon only" in note for note in data["limitations"])
    # a two-week shift changes the Sun geometry
    assert data["scenarios"][0]["series"]["sun_el"][:10] != data["scenarios"][1]["series"]["sun_el"][:10]


@needs_kernels
def test_real_compare_custom_coordinates_and_unknown_site(real_client):
    payload = body({"lat_deg": 10.0, "lon_east_deg": 20.0, "name": "Near side test point"}, {"site_id": "im1-odysseus"})
    r = real_client.post("/api/v1/compare", json=payload)
    assert r.status_code == 200, r.text
    assert r.json()["scenarios"][0]["site"] == {"site_id": None, "name": "Near side test point",
                                                "lat_deg": 10.0, "lon_east_deg": 20.0}
    bad = copy.deepcopy(payload)
    bad["scenarios"][1]["site"] = {"site_id": "no-such-site"}
    r = real_client.post("/api/v1/compare", json=bad)
    assert r.status_code == 404 and r.json()["error"]["code"] == "NOT_FOUND"


def test_real_compare_without_kernels_is_internal(tmp_path):
    _reset_for_tests()
    client = TestClient(create_app(Settings(use_mock=False, data_dir=tmp_path)))
    r = client.post("/api/v1/compare", json=body({"site_id": "im1-odysseus"}, {"site_id": "im1-odysseus"}))
    assert r.status_code == 500 and r.json()["error"]["code"] == "INTERNAL"
    assert "Traceback" not in r.text
