import pytest

from app.api.errors import ApiError
from app.sites.loader import get_site, load_sites


def test_loads_verified_library_with_unique_ids():
    sites = load_sites()
    assert len(sites) >= 10
    assert len({s["site_id"] for s in sites}) == len(sites)


def test_get_site_known():
    assert get_site("im2-athena")["lat_deg"] == pytest.approx(-84.7906)


def test_official_west_longitude_is_normalized_east_positive():
    assert get_site('apollo-12')['lon_east_deg'] == pytest.approx(336.5781)
    assert not get_site('apollo-12')['terrain_coverage']
    assert 'not a landing site' in get_site('lcross-impact')['name']


def test_get_site_unknown_is_not_found():
    with pytest.raises(ApiError) as ei:
        get_site("nope")
    assert ei.value.code == "NOT_FOUND" and ei.value.http == 404


def test_real_mode_sites_endpoint(real_client):
    r = real_client.get("/api/v1/sites")
    assert r.status_code == 200
    ids = [s["site_id"] for s in r.json()["sites"]]
    assert ids == [s["site_id"] for s in load_sites()]
    assert len(ids) >= 10
