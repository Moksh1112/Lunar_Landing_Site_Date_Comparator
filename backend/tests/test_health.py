import json
import os
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.ephemeris.spice import _reset_for_tests
from app.main import create_app
from app.paths import FIXTURES_DIR
from app.settings import Settings

DATA_DIR = Path(os.environ.get("AZX_DATA_DIR", "C:/azelux-data"))


@pytest.fixture(autouse=True)
def _clean_spice():
    _reset_for_tests()
    yield
    _reset_for_tests()


def test_health_mock_equals_fixture(mock_client):
    r = mock_client.get("/health")
    assert r.status_code == 200
    assert r.json() == json.loads((FIXTURES_DIR / "health.ok.json").read_text(encoding="utf-8"))


def test_health_real_claims_nothing_loaded(tmp_path):
    client = TestClient(create_app(Settings(use_mock=False, data_dir=tmp_path)))
    body = client.get("/health").json()
    assert body == {
        "status": "ok",
        "app_version": "0.1.0",
        "contract_version": "1.0",
        "kernels_loaded": [],
        "dems_loaded": [],
        "mock": False,
    }


@pytest.mark.skipif(not (DATA_DIR / "kernels" / "de440s.bsp").is_file(), reason="SPICE kernels not present")
def test_health_real_lists_loaded_kernels():
    client = TestClient(create_app(Settings(use_mock=False, data_dir=DATA_DIR)))
    body = client.get("/health").json()
    assert body["status"] == "ok" and body["mock"] is False
    assert sorted(body["kernels_loaded"]) == sorted(Settings().kernel_list)
    assert len(body["kernels_loaded"]) == 5


def test_real_mode_without_data_fails_cleanly(tmp_path, sweep_body):
    # Since S3 every endpoint is real. With no kernels/DEMs on the server they must fail with the
    # contract error shape (never a fixture, never a stack trace).
    from app.ephemeris.spice import _reset_for_tests

    _reset_for_tests()  # SPICE state is process-global: drop kernels other tests loaded
    real_client = TestClient(create_app(Settings(use_mock=False, data_dir=tmp_path, warm_up=False)))
    responses = [
        real_client.post("/api/v1/sweep", json=sweep_body),
        real_client.get("/api/v1/skyline", params={"lat_deg": -85, "lon_east_deg": 30}),
        real_client.get("/api/v1/terrain-tile", params={"lat_deg": -85, "lon_east_deg": 30}),
    ]
    for r in responses:
        assert r.status_code in (422, 500), r.text
        assert r.json()["error"]["code"] in ("INTERNAL", "NOT_IN_COVERAGE")
        assert "Traceback" not in r.text and ".py" not in r.text
        assert "SYNTHETIC" not in r.text


def test_real_mode_still_validates_input(real_client, compare_body):
    compare_body["scenarios"][1]["site"]["lat_deg"] = 95
    assert real_client.post("/api/v1/compare", json=compare_body).status_code == 400
