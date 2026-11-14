"""Reject ambiguous longitude conventions before accepting a V2 result."""
import importlib.util
from pathlib import Path

import pytest

spec = importlib.util.spec_from_file_location('validate_ephemeris', Path(__file__).parents[1] / 'tools/validate_ephemeris.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


def test_horizons_header_coordinates():
    assert module.header_coordinates('Center geodetic : 180.0, -89.0, 0.0 {E-lon(deg),Lat(deg),Alt(km)}') == (180, -89, 0)


def test_reject_wrong_longitude_convention():
    with pytest.raises(ValueError):
        module.header_coordinates('Center geodetic : 180.0, -89.0, 0.0 {W-lon(deg),Lat(deg),Alt(km)}')
