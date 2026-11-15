"""V6 rejects invalid diagnostic inputs and requires review to mark rows accepted."""
import importlib.util
from pathlib import Path

import pytest

SPEC = importlib.util.spec_from_file_location('sanity_runner', Path(__file__).parents[1] / 'tools' / 'validate_sanity.py')
module = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(module)


def test_sanity_diagnostics_do_not_automatically_accept():
    rows = module.rows_for({'sun_el': [-1, 2], 'earth_el': [-6, 7]})
    assert [r['actual'] for r in rows] == [-1, 2, -6, 7]
    assert all(r['status'] == 'not_evaluated' and r['reference'] is None for r in rows)


@pytest.mark.parametrize('values', [[], [float('nan')], [float('inf')]])
def test_sanity_rejects_unusable_series(values):
    with pytest.raises(ValueError, match='finite'):
        module.rows_for({'sun_el': values, 'earth_el': [0]})
