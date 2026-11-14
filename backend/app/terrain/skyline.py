"""Terrain SKYLINE algorithm (TRD 4.3): horizon elevation per azimuth from height samplers.

Pure NumPy, no I/O. Exact 3D vector geometry on the 1,737,400 m reference sphere, so the
result does not depend on latitude.
"""

from __future__ import annotations

import math
import time
from dataclasses import dataclass

import numpy as np

from .geometric import dip_deg
from .interface import AZ_STEP_DEG, MOON_RADIUS_M, N_AZ
from .sampling import HeightSampler

_CHUNK_COLS = 128  # distance columns per chunk (bounds memory: 720 x 128 x a few arrays)


@dataclass(frozen=True)
class SkylineComputation:
    elev_deg: np.ndarray  # (720,) float64
    block_dist_km: np.ndarray  # (720,) float64, NaN where no sample
    h_site_m: float
    dip_deg: float
    nodata_fraction: float  # over covered samples
    n_samples: int  # total ray samples evaluated
    elapsed_s: float


def ray_distances_km(
    near_max_km: float = 20.0,
    near_step_m: float = 20.0,
    growth: float = 1.01,
    max_range_km: float = 400.0,
) -> np.ndarray:
    """Ray sample distances (km): linear near_step up to near_max, then geometric growth."""
    n_near = round(near_max_km * 1000.0 / near_step_m)
    near = np.arange(1, n_near + 1, dtype=np.float64) * (near_step_m / 1000.0)
    if max_range_km <= near[-1]:
        return near[near <= max_range_km]
    n_far = math.floor(math.log(max_range_km / near[-1]) / math.log(growth) + 1e-12)
    far = near[-1] * growth ** np.arange(1, n_far + 1, dtype=np.float64)
    far = far[far <= max_range_km * (1.0 + 1e-12)]
    return np.concatenate([near, far])


def destination(
    lat_deg: float, lon_east_deg: float, az_deg: np.ndarray, dist_km: np.ndarray
) -> tuple[np.ndarray, np.ndarray]:
    """Great-circle destination points on the sphere; az (n_az,1) x dist (1,n_d) broadcast."""
    lat1 = math.radians(lat_deg)
    lon1 = math.radians(lon_east_deg)
    az = np.radians(np.asarray(az_deg, dtype=np.float64))
    delta = np.asarray(dist_km, dtype=np.float64) * 1000.0 / MOON_RADIUS_M
    sin_d, cos_d = np.sin(delta), np.cos(delta)
    sin1, cos1 = math.sin(lat1), math.cos(lat1)
    sin2 = np.clip(sin1 * cos_d + cos1 * sin_d * np.cos(az), -1.0, 1.0)
    lat2 = np.arcsin(sin2)
    lon2 = lon1 + np.arctan2(np.sin(az) * sin_d * cos1, cos_d - sin1 * sin2)
    return np.degrees(lat2), np.degrees(lon2)


def _unit(lat_deg: np.ndarray, lon_deg: np.ndarray) -> np.ndarray:
    lat = np.radians(lat_deg)
    lon = np.radians(lon_deg)
    cl = np.cos(lat)
    return np.stack([cl * np.cos(lon), cl * np.sin(lon), np.sin(lat)], axis=-1)


def _sample(
    sampler: HeightSampler, lat: np.ndarray, lon: np.ndarray
) -> tuple[np.ndarray, np.ndarray]:
    """Return (heights, covered) with the input shape; heights are NaN where not usable."""
    shape = lat.shape
    la, lo = lat.ravel(), lon.ravel()
    covered = np.asarray(sampler.covers(la, lo), dtype=bool).reshape(shape)
    h = np.asarray(sampler.heights(la, lo), dtype=np.float64).reshape(shape)
    return h, covered


def compute_skyline(
    lat_deg: float,
    lon_east_deg: float,
    h_obs_m: float,
    near: HeightSampler,
    far: HeightSampler | None = None,
    near_max_km: float = 20.0,
    max_range_km: float = 400.0,
) -> SkylineComputation:
    """Horizon elevation (deg) and blocking distance (km) for 720 azimuths from north."""
    t0 = time.perf_counter()
    h_site = float(
        np.asarray(near.heights(np.array([lat_deg], float), np.array([lon_east_deg], float))).ravel()[0]
    )
    if not np.isfinite(h_site):
        raise ValueError("site height is NaN in the near sampler")

    # Sites below the reference sphere (h_site + h_obs < 0, common in craters) have no dip:
    # acos(R/(R+h)) is undefined for h < 0, so clamp the total height at 0.
    dip = dip_deg(0.0, max(h_site + h_obs_m, 0.0))
    u0 = _unit(np.float64(lat_deg), np.float64(lon_east_deg))
    p0 = (MOON_RADIUS_M + h_site + h_obs_m) * u0

    dists = ray_distances_km(near_max_km=near_max_km, max_range_km=max_range_km)
    az = (np.arange(N_AZ, dtype=np.float64) * AZ_STEP_DEG)[:, None]
    far_s = far if far is not None else near

    best = np.full(N_AZ, -np.inf)
    best_d = np.full(N_AZ, np.nan)
    n_covered = 0
    n_nodata = 0

    for s in range(0, dists.size, _CHUNK_COLS):
        d = dists[s : s + _CHUNK_COLS]
        lat, lon = destination(lat_deg, lon_east_deg, az, d[None, :])
        use_near = (d <= near_max_km)[None, :]
        h = np.full(lat.shape, np.nan)
        covered = np.zeros(lat.shape, dtype=bool)
        for sampler, sel in ((near, use_near), (far_s, ~use_near)):
            cols = np.nonzero(sel[0])[0]
            if cols.size == 0:
                continue
            hs, cs = _sample(sampler, lat[:, cols], lon[:, cols])
            h[:, cols] = hs
            covered[:, cols] = cs
        valid = covered & np.isfinite(h)
        n_covered += int(covered.sum())
        n_nodata += int((covered & ~np.isfinite(h)).sum())

        p = (MOON_RADIUS_M + np.where(valid, h, 0.0))[..., None] * _unit(lat, lon)
        v = p - p0
        norm = np.linalg.norm(v, axis=-1)
        with np.errstate(invalid="ignore", divide="ignore"):
            eps = np.degrees(np.arcsin(np.clip((v @ u0) / norm, -1.0, 1.0)))
        eps = np.where(valid & (norm > 0), eps, -np.inf)
        idx = np.argmax(eps, axis=1)
        chunk_best = eps[np.arange(N_AZ), idx]
        better = chunk_best > best
        best = np.where(better, chunk_best, best)
        best_d = np.where(better, d[idx], best_d)

    has = np.isfinite(best)
    elev = np.where(has, np.maximum(best, -dip), -dip)
    block = np.where(has, best_d, np.nan)
    return SkylineComputation(
        elev_deg=elev.astype(np.float64),
        block_dist_km=block.astype(np.float64),
        h_site_m=h_site,
        dip_deg=dip,
        nodata_fraction=(n_nodata / n_covered) if n_covered else 0.0,
        n_samples=int(N_AZ * dists.size),
        elapsed_s=time.perf_counter() - t0,
    )
