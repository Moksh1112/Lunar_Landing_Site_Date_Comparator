"""Reproduce PRD V6 diagnostics; a named qualitative review is required for acceptance."""
from __future__ import annotations

import argparse
import hashlib
import json
import subprocess
import sys
from datetime import UTC, datetime
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'backend'))
from app.ephemeris import load_kernels, sun_earth_series
from app.settings import Settings


def rows_for(series: dict, reviewed: bool = False) -> list[dict]:
    rows = []
    for body in ('sun', 'earth'):
        values = np.asarray(series[f'{body}_el'], dtype=float)
        if not values.size or not np.isfinite(values).all():
            raise ValueError('V6 requires nonempty finite real elevation samples')
        for name, reducer in [('minimum', np.min), ('maximum', np.max)]:
            rows.append({'case': '89 S, 0 E, March 2027',
                         'metric': f'{body}_{name}_elevation', 'actual': float(reducer(values)),
                         'reference': None, 'unit': 'deg',
                         'status': 'pass' if reviewed else 'not_evaluated'})
    return rows


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--out', type=Path, required=True)
    ap.add_argument('--review-note', help='Explicit P2 qualitative assessment; no numeric tolerance is inferred')
    args = ap.parse_args()
    settings = Settings()
    if len(load_kernels(settings.data_dir / 'kernels', settings.kernel_list)) != len(settings.kernel_list):
        raise RuntimeError('Missing kernels')
    series = sun_earth_series(-89, 0, 0, '2027-03-01T00:00:00Z', 708, 60)
    reviewed = bool(args.review_note and args.review_note.strip())
    result = {'schema_version': '1.0', 'check_id': 'V6',
              'title': 'Polar real-world sanity: owner qualitative review' if reviewed else 'Polar sanity diagnostics: review pending',
              'data_label': 'REAL', 'scope': 'spot_check', 'review_status': 'owner_reported',
              'generated_at': datetime.now(UTC).strftime('%Y-%m-%dT%H:%M:%SZ'),
              'producer_commit': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip(),
              'command': 'node scripts/python.mjs backend/tools/validate_sanity.py --out validation/results/V6-sanity.json'
                         + (' --review-note "' + args.review_note + '"' if reviewed else ''),
              'sources': [{'label': 'Qualitative criterion', 'reference': 'docs/specs/Azelux_PRD.pdf section 8.3 V6'},
                          {'label': 'NASA polar geometry', 'reference': 'https://science.nasa.gov/resource/earth-and-sun-from-the-moons-south-pole/'}],
              'manifest_sha256': hashlib.sha256((settings.data_dir / 'MANIFEST.json').read_bytes()).hexdigest(),
              'coverage': f'89 S, 0 E; 708 h from 2027-03-01 UTC, hourly, {len(series["sun_el"])} samples.',
              'status': 'pass' if reviewed else 'incomplete', 'rows': rows_for(series, reviewed),
              'limitations': ['Qualitative spot check, not a numeric accuracy test or independent certification.',
                              'V1/V2 provide the separate quantitative ephemeris cross-check.',
                              'Observer is at the reference sphere, 0 m; this check does not assess terrain visibility.']}
    if reviewed:
        result['limitations'].append('P2 owner assessment: ' + args.review_note.strip())
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(result, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'status': result['status'], 'rows': result['rows']}))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())

