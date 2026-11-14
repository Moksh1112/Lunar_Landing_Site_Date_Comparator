import json

from fastapi.testclient import TestClient

from app.main import create_app
from app.settings import Settings


def test_missing_and_mock_assets_are_unavailable(tmp_path):
    for use_mock in [False, True]:
        client = TestClient(create_app(Settings(data_dir=tmp_path, use_mock=use_mock, warm_up=False)))
        assert client.get('/assets/lunar/south-pole-hillshade.json').status_code == 404
        assert client.get('/assets/lunar/../../MANIFEST.json').status_code == 404


def test_only_derived_image_and_metadata_are_served(tmp_path):
    folder = tmp_path / 'dem'
    folder.mkdir()
    (folder / 'south_pole_hillshade_2048.png').write_bytes(b'PNG-test')
    (folder / 'south_pole_hillshade_2048.json').write_text(json.dumps({'bounds_m': [-1, -1, 1, 1]}))
    client = TestClient(create_app(Settings(data_dir=tmp_path, use_mock=False, warm_up=False)))
    response = client.get('/assets/lunar/south-pole-hillshade.png')
    assert response.status_code == 200 and response.headers['content-type'] == 'image/png'
    assert client.get('/assets/lunar/south-pole-hillshade.json').json()['data_label'] == 'REAL'
    assert client.get('/assets/lunar/raw.tif').status_code == 404
