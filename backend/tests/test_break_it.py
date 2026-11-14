"""P2 S4 break-it pass: hostile and odd input on every endpoint.

Rules checked everywhere: the status is what the contract says (never 5xx for client input), every error has
the contract shape, and no error text leaks a stack trace, a file path or SPICE toolkit text.
Real-mode cases need the local kernels/DEMs and skip without them (CI); validation cases run in mock mode
because every input check runs before the mock/real branch. Real cases only use sites whose skyline is
already in the cache (or geometric sites), so the run never writes to the data directory.
"""
import copy
import json
import os
import re
import threading
from concurrent.futures import ThreadPoolExecutor
from datetime import timedelta
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.api.models import ErrorResponse
from app.api.routes_api import EPHEMERIS_FIRST_DAY, EPHEMERIS_LAST_DAY
from app.ephemeris.spice import _reset_for_tests
from app.main import create_app
from app.settings import Settings

DATA = Path(os.environ.get("AZX_DATA_DIR") or "C:/azelux-data")
KERNELS = ["naif0012.tls", "de440s.bsp", "pck00011.tpc", "moon_pa_de440_200625.bpc", "moon_de440_250416.tf"]
HAVE_KERNELS = all((DATA / "kernels" / k).is_file() for k in KERNELS)
HAVE_FAR = (DATA / "dem" / "far_160m.tif").is_file() or (DATA / "dem" / "LDEM_80S_80MPP_ADJ.TIF").is_file()
HAVE_SKYLINES = (DATA / "cache" / "skyline_-85.50000_30.00000_2.00.npz").is_file() and (
    DATA / "cache" / "skyline_-85.00000_40.00000_2.00.npz"
).is_file()
needs_real = pytest.mark.skipif(not (HAVE_KERNELS and HAVE_FAR), reason=f"kernels/DEM not found in {DATA}")
needs_skylines = pytest.mark.skipif(
    not (HAVE_KERNELS and HAVE_FAR and HAVE_SKYLINES), reason="cached skylines for the test sites not found"
)

LEAK = re.compile(
    r"Traceback|site-packages|\.py\b|[A-Za-z]:[\\/]|/Users/|/home/|SPICE|CSPICE|Toolkit|spiceypy|=====|"
    r"File \"|azelux-data|pydantic|\bline \d+",
    re.IGNORECASE,
)

FIRST = EPHEMERIS_FIRST_DAY.isoformat()  # 1970-01-01 today; 1900-01-01 once metrics/windows.py handles pre-1970
LAST = EPHEMERIS_LAST_DAY.isoformat()
BEFORE_FIRST = (EPHEMERIS_FIRST_DAY - timedelta(days=1)).isoformat()

SITE_SP = {"lat_deg": -85.5, "lon_east_deg": 30.0}  # cached skyline
SITE_SP2 = {"lat_deg": -85.0, "lon_east_deg": 40.0}  # cached skyline


def scenario(sid: str, **over) -> dict:
    d = {"id": sid, "label": f"Plan {sid}", "site": dict(SITE_SP), "start_utc": "2027-03-01T00:00:00Z",
         "mission_hours": 24}
    d.update(over)
    return d


def compare_body(a: dict | None = None, b: dict | None = None, **top) -> dict:
    d = {"mode": "site_vs_site", "scenarios": [a or scenario("A"), b or scenario("B", site=dict(SITE_SP2))]}
    d.update(top)
    return d


def sweep_body(**over) -> dict:
    d = {"site": dict(SITE_SP), "range_start": "2027-03-01", "range_end": "2027-03-03", "mission_hours": 24}
    d.update(over)
    return d


def check_error(r, status: int | tuple[int, ...], code: str | tuple[str, ...] | None = None) -> dict:
    statuses = (status,) if isinstance(status, int) else status
    assert r.status_code in statuses, f"{r.status_code} {r.text[:300]}"
    assert r.headers["content-type"].startswith("application/json")
    ErrorResponse.model_validate(r.json())  # exact contract shape, no extra keys
    err = r.json()["error"]
    if code is not None:
        assert err["code"] in ((code,) if isinstance(code, str) else code)
    assert not LEAK.search(r.text), f"leaky error text: {r.text[:300]}"
    return err


def raw_json(client, url: str, text: str | bytes, ctype: str = "application/json"):
    data = text.encode() if isinstance(text, str) else text
    return client.post(url, content=data, headers={"content-type": ctype})


@pytest.fixture(scope="module")
def mock() -> TestClient:
    return TestClient(create_app(Settings(use_mock=True, rate_limits_enabled=False)), raise_server_exceptions=False)


@pytest.fixture(scope="module")
def real():
    _reset_for_tests()
    app = create_app(Settings(use_mock=False, data_dir=DATA, rate_limits_enabled=False, warm_up=False))
    yield TestClient(app, raise_server_exceptions=False), app
    _reset_for_tests()


# --------------------------------------------------------------------------- compare: body level

