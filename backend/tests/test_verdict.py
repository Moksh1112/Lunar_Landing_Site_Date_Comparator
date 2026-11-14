import json
from pathlib import Path

import pytest

from app.metrics import verdict

# tests/cases/, not tests/data/: the repo .gitignore ignores every "data/" folder
DATA = json.loads((Path(__file__).parent / "cases" / "verdict_cases.json").read_text())


def test_file_shape():
    assert isinstance(DATA["rule"], str) and DATA["rule"]
    assert len(DATA["cases"]) == 8


@pytest.mark.parametrize("case", DATA["cases"], ids=[c["name"] for c in DATA["cases"]])
def test_verdict_cases(case):
    assert verdict(case["metrics"], case["thresholds"]) == case["expected"]
