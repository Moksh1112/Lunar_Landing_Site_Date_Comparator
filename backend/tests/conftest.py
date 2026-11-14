import copy

import pytest
from fastapi.testclient import TestClient

from app.main import create_app
from app.settings import Settings


@pytest.fixture
def mock_client() -> TestClient:
    return TestClient(create_app(Settings(use_mock=True)))


@pytest.fixture
def real_client() -> TestClient:
    return TestClient(create_app(Settings(use_mock=False)))


_COMPARE = {
    "mode": "site_vs_site",
    "scenarios": [
        {
            "id": "A",
            "label": "A",
            "site": {"lat_deg": -85.5, "lon_east_deg": 30.0},
            "start_utc": "2027-03-01T00:00:00Z",
            "mission_hours": 48,
        },
        {
            "id": "B",
            "label": "B",
            "site": {"lat_deg": -85.0, "lon_east_deg": 40.0},
            "start_utc": "2027-03-01T00:00:00Z",
            "mission_hours": 48,
        },
    ],
}


@pytest.fixture
def compare_body() -> dict:
    return copy.deepcopy(_COMPARE)


@pytest.fixture
def sweep_body() -> dict:
    return {
        "site": {"lat_deg": -85.5, "lon_east_deg": 30.0},
        "range_start": "2027-03-01",
        "range_end": "2027-03-14",
        "mission_hours": 48,
    }