MALFORMED = [
    ("not json", b"{not json"),
    ("empty body", b""),
    ("truncated", b'{"mode": "site_vs_site", "scenarios": ['),
    ("json array", b"[]"),
    ("json null", b"null"),
    ("json string", b'"hello"'),
    ("json number", b"42"),
    ("bad utf-8", b'\xff\xfe{"a": 1}'),
    ("deep nesting", b"[" * 5000 + b"]" * 5000),
    ("nul bytes", b'{"mode": "\x00"}'),
    ("trailing garbage", json.dumps(compare_body()).encode() + b" xyz"),
]


@pytest.mark.parametrize("name,payload", MALFORMED, ids=[m[0] for m in MALFORMED])
@pytest.mark.parametrize("url", ["/api/v1/compare", "/api/v1/sweep"])
def test_malformed_bodies_are_400(mock, url, name, payload):
    check_error(raw_json(mock, url, payload), 400, "INVALID_INPUT")


def test_wrong_content_type_is_400(mock):
    check_error(raw_json(mock, "/api/v1/compare", json.dumps(compare_body()), "text/plain"), 400, "INVALID_INPUT")


def test_body_over_64kb_is_413(mock):
    big = compare_body()
    big["scenarios"][0]["label"] = "x" * 70_000
    check_error(mock.post("/api/v1/compare", json=big), 413, "RANGE_TOO_LARGE")


def test_wrong_http_methods_keep_the_error_shape(mock):
    check_error(mock.get("/api/v1/compare"), 405)
    check_error(mock.get("/api/v1/sweep"), 405)
    check_error(mock.post("/api/v1/skyline"), 405)
    check_error(mock.post("/api/v1/terrain-tile"), 405)
    check_error(mock.post("/api/v1/sites"), 405)
    check_error(mock.post("/health"), 405)
    check_error(mock.delete("/api/v1/compare"), 405)


@pytest.mark.parametrize("path", ["/nope", "/api/v1/nope", "/api/v1/../../etc/passwd", "/api/v1/%2e%2e/%2e%2e/etc/passwd",
                                  "/api/v1/compare/extra", "//", "/api/v1/sites/..%5c..%5cwindows"])
def test_unknown_paths_are_404(mock, path):
    check_error(mock.get(path), (404, 405))


# --------------------------------------------------------------------------- compare: numbers

NONFINITE = {
    "NaN mission": ('"mission_hours": 24', '"mission_hours": NaN', 400),
    "Infinity mission": ('"mission_hours": 24', '"mission_hours": Infinity', (400, 413)),
    "-Infinity mission": ('"mission_hours": 24', '"mission_hours": -Infinity', 400),
    "1e999 mission": ('"mission_hours": 24', '"mission_hours": 1e999', (400, 413)),
    "NaN lat": ('"lat_deg": -85.5', '"lat_deg": NaN', 400),
    "Infinity lat": ('"lat_deg": -85.5', '"lat_deg": Infinity', 400),
    "-Infinity lon": ('"lon_east_deg": 30.0', '"lon_east_deg": -Infinity', 400),
    "NaN lon": ('"lon_east_deg": 30.0', '"lon_east_deg": NaN', 400),
}


@pytest.mark.parametrize("name", list(NONFINITE))
def test_nonfinite_json_numbers_are_4xx_not_500(mock, name):
    old, new, status = NONFINITE[name]
    text = json.dumps(compare_body()).replace(old, new, 1)
    assert new in text
    check_error(raw_json(mock, "/api/v1/compare", text), status)


def test_nonfinite_in_optional_fields(mock):
    base = json.dumps(compare_body())[:-1]
    for extra, status in [
        (', "observer_height_m": NaN}', 400),
        (', "observer_height_m": Infinity}', 400),
        (', "step_minutes": NaN}', 400),
        (', "thresholds": {"sun_pct_min": NaN}}', 400),
        (', "thresholds": {"earth_pct_min": Infinity}}', 400),
    ]:
        check_error(raw_json(mock, "/api/v1/compare", base + extra), status)


def test_sweep_nonfinite_numbers(mock):
    base = json.dumps(sweep_body())
    for repl, status in [("NaN", 400), ("Infinity", (400, 413)), ("-Infinity", 400)]:
        text = base.replace('"mission_hours": 24', f'"mission_hours": {repl}')
        check_error(raw_json(mock, "/api/v1/sweep", text), status)


@pytest.mark.parametrize(
    "mission,status",
    [(-5, 400), (0, 400), (0.5, 400), (0.999999, 400), (8760.0001, 413), (8761, 413), (1e300, 413), (1e308, 413),
     (10**30, 413), (-1e308, 400), ("24", (200, 400)), (True, (200, 400)), (None, 400), ([], 400), ({}, 400), ("x", 400)],
)
def test_mission_hours_bounds(mock, mission, status):
    r = mock.post("/api/v1/compare", json=compare_body(scenario("A", mission_hours=mission)))
    if r.status_code == 200:
        assert status == 200 or 200 in status  # lax string/bool coercion only; never a 5xx
    else:
        check_error(r, status)


