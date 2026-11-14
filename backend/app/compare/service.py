"""POST /api/v1/compare, real mode (TRD 1 request flow, 4.5 visibility, 5 metrics, 6.3 shape).

Per scenario:
  resolve site (site_id from the library, else lat/lon)
  -> terrain provider skyline (mode terrain | terrain_coarse | geometric, chosen by the C08 rule)
  -> SPICE Sun/Earth az/el on the time grid, observer at site height + observer height
  -> visibility margin = elevation - skyline at the body's azimuth (linear between 0.5 deg bins)
  -> windows (interpolated edges, censored flags), metrics, verdict
then A - B deltas, meta (data_label REAL) and limitations.
"""
from __future__ import annotations

import math
from datetime import UTC, datetime

import numpy as np

from app.api.errors import ApiError
from app.api.models import CompareRequest, CompareResponse, CompareScenario
from app.ephemeris import kernels_loaded, sun_earth_series
from app.metrics import deltas, scenario_metrics, verdict
from app.settings import APP_VERSION, CONTRACT_VERSION
from app.sites.loader import get_site
from app.terrain.interface import AZ_STEP_DEG, N_AZ, TerrainProvider

EPHEMERIS_LABEL = "SPICE DE440 (JPL NAIF)"
BASE_LIMITATIONS = [
    "Visibility uses the centre of the Sun and Earth; partially visible disks are not modelled.",
    "Sunlight is not power and Earth in view is not a radio link (no watts, no link budget).",
    "Terrain beyond the DEM edge and features smaller than a DEM pixel are ignored.",
    "Planning and education aid only: not a landing-safety certification.",
]


def skyline_at(elev_deg: np.ndarray, az_deg: np.ndarray) -> np.ndarray:
    """Skyline elevation at each azimuth: linear between the two nearest 0.5 deg bins, wrapping at 360."""
    x = (np.asarray(az_deg, dtype=float) % 360.0) / AZ_STEP_DEG
    i0 = np.floor(x).astype(np.int64) % N_AZ
    frac = x - np.floor(x)
    return elev_deg[i0] * (1.0 - frac) + elev_deg[(i0 + 1) % N_AZ] * frac


def _resolve_site(scenario: CompareScenario) -> dict:
    site = scenario.site
    if site.site_id:
        entry = get_site(site.site_id)  # NOT_FOUND (404) for unknown ids
        return {"site_id": entry["site_id"], "name": entry["name"],
                "lat_deg": entry["lat_deg"], "lon_east_deg": entry["lon_east_deg"]}
    return {"site_id": None, "name": site.name, "lat_deg": site.lat_deg, "lon_east_deg": site.lon_east_deg}


def _round_list(values: np.ndarray, digits: int = 3) -> list[float]:
    return [round(float(v), digits) for v in values]


def _scenario(scenario: CompareScenario, req: CompareRequest, terrain: TerrainProvider,
              kernels: list[str], computed_at: str) -> tuple[dict, list[str]]:
    site = _resolve_site(scenario)
    lat, lon, h_obs = site["lat_deg"], site["lon_east_deg"], float(req.observer_height_m)

    sky = terrain.skyline(lat, lon, h_obs)
    h_site = 0.0 if sky.mode == "geometric" else float(terrain.site_height(lat, lon))
    series = sun_earth_series(lat, lon, h_site + h_obs, scenario.start_utc, float(scenario.mission_hours),
                              float(req.step_minutes))

    elev = np.asarray(sky.elev_deg, dtype=float)
    sun_margin = series["sun_el"] - skyline_at(elev, series["sun_az"])
    earth_margin = series["earth_el"] - skyline_at(elev, series["earth_az"])
    metrics, windows = scenario_metrics(series["t_unix"], series["sun_el"], sun_margin, earth_margin,
                                        float(scenario.mission_hours))

    block = None
    if sky.block_dist_km is not None:
        # an azimuth with no evaluable sample has no blocking distance; 0.0 marks "none found"
        block = [0.0 if not math.isfinite(float(v)) else round(float(v), 3) for v in sky.block_dist_km]

    notes = []
    if sky.mode == "geometric":
        notes.append(f"Scenario {scenario.id} uses geometric horizon only (no terrain data at this site).")
    elif sky.mode == "terrain_coarse":
        notes.append(f"Scenario {scenario.id} uses the coarse (160 m) terrain model only; "
                     "no 20 m near-field tile covers this site.")

    result = {
        "id": scenario.id,
        "label": scenario.label,
        "site": site,
        "meta": {
            "ephemeris": EPHEMERIS_LABEL,
            "kernels": kernels,
            "horizon_mode": sky.mode,
            "dem": sky.dem_name if sky.mode != "geometric" else None,
            "step_minutes": req.step_minutes,
            "observer_height_m": h_obs,
            "app_version": APP_VERSION,
            "contract_version": CONTRACT_VERSION,
            "computed_at": computed_at,
            "data_label": "REAL",
        },
        "skyline": {"az_step_deg": AZ_STEP_DEG, "elev_deg": _round_list(elev), "block_dist_km": block},
        "series": {
            "t_unix": [int(t) for t in series["t_unix"]],
            "sun_az": _round_list(series["sun_az"]),
            "sun_el": _round_list(series["sun_el"]),
            "earth_az": _round_list(series["earth_az"]),
            "earth_el": _round_list(series["earth_el"]),
            "sun_vis": [int(v) for v in (sun_margin > 0)],
            "earth_vis": [int(v) for v in (earth_margin > 0)],
        },
        "windows": {name: [w.to_contract() for w in ws] for name, ws in windows.items()},
        "metrics": metrics,
        "verdict": verdict(metrics, req.thresholds.model_dump()),
    }
    return result, notes


def run_compare(req: CompareRequest, terrain: TerrainProvider) -> dict:
    kernels = kernels_loaded()
    if not kernels:
        raise ApiError("INTERNAL", "Ephemeris data is not loaded on this server.", http=500)
    computed_at = datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")
    scenarios, limitations = [], list(BASE_LIMITATIONS)
    for scenario in req.scenarios:
        result, notes = _scenario(scenario, req, terrain, kernels, computed_at)
        scenarios.append(result)
        limitations.extend(notes)
    by_id = {s["id"]: s for s in scenarios}
    response = {
        "contract_version": CONTRACT_VERSION,
        "scenarios": scenarios,
        "deltas": deltas(by_id["A"]["metrics"], by_id["B"]["metrics"]),
        "limitations": limitations,
    }
    # The response is checked against the contract model before it leaves the server.
    return CompareResponse.model_validate(response).model_dump(mode="json")
