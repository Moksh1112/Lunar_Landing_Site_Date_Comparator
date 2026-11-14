"""Exact smooth-sphere horizon (fallback outside terrain coverage)."""

from __future__ import annotations

import math

import numpy as np

from .interface import MOON_RADIUS_M, N_AZ, SkylineResult


def dip_deg(h_site_m: float, h_obs_m: float) -> float:
    """Geometric horizon dip in degrees: acos(R / (R + h_site + h_obs)).

    LOLA heights are relative to the 1,737.4 km sphere, so crater floors are negative; an observer
    below the sphere has no sphere-limb dip, so the height is clamped at 0 (the formula would raise).
    """
    h = max(h_site_m + h_obs_m, 0.0)
    return math.degrees(math.acos(MOON_RADIUS_M / (MOON_RADIUS_M + h)))


def geometric_skyline(h_obs_m: float, h_site_m: float = 0.0) -> SkylineResult:
    """Flat skyline at -dip everywhere. REAL label: exact maths, not invented data."""
    elev = np.full(N_AZ, -dip_deg(h_site_m, h_obs_m), dtype=np.float64)
    return SkylineResult(
        elev_deg=elev,
        block_dist_km=None,
        mode="geometric",
        dem_name=None,
        data_label="REAL",
    )