@pytest.mark.parametrize("step", [0, -1, 61, 100, 1.5, 0.5, None, "x", [], {}, 10**30, 1e308])
def test_step_minutes_out_of_range_is_400(mock, step):
    check_error(mock.post("/api/v1/compare", json=compare_body(step_minutes=step)), 400, "INVALID_INPUT")


@pytest.mark.parametrize("step", [1, 60])
def test_step_minutes_edges_allowed(mock, step):
    assert mock.post("/api/v1/compare", json=compare_body(step_minutes=step)).status_code == 200


def test_sample_cap_is_413(mock):
    body = compare_body(scenario("A", mission_hours=8760), scenario("B", mission_hours=8760), step_minutes=1)
    check_error(mock.post("/api/v1/compare", json=body), 413, "RANGE_TOO_LARGE")


@pytest.mark.parametrize("height,status", [(-0.001, 400), (20.001, 400), (21, 400), (1e308, 400), ("x", 400)])
def test_observer_height_bounds(mock, height, status):
    check_error(mock.post("/api/v1/compare", json=compare_body(observer_height_m=height)), status, "INVALID_INPUT")


@pytest.mark.parametrize("height", [0, 20])
def test_observer_height_edges_allowed(mock, height):
    assert mock.post("/api/v1/compare", json=compare_body(observer_height_m=height)).status_code == 200


@pytest.mark.parametrize(
    "thr",
    [{"sun_pct_min": 101}, {"sun_pct_min": -1}, {"earth_pct_min": 100.0001}, {"dark_gap_h_max": -1},
     {"blackout_h_max": -0.1}, {"unknown": 1}, {"sun_pct_min": "x"}, {"sun_pct_min": None}, "x", [], 5],
)
def test_threshold_validation(mock, thr):
    check_error(mock.post("/api/v1/compare", json=compare_body(thresholds=thr)), 400, "INVALID_INPUT")


# --------------------------------------------------------------------------- compare: sites

@pytest.mark.parametrize(
    "lat,ok",
    [(89.99, True), (-89.99, True), (89.9899, True), (89.995, False), (-89.995, False), (90, False), (-90, False),
     (91, False), (1e308, False), (-1e308, False), (0, True)],
)
def test_latitude_edges(mock, lat, ok):
    r = mock.post("/api/v1/compare", json=compare_body(scenario("A", site={"lat_deg": lat, "lon_east_deg": 10})))
    if ok:
        assert r.status_code == 200, r.text
    else:
        check_error(r, 400, "INVALID_INPUT")


@pytest.mark.parametrize(
    "lon,ok",
    [(0, True), (-0.0, True), (359.9999, True), (359.99999999, True), (360, False), (360.0000001, False),
     (-0.0001, False), (-180, False), (1e308, False)],
)
def test_longitude_edges(mock, lon, ok):
    r = mock.post("/api/v1/compare", json=compare_body(scenario("A", site={"lat_deg": 0, "lon_east_deg": lon})))
    if ok:
        assert r.status_code == 200, r.text
    else:
        check_error(r, 400, "INVALID_INPUT")


@pytest.mark.parametrize(
    "site",
    [{}, {"lat_deg": -85.5}, {"lon_east_deg": 30}, {"name": "only a name"}, {"site_id": None}, {"site_id": 5},
     {"site_id": ""}, {"site_id": "x" * 65}, {"site_id": "a b"}, {"site_id": "im2-athena" + chr(10)}, {"site_id": "../x"},
     {"site_id": []}, {"lat_deg": "x", "lon_east_deg": 30}, {"lat_deg": None, "lon_east_deg": None},
     {"lat_deg": -85.5, "lon_east_deg": 30, "extra": 1}, {"lat_deg": -85.5, "lon_east_deg": 30, "site": {"a": 1}},
     "x", 5, None, []],
)
def test_malformed_site(mock, site):
    check_error(mock.post("/api/v1/compare", json=compare_body(scenario("A", site=site))), 400, "INVALID_INPUT")


# --------------------------------------------------------------------------- compare: scenarios and labels

def test_same_scenario_id_twice_is_400(mock):
    check_error(mock.post("/api/v1/compare", json=compare_body(scenario("A"), scenario("A"))), 400, "INVALID_INPUT")


@pytest.mark.parametrize("ids", [("A", "C"), ("a", "b"), ("", "B"), (None, "B"), (1, 2)])
def test_bad_scenario_ids(mock, ids):
    body = compare_body(scenario(ids[0]), scenario(ids[1]))
    check_error(mock.post("/api/v1/compare", json=body), 400, "INVALID_INPUT")


@pytest.mark.parametrize("scenarios", [[], [scenario("A")], [scenario("A"), scenario("B"), scenario("A")], None, "x", {}])
def test_scenario_count(mock, scenarios):
    body = compare_body()
    body["scenarios"] = scenarios
    check_error(mock.post("/api/v1/compare", json=body), 400, "INVALID_INPUT")


def test_swapped_order_is_accepted(mock):
    body = compare_body(scenario("B"), scenario("A"))
    assert mock.post("/api/v1/compare", json=body).status_code == 200


