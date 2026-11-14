"""Height sampling contract between the skyline algorithm and DEM sources (P3, S1).

The skyline code never touches rasters or projections directly: it asks a
HeightSampler for terrain heights at arrays of (lat, lon) points. Real DEMs
(raster.py, rasterio + pyproj) and synthetic test terrains both implement it.

Conventions
- lat_deg: planetocentric latitude in degrees; lon_east_deg: east longitude in degrees
  (any real value; implementations normalise as needed).
- heights_m: metres relative to the 1,737,400 m reference sphere (LOLA convention),
  returned as float64 with NaN where the source has no valid value.
- covers(): True where the point lies inside the source footprint (inside the raster
  extent / tile). A point that is covered but has NaN height is NODATA (counts against
  the 2 % rule); a point that is not covered is OUTSIDE (the ray has left this source;
  it is not nodata).
"""
from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass
from typing import Protocol

import numpy as np


class HeightSampler(Protocol):
    name: str  # DEM / source identifier recorded in meta.dem
    resolution_m: float  # nominal pixel size, used to pick ray step sizes

    def heights(self, lat_deg: np.ndarray, lon_east_deg: np.ndarray) -> np.ndarray:
        """Bilinear terrain height (m) per point; NaN for nodata or outside."""
        ...

    def covers(self, lat_deg: np.ndarray, lon_east_deg: np.ndarray) -> np.ndarray:
        """Boolean mask: point inside this source's footprint."""
        ...


@dataclass
class FunctionSampler:
    """Synthetic terrain from a function h(lat, lon) -> metres (tests, V3).

    footprint(lat, lon) -> bool mask; defaults to "covers everything".
    """

    func: Callable[[np.ndarray, np.ndarray], np.ndarray]
    name: str = "SYNTHETIC"
    resolution_m: float = 20.0
    footprint: Callable[[np.ndarray, np.ndarray], np.ndarray] | None = None

    def heights(self, lat_deg: np.ndarray, lon_east_deg: np.ndarray) -> np.ndarray:
        h = np.asarray(self.func(np.asarray(lat_deg, float), np.asarray(lon_east_deg, float)), dtype=float)
        return np.where(self.covers(lat_deg, lon_east_deg), h, np.nan)

    def covers(self, lat_deg: np.ndarray, lon_east_deg: np.ndarray) -> np.ndarray:
        lat = np.asarray(lat_deg, float)
        if self.footprint is None:
            return np.ones(lat.shape, dtype=bool)
        return np.asarray(self.footprint(lat, np.asarray(lon_east_deg, float)), dtype=bool)
