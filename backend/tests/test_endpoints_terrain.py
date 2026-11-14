"""Real GET /skyline and /terrain-tile (skipped without data) plus mock-mode behaviour."""
import base64
import math
import os
from pathlib import Path

import numpy as np
import pytest
from fastapi.testclient import TestClient

from app.main import create_app
from app.settings import Settings

DATA = Path(os.environ.get("AZX_DATA_DIR", "C:/azelux-data"))
HAVE_DATA = (DATA / "dem" / "far_160m.tif").exists() and (DATA / "kernels" / "de440s.bsp").exists()
needs_data = pytest.mark.skipif(not HAVE_DATA, reason="real data not available")

IM2 = {"lat_deg": -84.7906, "lon_east_deg": 29.1957}
OUTSIDE = {"lat_deg": -60, "lon_east_deg": 10}


@pytest.fixture(scope="module")
def client():
    pytest.importorskip("rasterio")
    pytest.importorskip("pyproj")
    return TestClient(create_app(Settings(use_mock=False, data_dir=DATA, warm_up=False)))


@needs_data
def test_skyline_im2(client):
    r = client.get("/api/v1/skyline", params=IM2)
    assert r.status_code == 200, r.text
    body = r.json()
    assert len(body["skyline"]["elev_deg"]) == 720 and body["skyline"]["az_step_deg"] == 0.5
    assert body["meta"]["horizon_mode"] in ("terrain", "terrain_coarse")
    assert body["meta"]["data_label"] == "REAL" and body["meta"]["dem"]
    assert body["site"] == {"site_id": None, "name": None, **IM2}
    assert all(math.isfinite(v) for v in body["skyline"]["elev_deg"])


@needs_data
def test_skyline_outside_coverage(client):
    r = client.get("/api/v1/skyline", params=OUTSIDE)
    assert r.status_code == 422
    err = r.json()["error"]
    assert err["code"] == "NOT_IN_COVERAGE" and "geometric" in err["message"]


@needs_data
def test_tile_im2(client):
    r = client.get("/api/v1/terrain-tile", params={**IM2, "size_km": 10})
    assert r.status_code == 200, r.text
    b = r.json()
    assert (b["width"], b["height"], b["size_km"], b["data_label"]) == (256, 256, 10, "REAL")
    raw = base64.b64decode(b["heights_m_b64"])
    assert len(raw) == 256 * 256 * 4
    h = np.frombuffer(raw, dtype="<f4").reshape(256, 256)
    assert np.isfinite(h).all()
    assert h.min() == pytest.approx(b["min_m"]) and h.max() == pytest.approx(b["max_m"])
    assert b["site_px"] == [128, 128]


@needs_data
def test_tile_outside_coverage(client):
    r = client.get("/api/v1/terrain-tile", params=OUTSIDE)
    assert r.status_code == 422 and r.json()["error"]["code"] == "NOT_IN_COVERAGE"


@needs_data
def test_tile_size_too_big_real(client):
    r = client.get("/api/v1/terrain-tile", params={**IM2, "size_km": 41})
    assert r.status_code == 400 and r.json()["error"]["code"] == "INVALID_INPUT"


def test_mock_unchanged(mock_client):
    assert mock_client.get("/api/v1/skyline", params=IM2).status_code == 200
    r = mock_client.get("/api/v1/terrain-tile", params={**IM2, "size_km": 41})
    assert r.status_code == 400
    assert mock_client.get("/api/v1/terrain-tile", params=OUTSIDE).status_code == 200