@pytest.mark.parametrize("mode", ["", "SITE_VS_SITE", "other", None, 1, [], "site_vs_site "])
def test_bad_mode(mock, mode):
    body = compare_body()
    body["mode"] = mode
    check_error(mock.post("/api/v1/compare", json=body), 400, "INVALID_INPUT")


def test_missing_and_extra_top_level_fields(mock):
    check_error(mock.post("/api/v1/compare", json={}), 400, "INVALID_INPUT")
    body = compare_body()
    del body["mode"]
    check_error(mock.post("/api/v1/compare", json=body), 400, "INVALID_INPUT")
    check_error(mock.post("/api/v1/compare", json=compare_body(foo="bar")), 400, "INVALID_INPUT")
    nested = compare_body()
    nested["scenarios"][0]["extra"] = {"deep": {"deeper": [1, 2, 3]}}
    err = check_error(mock.post("/api/v1/compare", json=nested), 400, "INVALID_INPUT")
    assert err["details"][0]["field"] == "scenarios[0].extra"


def test_duplicate_json_keys_do_not_crash(mock):
    text = json.dumps(compare_body()).replace('"mode": "site_vs_site"', '"mode": "free", "mode": "site_vs_site"', 1)
    assert raw_json(mock, "/api/v1/compare", text).status_code == 200  # last key wins, as in every JSON parser
    text = json.dumps(compare_body()).replace('"mode": "site_vs_site"', '"mode": "site_vs_site", "mode": "bogus"', 1)
    check_error(raw_json(mock, "/api/v1/compare", text), 400, "INVALID_INPUT")


@pytest.mark.parametrize("label,ok", [
    ("", False), ("x", True), ("x" * 40, True), ("x" * 41, False), ("\U0001F680" * 40, True), ("\U0001F680" * 41, False),
    ("\u05e9\u05dc\u05d5\u05dd \u0645\u0631\u062d\u0628\u0627", True), ("<script>alert(1)</script>", True),
    ("line\nbreak", True), ("\x00", True), ("  ", True), (None, False), (5, False), (["a"], False), ("e\u0301" * 20, True),
])
def test_label_rules(mock, label, ok):
    r = mock.post("/api/v1/compare", json=compare_body(scenario("A", label=label)))
    if ok:
        assert r.status_code == 200, r.text
    else:
        check_error(r, 400, "INVALID_INPUT")


# --------------------------------------------------------------------------- compare: start_utc

@pytest.mark.parametrize(
    "start",
    ["2027-03-01T00:00:00+00:00", "2027-03-01T00:00:00+05:30", "2027-02-30T00:00:00Z", "2027-13-01T00:00:00Z",
     "2027-03-01T24:00:00Z", "2027-03-01T00:60:00Z", "2027-03-01", "2027-03-01T00:00:00", "2027-03-01T00:00:00z",
     "20270301T000000Z", "2027-03-01T00Z", "2027-03-01T00:00Z", "2027-03-01 00:00:00Z", "", " ", "Z", "now",
     "2027-03-01T00:00:00.1234567890Z", "2027-03-01T00:00:00Z ", "\uff12\uff10\uff12\uff17-03-01T00:00:00Z",
     "2027-03-01T00:00:00Z\n", None, 5, 1.5, True, [], {}],
)
def test_start_utc_formats_rejected(mock, start):
    check_error(mock.post("/api/v1/compare", json=compare_body(scenario("A", start_utc=start))), 400, "INVALID_INPUT")


@pytest.mark.parametrize(
    "start,hours",
    [("1800-01-01T00:00:00Z", 24), (BEFORE_FIRST + "T00:00:00Z", 24), ("0001-01-01T00:00:00Z", 24),
     ("0099-06-01T00:00:00Z", 24), ("2200-01-01T00:00:00Z", 24), ("9999-12-31T00:00:00Z", 24),
     ("2150-01-01T00:00:00Z", 24), ("2149-12-30T00:00:00Z", 1000), ("2149-12-31T00:00:00Z", 25),
     (BEFORE_FIRST + "T23:59:59Z", 1), ("1899-07-20T20:17:40Z", 24)],
)
def test_start_utc_outside_ephemeris_is_400_not_500(mock, start, hours):
    err = check_error(mock.post("/api/v1/compare", json=compare_body(scenario("A", start_utc=start, mission_hours=hours))),
                      400, "INVALID_INPUT")
    assert err["details"][0]["field"] == "scenarios[0].start_utc"


@pytest.mark.parametrize(
    "start,hours",
    [(FIRST + "T00:00:00Z", 24), ("2149-12-30T00:00:00Z", 24), ("2027-03-01T00:00:00.5Z", 24),
     ("2027-03-01T23:59:59Z", 1)],
)
def test_start_utc_edges_allowed(mock, start, hours):
    assert mock.post("/api/v1/compare", json=compare_body(scenario("A", start_utc=start, mission_hours=hours))).status_code == 200


# --------------------------------------------------------------------------- sweep

