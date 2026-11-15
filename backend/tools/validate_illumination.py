"""PRD V4: five polar test points, daily samples over 18.6 years, versus PGDA 69."""
from __future__ import annotations

import argparse
import hashlib
import json
import subprocess
import sys
from datetime import UTC, datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'backend'))
from app.compare.service import skyline_at
from app.ephemeris import load_kernels, sun_earth_series
from app.settings import Settings
from app.terrain.illumination import VisibilityMaps
from app.terrain.real import RealTerrain

POINTS = [(-89, 0), (-88, 90), (-87, 180), (-86, 270), (-85.5, 45)]


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--out', type=Path, required=True)
    args = ap.parse_args()
    settings = Settings()
    if len(load_kernels(settings.data_dir / 'kernels', settings.kernel_list)) != len(settings.kernel_list):
        raise RuntimeError('Missing kernels')
    terrain = RealTerrain(settings.data_dir)
    rows = []
    modes = []
    with VisibilityMaps(settings.data_dir) as maps:
        for lat, lon in POINTS:
            sky = terrain.skyline(lat, lon, 0.0)
            if sky.mode == 'geometric':
                raise RuntimeError('V4 requires real terrain')
            modes.append(sky.mode)
            series = sun_earth_series(lat, lon, 0.0, '2000-01-01T00:00:00Z', 18.6 * 365.25 * 24, 1440)
            ref = maps.fractions(lat, lon)
            for body in ['sun', 'earth']:
                visible = series[f'{body}_el'] > skyline_at(sky.elev_deg, series[f'{body}_az'])
                actual = float(visible.mean() * 100)
                expected = float(ref[body] * 100)
                error = abs(actual - expected)
                rows.append({'case': f'{lat},{lon}', 'metric': f'{body}_visibility', 'actual': actual,
                             'reference': expected, 'unit': 'percentage_points', 'abs_error': error,
                             'tolerance': 5.0, 'status': 'pass' if error <= 5 else 'fail'})
                print(lat, lon, body, round(actual, 3), round(expected, 3), flush=True)
    result = {'schema_version': '1.0', 'check_id': 'V4', 'title': '18.6-year daily visibility versus PGDA 69',
              'data_label': 'REAL', 'scope': 'full_check', 'review_status': 'owner_reported',
              'generated_at': datetime.now(UTC).strftime('%Y-%m-%dT%H:%M:%SZ'),
              'producer_commit': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip(),
              'command': 'node scripts/python.mjs backend/tools/validate_illumination.py --out validation/results/V4-illumination.json',
              'sources': [{'label': 'Reference', 'reference': 'https://pgda.gsfc.nasa.gov/products/69'},
                          {'label': 'Terrain', 'reference': 'https://pgda.gsfc.nasa.gov/products/90'}],
              'manifest_sha256': hashlib.sha256((settings.data_dir / 'MANIFEST.json').read_bytes()).hexdigest(),
              'coverage': f'Five mathematical polar test positions; daily epochs over 18.6 years from 2000-01-01; modes {modes}.',
              'status': 'pass' if all(r['status'] == 'pass' for r in rows) else 'fail', 'rows': rows,
              'limitations': ['PGDA counts any visible disc portion; runtime uses body centres.',
                              'Daily sampling differs from the reference hourly sampling.',
                              'Reference map averaging start epoch is not established here.',
                              'Coarse terrain may miss local obstacles; no external scientific acceptance.']}
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(result, indent=2) + '\n', encoding='utf-8')
    return 0 if result['status'] == 'pass' else 1


if __name__ == '__main__':
    raise SystemExit(main())
