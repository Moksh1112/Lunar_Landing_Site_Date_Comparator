"""Load and validate the site library (sites.json)."""
import json
from functools import lru_cache
from pathlib import Path

from app.api.errors import ApiError
from app.api.models import SiteEntry

SITES_PATH = Path(__file__).resolve().parent / "sites.json"


@lru_cache(maxsize=1)
def _load() -> tuple[dict, ...]:
    raw = json.loads(SITES_PATH.read_text(encoding="utf-8"))
    return tuple(SiteEntry.model_validate(entry).model_dump() for entry in raw["sites"])


def load_sites() -> list[dict]:
    return [dict(s) for s in _load()]


def get_site(site_id: str) -> dict:
    for site in _load():
        if site["site_id"] == site_id:
            return dict(site)
    raise ApiError("NOT_FOUND", f"Unknown site_id: {site_id}")