def test_sweep_range_end_before_start(mock):
    check_error(mock.post("/api/v1/sweep", json=sweep_body(range_end="2027-02-28")), 400, "INVALID_INPUT")


def test_sweep_one_day_range_allowed(mock):
    assert mock.post("/api/v1/sweep", json=sweep_body(range_end="2027-03-01")).status_code == 200


@pytest.mark.parametrize("end,status", [("2027-08-30", 200), ("2027-08-31", 413), ("2030-01-01", 413)])
def test_sweep_range_cap(mock, end, status):
    r = mock.post("/api/v1/sweep", json=sweep_body(range_end=end))
    assert r.status_code == status, r.text
    if status != 200:
        check_error(r, 413, "RANGE_TOO_LARGE")


@pytest.mark.parametrize(
    "field,value",
    [("range_start", "2027-03-01T00:00:00Z"), ("range_start", "20270301"), ("range_start", "2027-02-30"),
     ("range_start", "2027-3-1"), ("range_start", ""), ("range_start", None), ("range_start", 20270301),
     ("range_start", 1.5), ("range_start", True), ("range_start", []), ("range_end", "\uff12\uff10\uff12\uff17-03-03"),
     ("range_end", "2027-03-03 "), ("range_end", "0000-01-01"), ("range_end", "10000-01-01"), ("range_end", "2027-00-10")],
)
def test_sweep_bad_dates(mock, field, value):
    check_error(mock.post("/api/v1/sweep", json=sweep_body(**{field: value})), 400, "INVALID_INPUT")


@pytest.mark.parametrize(
    "start,end",
    [("1800-01-01", "1800-01-05"), (BEFORE_FIRST, FIRST), ("0001-01-01", "0001-01-05"), ("2200-01-01", "2200-01-05"),
     ("9999-12-25", "9999-12-31"), ("2149-12-30", "2150-01-10"), ("2150-01-01", "2150-01-02"), ("2149-12-31", "2149-12-31")],
)
def test_sweep_dates_outside_ephemeris_are_400_not_500(mock, start, end):
    # 2149-12-31 with a 24 h mission ends 2150-01-01: outside the allowed span too
    check_error(mock.post("/api/v1/sweep", json=sweep_body(range_start=start, range_end=end)), 400, "INVALID_INPUT")


def test_sweep_last_allowed_window(mock):
    assert mock.post("/api/v1/sweep", json=sweep_body(range_start="2149-12-29", range_end="2149-12-30")).status_code == 200
    assert mock.post("/api/v1/sweep", json=sweep_body(range_start=FIRST, range_end="1900-01-03")).status_code == 200


@pytest.mark.parametrize("mission,status", [(0, 400), (-1, 400), (0.5, 400), (8761, 413), (1e300, 413), (None, 400)])
def test_sweep_mission_hours(mock, mission, status):
    check_error(mock.post("/api/v1/sweep", json=sweep_body(mission_hours=mission)), status)


@pytest.mark.parametrize("site", [{}, {"site_id": ""}, {"lat_deg": 89.995, "lon_east_deg": 0}, {"lat_deg": 0, "lon_east_deg": 360}, "x", None])
def test_sweep_bad_site(mock, site):
    check_error(mock.post("/api/v1/sweep", json=sweep_body(site=site)), 400, "INVALID_INPUT")


def test_sweep_extra_and_missing_fields(mock):
    check_error(mock.post("/api/v1/sweep", json=sweep_body(foo=1)), 400, "INVALID_INPUT")
    check_error(mock.post("/api/v1/sweep", json={}), 400, "INVALID_INPUT")
    check_error(mock.post("/api/v1/sweep", json=sweep_body(thresholds={"dark_gap_h_max": -1})), 400, "INVALID_INPUT")


# --------------------------------------------------------------------------- skyline / terrain-tile query strings

def _q(**kw) -> str:
    return "&".join(f"{k}={v}" for k, v in kw.items())


@pytest.mark.parametrize("url", ["/api/v1/skyline", "/api/v1/terrain-tile"])
@pytest.mark.parametrize(
    "qs",
    ["lat_deg=nan&lon_east_deg=30", "lat_deg=inf&lon_east_deg=30", "lat_deg=-inf&lon_east_deg=30",
     "lat_deg=-Infinity&lon_east_deg=30", "lat_deg=1e999&lon_east_deg=30", "lat_deg=-85.5&lon_east_deg=nan",
     "lat_deg=abc&lon_east_deg=30", "lat_deg=&lon_east_deg=30", "lat_deg=-85.5", "lon_east_deg=30", "",
     "lat_deg=89.995&lon_east_deg=30", "lat_deg=-89.995&lon_east_deg=30", "lat_deg=-85.5&lon_east_deg=360",
     "lat_deg=-85.5&lon_east_deg=-0.001", "lat_deg=-85.5&lon_east_deg=30&foo=1",
     "lat_deg[]=-85.5&lon_east_deg=30", "lat_deg=-85.5&lon_east_deg[]=30", "lat_deg%5B0%5D=-85.5&lon_east_deg=30",
     "lat_deg=-85.5&lon_east_deg=30&observer_height_m=21", "lat_deg=-85.5&lon_east_deg=30&observer_height_m=-1",
     "lat_deg=-85.5&lon_east_deg=30&observer_height_m=nan", "lat_deg=%00&lon_east_deg=30",
     "lat_deg=%ff&lon_east_deg=30", "lat_deg=-85.5%20&lon_east_deg=30x", "lat_deg=0x10&lon_east_deg=30"],
)
def test_query_param_abuse_is_400(mock, url, qs):
    if url.endswith("terrain-tile") and "observer_height_m" in qs:
        qs = qs.replace("observer_height_m", "foo")  # tile has no observer height: unknown field
        qs = qs.replace("=21", "=1").replace("=-1", "=1").replace("=nan", "=1")
    r = mock.get(f"{url}?{qs}")
    check_error(r, 400, "INVALID_INPUT")


