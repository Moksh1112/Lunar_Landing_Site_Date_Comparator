"""Filesystem locations resolved from the package location, never from the cwd."""
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
REPO_ROOT = BACKEND_DIR.parent
FIXTURES_DIR = REPO_ROOT / "fixtures"
DEFAULT_DATA_DIR = REPO_ROOT / "data"
ENV_FILE = REPO_ROOT / ".env"
