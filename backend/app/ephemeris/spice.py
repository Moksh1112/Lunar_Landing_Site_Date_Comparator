"""Sun/Earth azimuth/elevation at a lunar surface site (TRD 3.3).

SPICE keeps process-global state and is not thread-safe, so every spiceypy call
in this module is made while holding SPICE_LOCK.
"""
import logging
import math
import threading
from datetime import UTC, datetime
from functools import lru_cache
from pathlib import Path

import numpy as np
import spiceypy as sp

logger = logging.getLogger("azelux.ephemeris")

SPICE_LOCK = threading.Lock()
MOON_RADIUS_KM = 1737.4
MAX_ABS_LAT_DEG = 89.99
_LOADED: list[str] = []


def load_kernels(kernel_dir: Path, names: list[str]) -> list[str]:
    """furnsh each existing kernel once. Missing files are logged, not raised."""
    kernel_dir = Path(kernel_dir)
    with SPICE_LOCK:
        for name in names:
            if name in _LOADED:
                continue
            path = kernel_dir / name
            if not path.is_file():
                logger.warning("SPICE kernel missing: %s", path)
                continue
            sp.furnsh(str(path))
            _LOADED.append(name)
        return list(_LOADED)


def kernels_loaded() -> list[str]:
    with SPICE_LOCK:
        return list(_LOADED)


def _reset_for_tests() -> None:
    """Unload everything and clear the registry and result cache (test helper)."""
    with SPICE_LOCK:
        sp.kclear()
        _LOADED.clear()
    sun_earth_series.cache_clear()


def site_frame(lat_deg: float, lon_east_deg: float, height_m: float):
    """Return (obs_km, east, north, up) in MOON_ME for a spherical Moon."""
    if abs(lat_deg) > MAX_ABS_LAT_DEG:
        raise ValueError(f"|latitude| must be <= {MAX_ABS_LAT_DEG} degrees")
    lat, lon = math.radians(lat_deg), math.radians(lon_east_deg)
    up = np.array([math.cos(lat) * math.cos(lon), math.cos(lat) * math.sin(lon), math.sin(lat)])
    east = np.array([-math.sin(lon), math.cos(lon), 0.0])
    north = np.cross(up, east)
    obs = up * (MOON_RADIUS_KM + height_m / 1000.0)
    return obs, east, north, up


def az_el_series(target: str, ets: np.ndarray, obs, east, north, up):
    """Azimuth (deg, clockwise from north, [0,360)) and elevation (deg) of target."""
    az = np.empty(len(ets))
    el = np.empty(len(ets))
    obs = np.asarray(obs, dtype=float)
    with SPICE_LOCK:
        for i, et in enumerate(ets):
            state, _lt = sp.spkcpo(target, float(et), "MOON_ME", "OBSERVER", "LT+S", obs, "MOON", "MOON_ME")
            v = state[:3]
            e, n, u = float(v @ east), float(v @ north), float(v @ up)
            az[i] = math.degrees(math.atan2(e, n)) % 360.0
            el[i] = math.degrees(math.atan2(u, math.hypot(e, n)))
    return az, el


def _parse_utc(start_utc: str) -> datetime:
    return datetime.fromisoformat(start_utc).astimezone(UTC)


def time_grid(start_utc: str, mission_hours: float, step_minutes: float):
    """Samples at start + k*step with both ends included (last step may be partial)."""
    total_s = mission_hours * 3600.0
    step_s = step_minutes * 60.0
    n = math.ceil(round(total_s / step_s, 9)) + 1
    offsets = np.minimum(np.arange(n, dtype=float) * step_s, total_s)
    with SPICE_LOCK:
        et0 = sp.str2et(start_utc)
    t0 = int(_parse_utc(start_utc).timestamp())
    t_unix = t0 + np.rint(offsets).astype(np.int64)
    return t_unix, et0 + offsets


@lru_cache(maxsize=256)
def _cached(lat: float, lon: float, start_utc: str, mission_hours: float, step_minutes: float, height_m: float):
    t_unix, ets = time_grid(start_utc, mission_hours, step_minutes)
    obs, east, north, up = site_frame(lat, lon, height_m)
    sun_az, sun_el = az_el_series("SUN", ets, obs, east, north, up)
    earth_az, earth_el = az_el_series("EARTH", ets, obs, east, north, up)
    out = {"t_unix": t_unix, "sun_az": sun_az, "sun_el": sun_el, "earth_az": earth_az, "earth_el": earth_el}
    for arr in out.values():
        arr.setflags(write=False)
    return out


def sun_earth_series(lat_deg: float, lon_east_deg: float, height_m: float, start_utc: str,
                     mission_hours: float, step_minutes: float) -> dict:
    return _cached(round(lat_deg, 5), round(lon_east_deg, 5), start_utc, mission_hours, step_minutes,
                   round(height_m, 3))


sun_earth_series.cache_clear = _cached.cache_clear  # type: ignore[attr-defined]
