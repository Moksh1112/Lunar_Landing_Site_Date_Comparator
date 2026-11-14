"""POST /api/v1/sweep, real mode (TRD 5.4, P2 S3.1): best landing date in a range.

1. One 30-min grid from range_start 00:00Z to range_end 00:00Z + mission_hours; Sun/Earth az/el and
   visibility margins are computed once.
2. Each candidate day (00:00 UTC) slices [day, day + mission_hours] out of that grid -> metrics + verdict.
   If the window end falls between grid samples (mission_hours * 2 not an integer) the exact end time is
   appended with margin/elevation linearly interpolated, so durations stay exact.
3. Rank: verdict green > amber > red, then both_hours descending, then longest_dark_h ascending, then date.
4. The top 5 are recomputed from fresh 10-min series (refined: true) and re-ranked among themselves
   (ranks 1..5); every other day keeps its 30-min metrics and ranks 6..N.
"""
from __future__ import annotations

from datetime import UTC, datetime, timedelta

import numpy as np

from app.api.errors import ApiError
from app.api.models import SweepRequest, SweepResponse
from app.compare.service import EPHEMERIS_LABEL, skyline_at
from app.ephemeris import kernels_loaded, sun_earth_series
from app.metrics import scenario_metrics, verdict
from app.settings import APP_VERSION, CONTRACT_VERSION
from app.sites.loader import get_site
from app.terrain.interface import TerrainProvider

STEP_MINUTES = 30
REFINE_STEP_MINUTES = 10
TOP_N = 5
_LEVEL_ORDER = {"green": 0, "amber": 1, "red": 2}


def rank_key(day: dict) -> tuple:
    """Sort key, best first. `day` needs date, metrics and verdict."""
    m = day["metrics"]
    return (_LEVEL_ORDER[day["verdict"]["level"]], -m["both_hours"], m["longest_dark_h"], day["date"])


def slice_window(t, arrays: list, t0: float, t1: float) -> tuple[np.ndarray, list[np.ndarray]]:
    """Grid samples in [t0, t1]; boundaries between grid samples are added with linearly interpolated values."""
    t = np.asarray(t, dtype=float)
    full = [np.asarray(a, dtype=float) for a in arrays]
    lo = int(np.searchsorted(t, t0, side="left"))
    hi = int(np.searchsorted(t, t1, side="right"))  # exclusive
    ts, outs = t[lo:hi], [a[lo:hi] for a in full]
    if lo > 0 and (ts.size == 0 or ts[0] > t0):
        ts = np.concatenate([[t0], ts])
        outs = [np.concatenate([[np.interp(t0, t, a)], o]) for a, o in zip(full, outs, strict=True)]
    if hi < t.size and (ts.size == 0 or ts[-1] < t1):
        ts = np.concatenate([ts, [t1]])
        outs = [np.concatenate([o, [np.interp(t1, t, a)]]) for a, o in zip(full, outs, strict=True)]
    return ts, outs


def _margins(series: dict, elev: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    return (series["sun_el"] - skyline_at(elev, series["sun_az"]),
            series["earth_el"] - skyline_at(elev, series["earth_az"]))


def _day_result(day: str, t, sun_el, sun_m, earth_m, mission_hours: float, thresholds: dict,
                refined: bool) -> dict:
    metrics, _ = scenario_metrics(t, sun_el, sun_m, earth_m, mission_hours)
    return {"date": day, "rank": 0, "refined": refined, "metrics": metrics, "verdict": verdict(metrics, thresholds)}


def _assign_ranks(days: list[dict], first_rank: int) -> list[dict]:
    ordered = sorted(days, key=rank_key)
    for i, d in enumerate(ordered):
        d["rank"] = first_rank + i
    return ordered


def run_sweep(req: SweepRequest, terrain: TerrainProvider) -> dict:
    kernels = kernels_loaded()
    if not kernels:
        raise ApiError("INTERNAL", "Ephemeris data is not loaded on this server.", http=500)
    computed_at = datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")
    thresholds = req.thresholds.model_dump()
    mission_h = float(req.mission_hours)
    h_obs = float(req.observer_height_m)

    if req.site.site_id:
        entry = get_site(req.site.site_id)  # NOT_FOUND (404) for unknown ids
        site = {"site_id": entry["site_id"], "name": entry["name"],
                "lat_deg": entry["lat_deg"], "lon_east_deg": entry["lon_east_deg"]}
    else:
        site = {"site_id": None, "name": req.site.name, "lat_deg": req.site.lat_deg,
                "lon_east_deg": req.site.lon_east_deg}
    lat, lon = site["lat_deg"], site["lon_east_deg"]

    sky = terrain.skyline(lat, lon, h_obs)
    h_site = 0.0 if sky.mode == "geometric" else float(terrain.site_height(lat, lon))
    elev = np.asarray(sky.elev_deg, dtype=float)
    h_total = h_site + h_obs

    n_days = (req.range_end - req.range_start).days + 1
    start_iso = f"{req.range_start.isoformat()}T00:00:00Z"
    series = sun_earth_series(lat, lon, h_total, start_iso, (n_days - 1) * 24.0 + mission_h, float(STEP_MINUTES))
    sun_m, earth_m = _margins(series, elev)
    t = series["t_unix"]
    t_start = float(t[0])

    days: list[dict] = []
    for d in range(n_days):
        t0 = t_start + d * 86400.0
        ts, (el, sm, em) = slice_window(t, [series["sun_el"], sun_m, earth_m], t0, t0 + mission_h * 3600.0)
        iso = (req.range_start + timedelta(days=d)).isoformat()
        days.append(_day_result(iso, ts, el, sm, em, mission_h, thresholds, False))

    ranked = _assign_ranks(days, 1)
    top = ranked[:TOP_N]
    for i, d in enumerate(top):
        fine = sun_earth_series(lat, lon, h_total, f"{d['date']}T00:00:00Z", mission_h, float(REFINE_STEP_MINUTES))
        sm, em = _margins(fine, elev)
        top[i] = _day_result(d["date"], fine["t_unix"], fine["sun_el"], sm, em, mission_h, thresholds, True)
    top = _assign_ranks(top, 1)
    rest = ranked[TOP_N:]
    for i, d in enumerate(rest):
        d["rank"] = TOP_N + 1 + i  # keep 30-min order for ranks 6..N

    by_date = {d["date"]: d for d in top + rest}
    response = {
        "contract_version": CONTRACT_VERSION,
        "site": site,
        "meta": {
            "ephemeris": EPHEMERIS_LABEL,
            "kernels": kernels,
            "horizon_mode": sky.mode,
            "dem": sky.dem_name if sky.mode != "geometric" else None,
            "step_minutes": STEP_MINUTES,
            "observer_height_m": h_obs,
            "app_version": APP_VERSION,
            "contract_version": CONTRACT_VERSION,
            "computed_at": computed_at,
            "data_label": "REAL",
        },
        "days": [by_date[k] for k in sorted(by_date)],
        "top": [d["date"] for d in top],
    }
    return SweepResponse.model_validate(response).model_dump(mode="json")
