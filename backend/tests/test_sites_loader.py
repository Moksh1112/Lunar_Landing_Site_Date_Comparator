import pytest

from app.api.errors import ApiError
from app.sites.loader import get_site, load_sites


def test_loads_three_valid_sites():
    sites = load_sites()
    assert len(sites) == 3
    assert len({s["site_id"] for s in sites}) == 3


def test_get_site_known():
    assert get_site("im2-athena")["lat_deg"] == pytest.approx(-84.7906)


def test_get_site_unknown_is_not_found():
    with pytest.raises(ApiError) as ei:
        get_site("nope")
    assert ei.value.code == "NOT_FOUND" and ei.value.http == 404


def test_real_mode_sites_endpoint(real_client):
    r = real_client.get("/api/v1/sites")
    assert r.status_code == 200
    ids = [s["site_id"] for s in r.json()["sites"]]
    assert ids == [s["site_id"] for s in load_sites()]
    assert len(ids) == 3
