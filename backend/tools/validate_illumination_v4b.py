"""V4b (validation only, approved 15 Nov 2026): any-fraction disc visibility vs PGDA 69.

Same five points, reference maps and <= 5 pp target as V4. Differences, chosen to match the
reference definition (PGDA product 69: hourly time steps over 18.6 years; a body counts as
visible if any part of its disc is unobscured):
- hourly samples over 18.6 years from 2000-01-01 (V4 used daily samples),
- a body is visible if any of LIMB_POINTS points on its disc limb is above the computed skyline;
  the disc angular radius comes from the SPICE observer-body distance at each sample.
The hourly centre-rule value is reported alongside to separate the sampling effect from the disc
rule. Runtime behaviour (body centres) is unchanged. V4 stays a recorded FAIL either way.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
import subprocess
import sys
import time
from datetime import UTC, datetime
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'backend'))
import spiceypy as sp

from app.compare.service import skyline_at
from app.ephemeris import load_kernels
from app.ephemeris.spice import SPICE_LOCK, site_frame, time_grid
from app.settings import Settings
from app.terrain.illumination import VisibilityMaps
from app.terrain.real import RealTerrain

POINTS = [(-89, 0), (-88, 90), (-87, 180), (-86, 270), (-85.5, 45)]
RADIUS_KM = {'SUN': 695_700.0, 'EARTH': 6_371.0}  # IAU nominal solar radius; mean Earth radius
LIMB_POINTS = 32
START, YEARS, STEP_MIN = '2000-01-01T00:00:00Z', 18.6, 60


def az_el_radius(target: str, ets: np.ndarray, obs, east, north, up):
    """Azimuth, elevation and apparent angular radius (deg) of target at each epoch."""
    n = len(ets)
    az, el, rad = np.empty(n), np.empty(n), np.empty(n)
    obs = np.asarray(obs, dtype=float)
    with SPICE_LOCK:
        for i, et in enumerate(ets):
            state, _lt = sp.spkcpo(target, float(et), 'MOON_ME', 'OBSERVER', 'LT+S', obs, 'MOON', 'MOON_ME')
            v = state[:3]
            e, nn, u = float(v @ east), float(v @ north), float(v @ up)
            dist = math.sqrt(e * e + nn * nn + u * u)
            az[i] = math.degrees(math.atan2(e, nn)) % 360.0
            el[i] = math.degrees(math.atan2(u, math.hypot(e, nn)))
            rad[i] = math.degrees(math.asin(min(1.0, RADIUS_KM[target] / dist)))
    return az, el, rad


def any_fraction_visible(sky_elev: np.ndarray, az: np.ndarray, el: np.ndarray, rad: np.ndarray) -> np.ndarray:
    """True where any of LIMB_POINTS limb points (or the centre) is above the skyline."""
    vis = el > skyline_at(sky_elev, az)
    theta = np.linspace(0.0, 2.0 * math.pi, LIMB_POINTS, endpoint=False)
    cos_el = np.maximum(np.cos(np.radians(el)), 1e-6)
    for t in theta:
        el_k = el + rad * math.sin(t)
        az_k = (az + rad * math.cos(t) / cos_el) % 360.0
        vis |= el_k > skyline_at(sky_elev, az_k)
    return vis


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--out', type=Path, required=True)
    args = ap.parse_args()
    settings = Settings()
    if len(load_kernels(settings.data_dir / 'kernels', settings.kernel_list)) != len(settings.kernel_list):
        raise RuntimeError('Missing kernels')
    terrain = RealTerrain(settings.data_dir)
    rows, modes = [], []
    _t_unix, ets = time_grid(START, YEARS * 365.25 * 24, STEP_MIN)
    with VisibilityMaps(settings.data_dir) as maps:
        for lat, lon in POINTS:
            t0 = time.time()
            sky = terrain.skyline(lat, lon, 0.0)
            if sky.mode == 'geometric':
                raise RuntimeError('V4b requires real terrain')
            modes.append(sky.mode)
            frame = site_frame(lat, lon, 0.0)
            ref = maps.fractions(lat, lon)
            for body in ['SUN', 'EARTH']:
                az, el, rad = az_el_radius(body, ets, *frame)
                centre = float((el > skyline_at(sky.elev_deg, az)).mean() * 100)
                actual = float(any_fraction_visible(sky.elev_deg, az, el, rad).mean() * 100)
                expected = float(ref[body.lower()] * 100)
                error = abs(actual - expected)
                rows.append({'case': f'{lat},{lon}', 'metric': f'{body.lower()}_visibility_any_fraction', 'actual': actual,
                             'reference': expected, 'unit': 'percentage_points', 'abs_error': error, 'tolerance': 5.0,
                             'status': 'pass' if error <= 5 else 'fail'})
                # informational only (evidence schema v1.0 rows are strict): hourly centre rule, same reference
                rows.append({'case': f'{lat},{lon}', 'metric': f'{body.lower()}_visibility_centre_hourly_info', 'actual': centre,
                             'reference': expected, 'unit': 'percentage_points', 'abs_error': abs(centre - expected),
                             'status': 'not_evaluated'})
                print(lat, lon, body, 'any', round(actual, 3), 'centre', round(centre, 3), 'ref', round(expected, 3),
                      f'{time.time() - t0:.0f}s', flush=True)
    result = {'schema_version': '1.0', 'check_id': 'V4',
              'title': 'V4b: 18.6-year hourly any-fraction disc visibility versus PGDA 69 (approved acceptance basis for V4)',
              'data_label': 'REAL', 'scope': 'full_check', 'review_status': 'owner_reported',
              'generated_at': datetime.now(UTC).strftime('%Y-%m-%dT%H:%M:%SZ'),
              'producer_commit': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip(),
              'command': 'node scripts/python.mjs backend/tools/validate_illumination_v4b.py --out validation/results/V4b-any-fraction.json',
              'sources': [{'label': 'Reference', 'reference': 'https://pgda.gsfc.nasa.gov/products/69'},
                          {'label': 'Terrain', 'reference': 'https://pgda.gsfc.nasa.gov/products/90'}],
              'manifest_sha256': hashlib.sha256((settings.data_dir / 'MANIFEST.json').read_bytes()).hexdigest(),
              'coverage': f'Five V4 points; hourly epochs over 18.6 years from 2000-01-01; any-fraction disc ({LIMB_POINTS} limb points); modes {modes}.',
              'status': 'pass' if all(r['status'] in ('pass', 'not_evaluated') for r in rows) else 'fail', 'rows': rows,
              'limitations': ['Runtime keeps the body-centre rule; the centre-rule V4 artifact remains a recorded FAIL (definition mismatch).',
                              'Rows ending _centre_hourly_info are informational (not judged): the same hourly samples with the centre rule.',
                              'Reference averaging start epoch and observer height are not published; 2000-01-01 and 0 m are assumed.',
                              'Limb sampled at 32 points against the azimuth-interpolated skyline; not full ray tracing of the disc.',
                              'Terrain (PGDA 90 near + far) differs from the 60 m DEM behind the reference map.',
                              'Owner-run; no external scientific acceptance.']}
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(result, indent=2) + '\n', encoding='utf-8')
    return 0 if result['status'] == 'pass' else 1


if __name__ == '__main__':
    raise SystemExit(main())
