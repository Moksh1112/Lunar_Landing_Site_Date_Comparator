"""Visibility windows with interpolated edges and censoring (TRD section 5)."""
from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

import numpy as np

_EPOCH = datetime(1970, 1, 1, tzinfo=UTC)


def _iso(t_unix: float) -> str:
    # epoch + timedelta, not datetime.fromtimestamp(): the latter raises OSError on Windows for
    # negative timestamps, i.e. any pre-1970 date (e.g. Apollo-era scenarios).
    dt = _EPOCH + timedelta(seconds=round(t_unix))
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")


@dataclass(frozen=True)
class Window:
    start_unix: float
    end_unix: float
    start_censored: bool
    end_censored: bool

    @property
    def hours(self) -> float:
        return (self.end_unix - self.start_unix) / 3600.0

    def to_contract(self) -> dict:
        return {
            "start": _iso(self.start_unix),
            "end": _iso(self.end_unix),
            "hours": round(self.hours, 1),
            "start_censored": bool(self.start_censored),
            "end_censored": bool(self.end_censored),
        }


def _validate(t_unix: np.ndarray, margin_deg: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    t = np.asarray(t_unix, dtype=float)
    m = np.asarray(margin_deg, dtype=float)
    if t.ndim != 1 or m.ndim != 1 or t.shape != m.shape:
        raise ValueError("t_unix and margin_deg must be 1-D arrays of equal length")
    if t.size < 2:
        raise ValueError("at least 2 samples are required")
    if not (np.all(np.isfinite(t)) and np.all(np.isfinite(m))):
        raise ValueError("t_unix and margin_deg must be finite")
    if np.any(np.diff(t) <= 0):
        raise ValueError("t_unix must be strictly increasing")
    return t, m


def visibility_windows(t_unix: np.ndarray, margin_deg: np.ndarray) -> list[Window]:
    """Runs of samples with margin > 0, edges linearly interpolated to margin == 0."""
    t, m = _validate(t_unix, margin_deg)
    vis = m > 0
    n = t.size

    def cross(i: int, j: int) -> float:
        # margin goes from m[i] to m[j] with opposite visibility; zero crossing
        return float(t[i] + (t[j] - t[i]) * (-m[i] / (m[j] - m[i])))

    out: list[Window] = []
    i = 0
    while i < n:
        if not vis[i]:
            i += 1
            continue
        j = i
        while j + 1 < n and vis[j + 1]:
            j += 1
        start_c = i == 0
        end_c = j == n - 1
        start = float(t[0]) if start_c else cross(i - 1, i)
        end = float(t[-1]) if end_c else cross(j, j + 1)
        if end > start:
            out.append(Window(start, end, start_c, end_c))
        i = j + 1
    return out


def intersect_windows(a: list[Window], b: list[Window]) -> list[Window]:
    """Intersection of two sorted, disjoint window lists."""
    out: list[Window] = []
    i = j = 0
    while i < len(a) and j < len(b):
        x, y = a[i], b[j]
        lo = max(x.start_unix, y.start_unix)
        hi = min(x.end_unix, y.end_unix)
        if hi > lo:
            sc = (x.start_unix == lo and x.start_censored) or (y.start_unix == lo and y.start_censored)
            ec = (x.end_unix == hi and x.end_censored) or (y.end_unix == hi and y.end_censored)
            out.append(Window(lo, hi, sc, ec))
        if x.end_unix < y.end_unix:
            i += 1
        else:
            j += 1
    return out


def longest_gap_hours(windows: list[Window], t_start: float, t_end: float) -> float:
    """Longest stretch of [t_start, t_end] not covered by windows (edge gaps included)."""
    cursor = float(t_start)
    best = 0.0
    for w in sorted(windows, key=lambda w: w.start_unix):
        s = min(max(w.start_unix, t_start), t_end)
        e = min(max(w.end_unix, t_start), t_end)
        best = max(best, s - cursor)
        cursor = max(cursor, e)
    best = max(best, t_end - cursor)
    return best / 3600.0