@pytest.mark.parametrize("size", ["0", "-1", "40.0001", "41", "nan", "inf", "x", "", "1e999"])
def test_tile_size_bounds(mock, size):
    check_error(mock.get(f"/api/v1/terrain-tile?lat_deg=-85.5&lon_east_deg=30&size_km={size}"), 400, "INVALID_INPUT")


def test_repeated_query_params_do_not_crash(mock):
    for qs in ("lat_deg=-85.5&lat_deg=-85.6&lon_east_deg=30", "lat_deg=-85.5&lon_east_deg=30&lon_east_deg=31&lon_east_deg=x"):
        r = mock.get(f"/api/v1/skyline?{qs}")
        assert r.status_code < 500
        if r.status_code != 200:
            check_error(r, 400, "INVALID_INPUT")


def test_huge_query_string(mock):
    r = mock.get("/api/v1/skyline?lat_deg=-85.5&lon_east_deg=30&x=" + "a" * 8000)
    check_error(r, 400, "INVALID_INPUT")


@pytest.mark.parametrize("lat", [89.99, -89.99, 0, 89.9899])
def test_query_latitude_edges_pass_validation(mock, lat):
    assert mock.get(f"/api/v1/skyline?lat_deg={lat}&lon_east_deg=359.9999").status_code == 200
    assert mock.get(f"/api/v1/terrain-tile?lat_deg={lat}&lon_east_deg=-0.0").status_code == 200


# --------------------------------------------------------------------------- mutation sweep (mock, all endpoints)

_JUNK = [None, "", "x", "NaN", -1, 0, 1e308, 10**30, True, [], {}, [1], {"a": 1}, "\u202e", "2027-03-01T00:00:00Z"]


def _leaf_paths(obj, prefix=()):
    if isinstance(obj, dict):
        for k, v in obj.items():
            yield from _leaf_paths(v, (*prefix, k))
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            yield from _leaf_paths(v, (*prefix, i))
    else:
        yield prefix


def _set(obj, path, value):
    for p in path[:-1]:
        obj = obj[p]
    obj[path[-1]] = value


@pytest.mark.parametrize("url,make", [("/api/v1/compare", compare_body), ("/api/v1/sweep", sweep_body)])
def test_every_leaf_mutated_never_5xx(mock, url, make):
    base = make()
    for path in _leaf_paths(base):
        for junk in _JUNK:
            body = copy.deepcopy(base)
            _set(body, path, junk)
            r = mock.post(url, json=body)
            assert r.status_code < 500, (path, junk, r.text[:200])
            if r.status_code >= 400:
                check_error(r, (400, 413), ("INVALID_INPUT", "RANGE_TOO_LARGE"))


# --------------------------------------------------------------------------- headers / logging hygiene

def test_request_id_is_sanitised_and_echoed(mock):
    assert mock.get("/health", headers={"X-Request-ID": "abc-123.x:y"}).headers["x-request-id"] == "abc-123.x:y"
    for bad in ("a" * 65, "has space", "semi;colon", "quote\"", "<b>", "\u00e9"):
        try:
            r = mock.get("/health", headers={"X-Request-ID": bad})
        except UnicodeEncodeError:
            continue
        rid = r.headers["x-request-id"]
        assert rid != bad and re.fullmatch(r"[0-9a-f]{32}", rid)
    assert re.fullmatch(r"[0-9a-f]{32}", mock.get("/health").headers["x-request-id"])


def test_cors_exact_origin_only(mock):
    ok = mock.get("/health", headers={"Origin": "http://localhost:5173"})
    assert ok.headers["access-control-allow-origin"] == "http://localhost:5173"
    for evil in ("http://evil.example", "http://localhost:5173.evil.example", "null", "http://localhost:5174"):
        r = mock.get("/health", headers={"Origin": evil})
        assert "access-control-allow-origin" not in r.headers
        pre = mock.options("/api/v1/compare", headers={"Origin": evil, "Access-Control-Request-Method": "POST"})
        assert "access-control-allow-origin" not in pre.headers
    # error responses carry the CORS header for an allowed origin (the browser needs it to read the error)
    err = mock.post("/api/v1/compare", json={}, headers={"Origin": "http://localhost:5173"})
    assert err.status_code == 400 and err.headers["access-control-allow-origin"] == "http://localhost:5173"


