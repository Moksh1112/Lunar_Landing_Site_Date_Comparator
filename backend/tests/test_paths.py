import os
import subprocess
import sys
from pathlib import Path

import pytest

from app.paths import BACKEND_DIR, FIXTURES_DIR, REPO_ROOT
from app.settings import Settings

CODE = (
    "from app.paths import FIXTURES_DIR, ENV_FILE, DEFAULT_DATA_DIR; "
    "print(FIXTURES_DIR, ENV_FILE, DEFAULT_DATA_DIR, sep='|')"
)


def test_fixtures_dir_exists():
    assert (FIXTURES_DIR / "compare.ok.json").is_file()


def test_relative_data_dir_resolves_against_repo_root(monkeypatch):
    monkeypatch.delenv("AZX_DATA_DIR", raising=False)
    assert Settings(data_dir="data").data_dir == REPO_ROOT / "data"


def test_absolute_data_dir_kept(tmp_path):
    assert Settings(data_dir=tmp_path).data_dir == tmp_path


def test_empty_env_falls_back_to_defaults(monkeypatch):
    monkeypatch.setenv("AZX_DATA_DIR", "")
    monkeypatch.setenv("AZX_USE_MOCK", "")
    monkeypatch.setenv("AZX_CORS_ORIGINS", "")
    s = Settings(_env_file=None)  # ignore a developer's local repo-root .env
    assert s.data_dir == REPO_ROOT / "data"
    assert s.use_mock is False
    assert s.cors_origins == ["http://localhost:5173", "http://127.0.0.1:5173"]


def test_csv_env_parsed(monkeypatch):
    monkeypatch.setenv("AZX_CORS_ORIGINS", "http://a.test, http://b.test")
    assert Settings().cors_origins == ["http://a.test", "http://b.test"]


def test_paths_identical_from_repo_root_and_backend():
    env = {**os.environ, "PYTHONPATH": str(BACKEND_DIR)}
    outs = [
        subprocess.run(
            [sys.executable, "-c", CODE], cwd=cwd, env=env, capture_output=True, text=True, check=True
        ).stdout
        for cwd in (REPO_ROOT, BACKEND_DIR)
    ]
    assert outs[0] == outs[1]
    # split on "|" because real paths may contain spaces (e.g. "Office Pc")
    assert Path(outs[0].strip().split("|")[0]) == FIXTURES_DIR


def test_cors_origins_normalised_and_wildcard_rejected():
    assert Settings(cors_origins="http://localhost:5173/, http://x.test").cors_origins == [
        "http://localhost:5173",
        "http://x.test",
    ]
    with pytest.raises(ValueError):
        Settings(cors_origins="*")
