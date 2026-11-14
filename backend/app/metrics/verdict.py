"""Verdict rule (TRD 5.3). Ported verbatim to TypeScript; see tests/data/verdict_cases.json."""
from __future__ import annotations

_EPS = 1e-9  # guards float error at exact 0.8x / 1.2x boundaries

# threshold key -> (metric key, kind)
_CHECKS = (
    ("sun_pct_min", "sun_pct", "min"),
    ("earth_pct_min", "earth_pct", "min"),
    ("dark_gap_h_max", "longest_dark_h", "max"),
    ("blackout_h_max", "longest_blackout_h", "max"),
)


def verdict(metrics: dict, thresholds: dict) -> dict:
    failed: list[str] = []
    all_near = True
    for tkey, mkey, kind in _CHECKS:
        value, limit = metrics[mkey], thresholds[tkey]
        if kind == "min":
            ok = value >= limit - _EPS
            near = value >= 0.8 * limit - _EPS
        else:
            ok = value <= limit + _EPS
            near = value <= 1.2 * limit + _EPS
        if not ok:
            failed.append(tkey)
            all_near = all_near and near
    level = "green" if not failed else ("amber" if all_near else "red")
    return {"level": level, "failed": failed}