def test_error_does_not_echo_stack_or_paths_even_on_unhandled(monkeypatch):
    """A bug that escapes every handler must still produce the contract 500 with no internals."""
    import app.api.routes_api as routes

    def boom(*_a, **_k):
        raise RuntimeError("secret C:\\Users\\x\\file.py line 3 Traceback SPICE(BOOM)")

    monkeypatch.setattr(routes, "load_fixture", boom)
    client = TestClient(create_app(Settings(use_mock=True, rate_limits_enabled=False)), raise_server_exceptions=False)
    check_error(client.post("/api/v1/compare", json=compare_body()), 500, "INTERNAL")
    check_error(client.get("/api/v1/sites"), 500, "INTERNAL")


# --------------------------------------------------------------------------- real mode

@needs_skylines
def test_real_valid_edge_cases_compute(real):
    client, _ = real
    cases = {
        "far side (geometric)": scenario("A", site={"lat_deg": 0, "lon_east_deg": 180}),
        "north pole region (geometric)": scenario("A", site={"lat_deg": 85, "lon_east_deg": 10}),
        "lat +89.99": scenario("A", site={"lat_deg": 89.99, "lon_east_deg": 10}),
        "lon 359.9999": scenario("A", site={"lat_deg": 0, "lon_east_deg": 359.9999}),
        "lon -0.0": scenario("A", site={"lat_deg": 0, "lon_east_deg": -0.0}),
        "emoji label": scenario("A", label="\U0001F680 \u05e9\u05dc\u05d5\u05dd"),
        "40 emoji label": scenario("A", label="\U0001F680" * 40),
        "fractional start": scenario("A", start_utc="2027-03-01T00:00:00.5Z"),
        "first allowed day": scenario("A", start_utc=FIRST + "T00:00:00Z", site={"lat_deg": 0, "lon_east_deg": 10}),
        "2149-12-30": scenario("A", start_utc="2149-12-30T00:00:00Z", site={"lat_deg": 0, "lon_east_deg": 10}),
        "mission 1 h": scenario("A", mission_hours=1),
        "both name and coords": scenario("A", site={"name": "x\u202e", "lat_deg": 0, "lon_east_deg": 5}),
    }
    for name, a in cases.items():
        r = client.post("/api/v1/compare", json=compare_body(a))
        assert r.status_code == 200, (name, r.text[:300])
        data = r.json()
        assert data["scenarios"][0]["label"] == a["label"], name
        assert "NaN" not in r.text and "Infinity" not in r.text, name
    far = client.post("/api/v1/compare", json=compare_body(cases["far side (geometric)"])).json()
    assert far["scenarios"][0]["meta"]["horizon_mode"] == "geometric"
    assert any("geometric" in n for n in far["limitations"])


@needs_skylines
def test_real_infinite_thresholds_do_not_poison_the_response(real):
    client, _ = real
    text = json.dumps(compare_body())[:-1] + ', "thresholds": {"dark_gap_h_max": Infinity, "blackout_h_max": 1e308}}'
    r = raw_json(client, "/api/v1/compare", text)
    assert r.status_code in (200, 400), r.text[:200]
    if r.status_code == 200:
        json.loads(r.text)  # strict JSON out: orjson writes NaN/Inf as null, never as a bare token
        assert "NaN" not in r.text and "Infinity" not in r.text
    else:
        check_error(r, 400, "INVALID_INPUT")


@needs_real
@pytest.mark.parametrize(
    "start,hours",
    [("1800-01-01T00:00:00Z", 24), ("1899-12-31T00:00:00Z", 24), ("2200-01-01T00:00:00Z", 24),
     ("9999-12-31T00:00:00Z", 24), ("0001-01-01T00:00:00Z", 24), ("20270301T000000Z", 24),
     ("2149-12-30T00:00:00Z", 1000)],
)
def test_real_dates_outside_span_are_clean_400(real, start, hours):
    client, _ = real
    r = client.post("/api/v1/compare", json=compare_body(scenario("A", start_utc=start, mission_hours=hours)))
    check_error(r, 400, "INVALID_INPUT")


@needs_real
def test_real_sweep_dates_outside_span_are_clean_400(real):
    client, _ = real
    for start, end in [("1800-01-01", "1800-01-05"), ("0001-01-01", "0001-01-05"), ("2200-01-01", "2200-01-05"),
                       ("9999-12-25", "9999-12-31"), ("2149-12-30", "2150-01-10")]:
        check_error(client.post("/api/v1/sweep", json=sweep_body(range_start=start, range_end=end)), 400, "INVALID_INPUT")


