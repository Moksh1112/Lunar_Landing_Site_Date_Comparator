import json

from app.paths import FIXTURES_DIR


def test_health_mock_equals_fixture(mock_client):
    r = mock_client.get("/health")
    assert r.status_code == 200
    assert r.json() == json.loads((FIXTURES_DIR / "health.ok.json").read_text(encoding="utf-8"))


def test_health_real_claims_nothing_loaded(real_client):
    body = real_client.get("/health").json()
    assert body == {
        "status": "ok",
        "app_version": "0.1.0",
        "contract_version": "1.0",
        "kernels_loaded": [],
        "dems_loaded": [],
        "mock": False,
    }


def test_real_mode_endpoints_not_implemented(real_client, compare_body, sweep_body):
    responses = [
        real_client.post("/api/v1/compare", json=compare_body),
        real_client.post("/api/v1/sweep", json=sweep_body),
        real_client.get("/api/v1/sites"),
        real_client.get("/api/v1/skyline", params={"lat_deg": -85, "lon_east_deg": 30}),
        real_client.get("/api/v1/terrain-tile", params={"lat_deg": -85, "lon_east_deg": 30}),
    ]
    for r in responses:
        assert r.status_code == 500
        err = r.json()["error"]
        assert err["code"] == "INTERNAL"
        assert err["message"] == "Not implemented yet in this build (S0)"
        assert "Traceback" not in r.text and ".py" not in r.text


def test_real_mode_still_validates_input(real_client, compare_body):
    compare_body["scenarios"][1]["site"]["lat_deg"] = 95
    assert real_client.post("/api/v1/compare", json=compare_body).status_code == 400
