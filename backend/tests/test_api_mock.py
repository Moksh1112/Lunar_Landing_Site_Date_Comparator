import copy
import json

import pytest

from app.paths import FIXTURES_DIR


def fx(name):
    return json.loads((FIXTURES_DIR / f"{name}.json").read_text(encoding="utf-8"))


def assert_error(resp, status, code):
    assert resp.status_code == status
    body = resp.json()
    assert set(body) == {"error"}
    assert body["error"]["code"] == code
    assert isinstance(body["error"]["details"], list)
    return body["error"]


def test_sites(mock_client):
    r = mock_client.get("/api/v1/sites")
    assert r.status_code == 200 and r.json() == fx("sites.ok")


def test_compare(mock_client, compare_body):
    r = mock_client.post("/api/v1/compare", json=compare_body)
    assert r.status_code == 200 and r.json() == fx("compare.ok")


def test_sweep(mock_client, sweep_body):
    r = mock_client.post("/api/v1/sweep", json=sweep_body)
    assert r.status_code == 200 and r.json() == fx("sweep.ok")


def test_skyline(mock_client):
    r = mock_client.get("/api/v1/skyline", params={"lat_deg": -85.5, "lon_east_deg": 30})
    assert r.status_code == 200 and r.json() == fx("skyline.ok")


def test_terrain_tile(mock_client):
    r = mock_client.get("/api/v1/terrain-tile", params={"lat_deg": -85.5, "lon_east_deg": 30})
    assert r.status_code == 200 and r.json() == fx("terrain-tile.ok")


def test_compare_bad_lat_field_path(mock_client, compare_body):
    compare_body["scenarios"][1]["site"]["lat_deg"] = 95
    err = assert_error(mock_client.post("/api/v1/compare", json=compare_body), 400, "INVALID_INPUT")
    assert err["details"][0]["field"] == "scenarios[1].site.lat_deg"
    assert err["details"][0]["reason"] == "must be between -90 and 90"


def test_unknown_field_rejected(mock_client, compare_body):
    compare_body["bogus"] = 1
    assert_error(mock_client.post("/api/v1/compare", json=compare_body), 400, "INVALID_INPUT")


def test_pole_rejected(mock_client, compare_body):
    compare_body["scenarios"][0]["site"]["lat_deg"] = -89.995
    assert_error(mock_client.post("/api/v1/compare", json=compare_body), 400, "INVALID_INPUT")


def test_lon_360_rejected(mock_client, compare_body):
    compare_body["scenarios"][0]["site"]["lon_east_deg"] = 360
    assert_error(mock_client.post("/api/v1/compare", json=compare_body), 400, "INVALID_INPUT")


def test_start_without_z_rejected(mock_client, compare_body):
    compare_body["scenarios"][0]["start_utc"] = "2027-03-01T00:00:00+00:00"
    assert_error(mock_client.post("/api/v1/compare", json=compare_body), 400, "INVALID_INPUT")


def test_site_requires_id_or_coords(mock_client, compare_body):
    compare_body["scenarios"][0]["site"] = {"lat_deg": -85.5}
    assert_error(mock_client.post("/api/v1/compare", json=compare_body), 400, "INVALID_INPUT")


def test_scenario_ids_must_be_a_and_b(mock_client, compare_body):
    body = copy.deepcopy(compare_body)
    body["scenarios"][1]["id"] = "A"
    assert_error(mock_client.post("/api/v1/compare", json=body), 400, "INVALID_INPUT")


def test_skyline_bad_query(mock_client):
    r = mock_client.get("/api/v1/skyline", params={"lat_deg": 95, "lon_east_deg": 30})
    err = assert_error(r, 400, "INVALID_INPUT")
    assert err["details"][0]["field"] == "lat_deg"


def test_terrain_tile_size_too_big(mock_client):
    r = mock_client.get("/api/v1/terrain-tile", params={"lat_deg": -85, "lon_east_deg": 30, "size_km": 41})
    assert_error(r, 400, "INVALID_INPUT")


def test_sweep_range_too_large(mock_client, sweep_body):
    sweep_body["range_end"] = "2027-09-17"
    assert_error(mock_client.post("/api/v1/sweep", json=sweep_body), 413, "RANGE_TOO_LARGE")


def test_sweep_end_before_start(mock_client, sweep_body):
    sweep_body["range_end"] = "2027-02-01"
    assert_error(mock_client.post("/api/v1/sweep", json=sweep_body), 400, "INVALID_INPUT")


def test_unknown_path_contract_shape(mock_client):
    assert_error(mock_client.get("/nope"), 404, "NOT_FOUND")


def test_request_id_echoed_and_generated(mock_client):
    r = mock_client.get("/health", headers={"X-Request-ID": "abc123"})
    assert r.headers["x-request-id"] == "abc123"
    assert len(mock_client.get("/health").headers["x-request-id"]) == 32


@pytest.mark.parametrize("origin,allowed", [("http://localhost:5173", True), ("http://evil.example", False)])
def test_cors_preflight(mock_client, origin, allowed):
    r = mock_client.options(
        "/api/v1/compare",
        headers={
            "Origin": origin,
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )
    if allowed:
        assert r.headers.get("access-control-allow-origin") == origin
    else:
        assert "access-control-allow-origin" not in r.headers


def test_mission_over_8760_is_range_too_large(mock_client, compare_body):
    body = copy.deepcopy(compare_body)
    body["scenarios"][1]["mission_hours"] = 9000
    err = assert_error(mock_client.post("/api/v1/compare", json=body), 413, "RANGE_TOO_LARGE")
    assert err["details"][0]["field"] == "scenarios[1].mission_hours"


def test_mission_below_1_is_invalid_input(mock_client, compare_body):
    body = copy.deepcopy(compare_body)
    body["scenarios"][0]["mission_hours"] = 0.5
    assert_error(mock_client.post("/api/v1/compare", json=body), 400, "INVALID_INPUT")


def test_sample_cap_per_scenario(mock_client, compare_body):
    body = copy.deepcopy(compare_body)
    body["step_minutes"] = 1
    body["scenarios"][0]["mission_hours"] = 8760  # 525,601 samples > 60,000
    assert_error(mock_client.post("/api/v1/compare", json=body), 413, "RANGE_TOO_LARGE")
    body["step_minutes"] = 10  # 52,561 samples per scenario: allowed (C04 proposal)
    body["scenarios"][1]["mission_hours"] = 8760
    assert mock_client.post("/api/v1/compare", json=body).status_code == 200


def test_sweep_mission_over_8760(mock_client, sweep_body):
    body = copy.deepcopy(sweep_body)
    body["mission_hours"] = 9000
    err = assert_error(mock_client.post("/api/v1/sweep", json=body), 413, "RANGE_TOO_LARGE")
    assert err["details"][0]["field"] == "mission_hours"


def test_malformed_json_field_is_body(mock_client):
    r = mock_client.post("/api/v1/compare", content=b'{"mode": ', headers={"content-type": "application/json"})
    err = assert_error(r, 400, "INVALID_INPUT")
    assert err["details"][0]["field"] == "body"