@needs_real
def test_real_unknown_site_ids_are_404_not_500(real):
    client, _ = real
    for sid in ("nope", "x" * 3000, "../../etc/passwd", "im2-athena\x00", "IM2-ATHENA", ""):
        r = client.post("/api/v1/compare", json=compare_body(scenario("A", site={"site_id": sid})))
        check_error(r, (400, 404), ("NOT_FOUND", "INVALID_INPUT"))
        r = client.post("/api/v1/sweep", json=sweep_body(site={"site_id": sid}))
        check_error(r, (400, 404), ("NOT_FOUND", "INVALID_INPUT"))


@needs_real
def test_real_sweep_edges(real):
    client, _ = real
    one = client.post("/api/v1/sweep", json=sweep_body(range_end="2027-03-01"))
    assert one.status_code == 200 and len(one.json()["days"]) == 1
    far = client.post("/api/v1/sweep", json=sweep_body(site={"lat_deg": 0, "lon_east_deg": 180}))
    assert far.status_code == 200 and far.json()["meta"]["horizon_mode"] == "geometric"
    north = client.post("/api/v1/sweep", json=sweep_body(site={"lat_deg": 85, "lon_east_deg": 10}))
    assert north.status_code == 200 and north.json()["meta"]["horizon_mode"] == "geometric"


@needs_skylines
def test_real_skyline_and_tile_edges(real):
    client, _ = real
    assert client.get("/api/v1/skyline?lat_deg=-85.5&lon_east_deg=30").status_code == 200
    assert client.get("/api/v1/skyline?lat_deg=-85.5&lon_east_deg=-0.0").status_code in (200, 422)
    for qs in ("lat_deg=0&lon_east_deg=180", "lat_deg=85&lon_east_deg=0", "lat_deg=89.99&lon_east_deg=359.9999",
               "lat_deg=-60&lon_east_deg=10"):
        check_error(client.get(f"/api/v1/skyline?{qs}"), 422, "NOT_IN_COVERAGE")
        check_error(client.get(f"/api/v1/terrain-tile?{qs}"), 422, "NOT_IN_COVERAGE")
    ok = client.get("/api/v1/terrain-tile?lat_deg=-85.5&lon_east_deg=30&size_km=1e-9")
    assert ok.status_code == 200 and ok.json()["data_label"] == "REAL"
    for qs in ("lat_deg=-85.5&lat_deg=-85.6&lon_east_deg=30", "lat_deg=-85.5&lon_east_deg=30&observer_height_m=0"):
        assert client.get(f"/api/v1/skyline?{qs}").status_code < 500


@needs_skylines
def test_real_eight_parallel_compares_are_identical(real):
    """SPICE is process-global and not thread-safe: the lock must serialise concurrent requests."""
    _client, app = real
    body = compare_body()
    barrier = threading.Barrier(8)

    def call(_i: int):
        c = TestClient(app, raise_server_exceptions=False)
        barrier.wait(timeout=30)
        return c.post("/api/v1/compare", json=body)

    with ThreadPoolExecutor(max_workers=8) as pool:
        responses = list(pool.map(call, range(8)))
    assert [r.status_code for r in responses] == [200] * 8, [r.text[:120] for r in responses if r.status_code != 200]

    def stable(r):
        data = r.json()
        for s in data["scenarios"]:
            s["meta"]["computed_at"] = ""
        return data

    first = stable(responses[0])
    assert all(stable(r) == first for r in responses[1:])


@needs_skylines
def test_real_parallel_mixed_endpoints(real):
    _client, app = real
    jobs = [("post", "/api/v1/compare", compare_body()), ("post", "/api/v1/sweep", sweep_body()),
            ("get", "/api/v1/skyline?lat_deg=-85.5&lon_east_deg=30", None),
            ("get", "/api/v1/terrain-tile?lat_deg=-85.5&lon_east_deg=30", None), ("get", "/health", None),
            ("post", "/api/v1/compare", {})] * 2

    def call(job):
        method, url, body = job
        c = TestClient(app, raise_server_exceptions=False)
        return c.post(url, json=body) if method == "post" else c.get(url)

    with ThreadPoolExecutor(max_workers=6) as pool:
        out = list(pool.map(call, jobs))
    assert [r.status_code for r in out] == [200, 200, 200, 200, 200, 400] * 2


@needs_skylines
def test_warm_up_runs_a_real_compare_without_error(real, caplog):
    from app.api.routes_api import _warm_compare, terrain_for

    _, app = real
    _warm_compare(terrain_for(app))  # raises on any failure; warm_up() itself only logs


@needs_real
def test_real_pre_1970_apollo_dates_work(real):
    # B6 fixed: window edges before 1970 (negative Unix time) format correctly on Windows too.
    client, _ = real
    site = {"lat_deg": 0.67416, "lon_east_deg": 23.47314, "name": "Apollo 11 landing (test point)"}
    r = client.post("/api/v1/compare", json=compare_body(
        scenario("A", site=site, start_utc="1969-07-20T20:17:40Z", mission_hours=24),
        scenario("B", site=site, start_utc="1972-12-11T19:54:57Z", mission_hours=24)))
    assert r.status_code == 200, r.text
    assert r.json()["scenarios"][0]["windows"]["sun"][0]["start"].startswith("1969-07-20")
