"""Geometric-only provider when DEM libraries cannot load: honest errors, no silent downgrade."""
import sys

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.api.errors import register_error_handlers
from app.terrain import get_terrain_provider
from app.terrain.degraded import GeometricOnlyTerrain
from app.terrain.interface import COVERAGE_LAT_MAX_DEG, TerrainUnavailable


def test_outside_coverage_is_geometric_and_real():
    p = GeometricOnlyTerrain("test")
    sky = p.skyline(-60.0, 10.0, 2.0)
    assert sky.mode == "geometric" and sky.dem_name is None and sky.data_label == "REAL"
    assert sky.block_dist_km is None and len(sky.elev_deg) == 720
    assert p.coverage(-80.13, 1.44) == "geometric"


@pytest.mark.parametrize("lat", [COVERAGE_LAT_MAX_DEG, -84.79, -89.5])
def test_inside_coverage_raises(lat):
    p = GeometricOnlyTerrain("test")
    with pytest.raises(TerrainUnavailable):
        p.skyline(lat, 30.0, 2.0)
    with pytest.raises(TerrainUnavailable):
        p.site_height(lat, 30.0)


def test_fallback_only_when_real_provider_cannot_import(monkeypatch, tmp_path):
    monkeypatch.setitem(sys.modules, "app.terrain.real", None)  # import raises ImportError
    provider = get_terrain_provider(False, tmp_path, tmp_path)
    assert isinstance(provider, GeometricOnlyTerrain)


def test_api_reports_unavailable_terrain_honestly():
    app = FastAPI()
    register_error_handlers(app)

    @app.get("/x")
    def _x():
        raise TerrainUnavailable(-85.0, 30.0, "test")

    r = TestClient(app).get("/x")
    assert r.status_code == 500
    body = r.json()["error"]
    assert body["code"] == "INTERNAL" and "Terrain data is not available" in body["message"]


def test_real_provider_without_dem_is_honest_inside_coverage(tmp_path):
    from app.terrain.real import RealTerrain

    p = RealTerrain(tmp_path)
    assert p.skyline(-60.0, 10.0, 2.0).mode == "geometric"  # outside coverage: geometric by TRD 4.1
    with pytest.raises(TerrainUnavailable):
        p.skyline(-84.79, 29.2, 2.0)  # covered site, no DEM on this server: error, not "geometric"
