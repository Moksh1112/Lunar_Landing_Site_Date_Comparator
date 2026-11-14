import json

import pytest

from app.api.models import (
    CompareResponse,
    ErrorResponse,
    HealthResponse,
    SitesResponse,
    SkylineResponse,
    SweepResponse,
    TerrainTileResponse,
)
from app.paths import FIXTURES_DIR

RESPONSE_MODELS = {
    "compare": CompareResponse,
    "sweep": SweepResponse,
    "sites": SitesResponse,
    "skyline": SkylineResponse,
    "terrain-tile": TerrainTileResponse,
    "health": HealthResponse,
}

FILES = sorted(FIXTURES_DIR.glob("*.json"))


def test_fixtures_present():
    assert len(FILES) >= 15


@pytest.mark.parametrize("path", FILES, ids=lambda p: p.name)
def test_fixture_validates(path):
    stem, kind, _ = path.name.rsplit(".", 2)
    data = json.loads(path.read_text(encoding="utf-8"))
    if kind == "error":
        ErrorResponse.model_validate(data)
    elif kind in ("ok", "empty"):
        assert stem in RESPONSE_MODELS, f"no model mapped for fixture {path.name}"
        RESPONSE_MODELS[stem].model_validate(data)
    else:
        pytest.fail(f"unrecognised fixture kind: {path.name}")
