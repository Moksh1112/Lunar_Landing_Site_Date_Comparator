"""Fixture loader for mock mode. Fixtures are SYNTHETIC and never served as real results."""
from functools import cache
from typing import Any

import orjson

from app.paths import FIXTURES_DIR


@cache
def load_fixture(name: str) -> Any:
    """Load fixtures/<name>.json once; resolved from the package location."""
    return orjson.loads((FIXTURES_DIR / f"{name}.json").read_bytes())
