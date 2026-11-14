"""Reproduce PRD V1/V2: three test positions x 48 hourly UTC epochs against Horizons.

Run from repository root with AZX_DATA_DIR set and backend packages installed:
node scripts/python.mjs backend/tools/validate_ephemeris.py --out-dir validation/results
Test positions are mathematical validation inputs, not sourced landing sites.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import subprocess
import sys
from datetime import UTC, datetime, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'backend'))
sys.path.insert(0, str(Path(__file__).resolve().parent))
from horizons_spot_check import angle_diff, horizons

from app.ephemeris import load_kernels, sun_earth_series
from app.settings import Settings

POSITIONS = [('polar', -89.0, 0.0), ('near-side', 0.0, 0.0), ('far-side', 0.0, 180.0)]
START = datetime(2027, 3, 1, tzinfo=UTC)
TOLERANCE = 0.05


def header_coordinates(echo: str) -> tuple[float, float, float]:
    match = re.search(r'Center geodetic\s*:\s*([-+\d.eE]+),\s*([-+\d.eE]+),\s*([-+\d.eE]+)', echo)
    if not match or 'E-lon(deg)' not in echo:
        raise ValueError(f'Unexpected Horizons coordinate convention: {echo}')
    return tuple(float(x) for x in match.groups())


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--out-dir', type=Path, required=True)
    args = ap.parse_args()
    settings = Settings()
    loaded = load_kernels(settings.data_dir / 'kernels', settings.kernel_list)
    if len(loaded) != len(settings.kernel_list):
        raise RuntimeError('All configured kernels are required')
    rows, frame_rows, echoes = [], [], []
    stop = START + timedelta(hours=47)
    for name, lat, lon in POSITIONS:
        ours = sun_earth_series(lat, lon, 0.0, START.strftime('%Y-%m-%dT%H:%M:%SZ'), 47, 60)
        for body, target in [('sun', '10'), ('earth', '399')]:
            reference = horizons(target, lat, lon, START, stop, 60)
            if len(reference) != 48 or len(ours['t_unix']) != 48:
                raise ValueError('Expected exactly 48 hourly samples')
            for i, (when, az, el, echo) in enumerate(reference):
                epoch = datetime.strptime(when.strip(), '%Y-%b-%d %H:%M').replace(tzinfo=UTC)
                if int(epoch.timestamp()) != int(ours['t_unix'][i]):
                    raise ValueError('Horizons and SPICE epochs do not align')
                for metric, actual, expected in [('azimuth', float(ours[f'{body}_az'][i]), az),
                                                 ('elevation', float(ours[f'{body}_el'][i]), el)]:
                    error = angle_diff(actual, expected) if metric == 'azimuth' else abs(actual - expected)
                    rows.append({'case': f'{name} {body} {epoch.isoformat()}', 'metric': metric,
                                     'actual': actual, 'reference': expected, 'unit': 'deg', 'abs_error': error,
                                     'tolerance': TOLERANCE, 'status': 'pass' if error <= TOLERANCE else 'fail'})
            echo = reference[0][3]
            observed = header_coordinates(echo)
            echoes.append({'position': name, 'body': body, 'header': echo})
            for metric, actual, expected in zip(['longitude_east', 'latitude'],
                                              observed[:2], [lon, lat]):
                frame_rows.append({'case': f'{name} {body}', 'metric': metric, 'actual': actual,
                                       'reference': expected, 'unit': 'km' if metric == 'height_km' else 'deg',
                                       'abs_error': abs(actual - expected), 'tolerance': 0,
                                       'status': 'pass' if actual == expected else 'fail'})
            print(f'{name} {body}: 48 aligned samples', flush=True)
    commit = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()
    manifest = settings.data_dir / 'MANIFEST.json'
    common = {'schema_version': '1.0', 'data_label': 'REAL', 'scope': 'full_check',
                  'review_status': 'owner_reported', 'generated_at': datetime.now(UTC).strftime('%Y-%m-%dT%H:%M:%SZ'),
                  'producer_commit': commit,
                  'command': 'node scripts/python.mjs backend/tools/validate_ephemeris.py --out-dir validation/results',
                  'sources': [{'label': 'Reference', 'reference': 'https://ssd.jpl.nasa.gov/api/horizons.api'},
                           {'label': 'Runtime', 'reference': 'SPICE DE440 MOON_ME, LT+S; ' + ', '.join(loaded)}],
                  'coverage': 'Three mathematical test positions (polar, near side, far side), 48 hourly epochs, Sun/Earth.',
                  'limitations': ['Horizons DE441 versus runtime DE440.',
                               'Same implementation team ran the check; external review remains pending.',
                               'This validates ephemeris and coordinate conventions, not terrain or mission safety.']}
    if manifest.is_file():
        common['manifest_sha256'] = hashlib.sha256(manifest.read_bytes()).hexdigest()
    args.out_dir.mkdir(parents=True, exist_ok=True)
    for check_id, title, data in [('V1', 'SPICE versus Horizons: 3 positions x 48 hours', rows),
                                  ('V2', 'Horizons east-positive coordinate header parity', frame_rows)]:
        result = dict(common, check_id=check_id, title=title, rows=data,
                      status='pass' if all(r['status'] == 'pass' for r in data) else 'fail')
        (args.out_dir / f'{check_id}-ephemeris.json').write_text(json.dumps(result, indent=2) + '\n', encoding='utf-8')
    (args.out_dir.parent / 'horizons-coordinate-headers.json').write_text(json.dumps(echoes, indent=2) + '\n')
    return 0 if all(r['status'] == 'pass' for r in rows + frame_rows) else 1


if __name__ == '__main__':
    raise SystemExit(main())
