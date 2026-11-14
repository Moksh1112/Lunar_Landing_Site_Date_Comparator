"""Evidence adapter keeps scope/provenance and matches validation/evidence.schema.json fields."""
import hashlib
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "backend" / "tools"))
from evidence_from_horizons_spot_check import adapt  # noqa: E402

SRC = ROOT / "backend" / "docs" / "horizons_spot_check_S1.json"
SCHEMA = json.loads((ROOT / "validation" / "evidence.schema.json").read_text(encoding="utf-8"))


def _adapted() -> dict:
    raw = SRC.read_bytes()
    return adapt(json.loads(raw), "backend/docs/horizons_spot_check_S1.json", hashlib.sha256(raw).hexdigest(), "2026-11-15T00:00:00Z")


def test_scope_and_review_are_preserved():
    out = _adapted()
    assert out["scope"] == "spot_check"
    assert out["review_status"] == "owner_reported"
    assert out["check_id"] == "V1" and out["data_label"] == "REAL"


def test_required_fields_and_no_extras():
    out = _adapted()
    assert set(SCHEMA["required"]) <= set(out)
    assert set(out) <= set(SCHEMA["properties"])
    row_props = SCHEMA["properties"]["rows"]["items"]["properties"]
    for r in out["rows"]:
        assert set(r) <= set(row_props) and r["unit"] == "deg"


def test_rows_mirror_source_values():
    src = json.loads(SRC.read_text(encoding="utf-8"))
    out = _adapted()
    assert len(out["rows"]) == 2 * len(src["rows"])
    first = out["rows"][0]
    assert first["actual"] == src["rows"][0]["ours_az"] and first["reference"] == src["rows"][0]["horizons_az"]
    assert out["status"] == "pass" and all(r["tolerance"] == 0.05 for r in out["rows"])


def test_failing_row_fails_the_check():
    src = json.loads(SRC.read_text(encoding="utf-8"))
    src["rows"][0]["d_az_deg"] = 0.2
    out = adapt(src, "x", "0" * 64, "2026-11-15T00:00:00Z")
    assert out["status"] == "fail" and out["rows"][0]["status"] == "fail"
