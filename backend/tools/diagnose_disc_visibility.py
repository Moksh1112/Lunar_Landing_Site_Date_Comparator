"""V4 diagnostic sensitivity only: fixed solar radius, never replaces centre-rule acceptance."""
from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'backend'))
from app.compare.service import skyline_at
from app.ephemeris import load_kernels, sun_earth_series
from app.settings import Settings
from app.terrain.illumination import VisibilityMaps
from app.terrain.real import RealTerrain

settings = Settings()
load_kernels(settings.data_dir / 'kernels', settings.kernel_list)
sky = RealTerrain(settings.data_dir).skyline(-88, 90, 0)
series = sun_earth_series(-88, 90, 0, '2000-01-01T00:00:00Z', 18.6 * 365.25 * 24, 1440)
margin = series['sun_el'] - skyline_at(sky.elev_deg, series['sun_az'])
with VisibilityMaps(settings.data_dir) as maps:
    ref = maps.fractions(-88, 90)
result = {'purpose': 'Diagnostic only; does not change the V4 centre-rule result or runtime',
          'point': [-88, 90], 'mode': sky.mode,
          'epoch': '2000-01-01T00:00:00Z', 'step_minutes': 1440,
          'centre_pct': float(np.mean(margin > 0) * 100),
          'upper_limb_approx_pct': float(np.mean(margin + 0.27 > 0) * 100),
          'reference_pct': float(ref['sun'] * 100),
          'reference_neighbourhood_pct': [float(v * 100) for v in ref['sun_range']],
          'caveats': ['Fixed 0.27 deg radius sensitivity, not full disc ray tracing.',
                      'Epoch and terrain remain unmatched to the reference product.',
                      'PGDA PDS label explicitly counts any fraction of the solar disc.']}


print(json.dumps(result))

