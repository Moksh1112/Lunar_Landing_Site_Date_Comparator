"""S0 fixture authoring check; does not test an implemented API."""
import copy
import json
from datetime import datetime, timedelta
from pathlib import Path
from jsonschema import Draft202012Validator, FormatChecker

ROOT = Path(__file__).resolve().parents[2]
def load(path):
    return json.loads((ROOT / path).read_text(encoding="utf-8"))
checker = FormatChecker()
@checker.checks("date-time", raises=ValueError)
def calendar_time(value):
    if not isinstance(value, str):
        return True  # type constraint reports this separately
    datetime.fromisoformat(value)
    return True

validators = {}
for name in ("request", "response", "error", "health"):
    schema = load(f"docs/contracts/{name}.schema.json")
    Draft202012Validator.check_schema(schema)
    validators[name] = Draft202012Validator(schema, format_checker=checker)
for name, schema in (("compare.request", "request"), ("compare.ok", "response"),
                     ("compare.empty", "error"), ("compare.error", "error"),
                     ("health.ok", "health")):
    validators[schema].validate(load(f"fixtures/{name}.json"))
    print(f"PASS schema: {name}")
request = load("fixtures/compare.request.json")
response = load("fixtures/compare.ok.json")
assert len({s["id"] for s in request["scenarios"]}) == 2
for expected, result in zip(request["scenarios"], response["scenarios"]):
    assert expected == result["scenario"]
    assert expected["label"].strip()
    start = datetime.fromisoformat(expected["start_utc"])
    end = start + timedelta(hours=expected["duration_hours"])
    assert 2000 <= start.year <= end.year <= 2100
    grid, t = [], start
    while t < end:
        grid.append(t)
        t += timedelta(minutes=expected["step_minutes"])
    grid.append(end)
    assert len(grid) <= 1441
    samples = result["samples"]
    assert [datetime.fromisoformat(s["timestamp_utc"]) for s in samples] == grid
    assert result["source"] == "synthetic_fixture"
    assert result["mode"] == "geometric_only"
    assert result["provenance"]["terrain_product"] is None
    assert result["provenance"]["upstream_requests"] == []
    assert result["provenance"]["raw_response_sha256"] == []
    for target, duration, setting in (("sun", "sampled_sunlight_hours", "next_sunset_utc"),
                                      ("earth", "sampled_earth_visibility_hours", "next_earthset_utc")):
        for sample in samples:
            b = sample[target]
            assert b["horizon_deg"] == 0
            assert b["visible"] == (b["elevation_deg"] > b["horizon_deg"])
        hours = sum((grid[i+1]-grid[i]).total_seconds()/3600
                    for i in range(len(grid)-1) if samples[i][target]["visible"])
        assert abs(result["summary"][duration]-hours) <= .000002
        crossing = next((samples[i]["timestamp_utc"] for i in range(1,len(samples))
                         if samples[i-1][target]["visible"] and not samples[i][target]["visible"]), None)
        assert result["summary"][setting] == crossing
for field, delta in (("sampled_sunlight_hours", "sunlight_hours_b_minus_a"),
                     ("sampled_earth_visibility_hours", "earth_visibility_hours_b_minus_a")):
    a,b = response["scenarios"]
    assert abs(response["deltas"][delta] - (b["summary"][field]-a["summary"][field])) <= .000002
print("PASS semantics: UTC grid, echo, visibility, intervals, sampled sets, deltas, synthetic provenance")
for title, mutate in (
    ("unknown field", lambda d: d.update(extra=True)),
    ("wrong count", lambda d: d["scenarios"].pop()),
    ("bad coordinate", lambda d: d["scenarios"][0].update(latitude_deg=-91)),
    ("zero step", lambda d: d["scenarios"][0].update(step_minutes=0)),
    ("offset time", lambda d: d["scenarios"][0].update(start_utc="2026-11-14T00:00:00+01:00")),
    ("impossible date", lambda d: d["scenarios"][0].update(start_utc="2026-02-30T00:00:00Z")),
):
    invalid = copy.deepcopy(request)
    mutate(invalid)
    assert list(validators["request"].iter_errors(invalid)), title
    print(f"PASS rejected schema case: {title}")
print("PASS: 5 fixtures, semantic invariants, 6 negative schema cases")
