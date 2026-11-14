"""Scenario metrics and A-minus-B deltas (TRD section 5)."""
from __future__ import annotations

import numpy as np

from .windows import Window, intersect_windows, longest_gap_hours, visibility_windows

METRIC_KEYS = (
    "sun_el_max_deg", "sun_el_mean_up_deg",
    "sun_hours", "sun_pct", "earth_hours", "earth_pct", "both_hours", "both_pct",
    "longest_dark_h", "longest_blackout_h",
)


def _round_for(key: str, value: float | None) -> float | None:
    if value is None:
        return None
    return round(float(value), 3 if key.endswith("_deg") else 1)


def scenario_metrics(t_unix: np.ndarray, sun_el_deg: np.ndarray, sun_margin_deg: np.ndarray,
                     earth_margin_deg: np.ndarray, mission_hours: float) -> tuple[dict, dict]:
    if not mission_hours > 0:
        raise ValueError("mission_hours must be positive")
    t = np.asarray(t_unix, dtype=float)
    sun_el = np.asarray(sun_el_deg, dtype=float)
    sun_m = np.asarray(sun_margin_deg, dtype=float)
    w_sun = visibility_windows(t, sun_m)
    w_earth = visibility_windows(t, earth_margin_deg)
    if sun_el.shape != t.shape:
        raise ValueError("sun_el_deg must match t_unix")
    w_both = intersect_windows(w_sun, w_earth)

    up = sun_el[sun_m > 0]
    sh = sum(w.hours for w in w_sun)
    eh = sum(w.hours for w in w_earth)
    bh = sum(w.hours for w in w_both)
    t0, t1 = float(t[0]), float(t[-1])
    raw = {
        "sun_el_max_deg": float(np.max(sun_el)),
        "sun_el_mean_up_deg": float(np.mean(up)) if up.size else None,
        "sun_hours": sh, "sun_pct": 100.0 * sh / mission_hours,
        "earth_hours": eh, "earth_pct": 100.0 * eh / mission_hours,
        "both_hours": bh, "both_pct": 100.0 * bh / mission_hours,
        "longest_dark_h": longest_gap_hours(w_sun, t0, t1),
        "longest_blackout_h": longest_gap_hours(w_earth, t0, t1),
    }
    metrics = {k: _round_for(k, raw[k]) for k in METRIC_KEYS}
    windows: dict[str, list[Window]] = {"sun": w_sun, "earth": w_earth, "both": w_both}
    return metrics, windows


def deltas(metrics_a: dict, metrics_b: dict) -> dict:
    out: dict = {}
    for k in METRIC_KEYS:
        a, b = metrics_a.get(k), metrics_b.get(k)
        out[k] = None if a is None or b is None else _round_for(k, a - b)
    return out
