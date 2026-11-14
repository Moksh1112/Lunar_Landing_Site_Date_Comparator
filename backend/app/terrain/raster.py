"""Real DEM height sampler (rasterio + pyproj) for PGDA LOLA south-polar GeoTIFFs (P3, S1.1).

Implements the HeightSampler protocol from sampling.py.

Conventions
- Input points are planetocentric latitude / east longitude in degrees. They are
  projected into the raster's own CRS with a pyproj Transformer built from the
  raster CRS's geodetic CRS, so the lunar sphere and datum match the file exactly.
- rasterio's affine transform maps pixel *corners*; pixel (i, j) has its sample at its
  centre. Fractional index (centre convention) is therefore
  ``col = (x - c) / a - 0.5``, ``row = (y - f) / e - 0.5`` (general affine inverse).
- Heights are bilinear (scipy map_coordinates order=1, prefilter=False). Nodata, and any
  bilinear neighbourhood touching nodata, gives NaN. Points outside the raster extent
  give NaN and ``covers()`` is False for them.
- Only the window needed by a request (+1 px margin) is read, unless ``preload`` caches
  the whole band (small rasters such as the 80 m file).
"""
from __future__ import annotations

import math
from pathlib import Path
from typing import Any, Self

import numpy as np
import rasterio
from pyproj import CRS, Transformer
from rasterio.windows import Window
from scipy.ndimage import map_coordinates

PRELOAD_MAX_BYTES = 300 * 1024 * 1024


class RasterSampler:
    """HeightSampler backed by a single-band GeoTIFF DEM."""

    def __init__(self, path: Path, name: str | None = None, preload: bool = False) -> None:
        self.path = Path(path)
        self.name = name if name is not None else self.path.stem
        self._ds = rasterio.open(self.path)
        ds = self._ds
        if ds.crs is None:
            raise ValueError(f"{self.path} has no CRS")
        self.width = int(ds.width)
        self.height = int(ds.height)
        self.transform = ds.transform
        self._inv = ~ds.transform
        self.resolution_m = float(abs(ds.transform.a))
        self.nodata = ds.nodata
        self.scale = float(ds.scales[0]) if ds.scales else 1.0
        self.offset = float(ds.offsets[0]) if ds.offsets else 0.0
        self.raster_crs_wkt = ds.crs.to_wkt()
        raster_crs = CRS.from_wkt(self.raster_crs_wkt)
        geo_crs = raster_crs.geodetic_crs
        self.geodetic_crs_wkt = geo_crs.to_wkt()
        self._fwd = Transformer.from_crs(geo_crs, raster_crs, always_xy=True)
        self._back = Transformer.from_crs(raster_crs, geo_crs, always_xy=True)
        self._cache: np.ndarray | None = None
        if preload:
            nbytes = self.width * self.height * np.dtype(ds.dtypes[0]).itemsize
            if nbytes > PRELOAD_MAX_BYTES:
                raise ValueError(f"raster too large to preload ({nbytes} bytes)")
            self._cache = self._decode(ds.read(1), np.float32)  # float32: half the RAM of float64

    # -- lifecycle ---------------------------------------------------------------
    def close(self) -> None:
        self._ds.close()

    def __enter__(self) -> Self:
        return self

    def __exit__(self, *exc: object) -> None:
        self.close()

    # -- metadata ----------------------------------------------------------------
    def metadata(self) -> dict[str, Any]:
        t = self.transform
        return {
            "name": self.name,
            "width": self.width,
            "height": self.height,
            "dtype": self._ds.dtypes[0],
            "nodata": self.nodata,
            "scale": self.scale,
            "offset": self.offset,
            "transform": [t.a, t.b, t.c, t.d, t.e, t.f],
            "resolution_m": self.resolution_m,
            "raster_crs_wkt": self.raster_crs_wkt,
            "geodetic_crs_wkt": self.geodetic_crs_wkt,
        }

    # -- projection --------------------------------------------------------------
    def xy(self, lat_deg: Any, lon_east_deg: Any) -> tuple[np.ndarray, np.ndarray]:
        """Project (lat, lon) in degrees to raster-CRS metres (x, y)."""
        lat = np.asarray(lat_deg, dtype=float)
        lon = np.asarray(lon_east_deg, dtype=float)
        lat, lon = np.broadcast_arrays(lat, lon)
        x, y = self._fwd.transform(lon, lat)
        return np.asarray(x, dtype=float), np.asarray(y, dtype=float)

    def latlon(self, x: Any, y: Any) -> tuple[np.ndarray, np.ndarray]:
        """Inverse projection: raster-CRS metres to (lat, lon_east) in degrees."""
        lon, lat = self._back.transform(np.asarray(x, dtype=float), np.asarray(y, dtype=float))
        return np.asarray(lat, dtype=float), np.asarray(lon, dtype=float)

    def pixel(self, x: Any, y: Any) -> tuple[np.ndarray, np.ndarray]:
        """Raster-CRS metres to fractional (row, col), pixel-CENTRE convention."""
        xa = np.asarray(x, dtype=float)
        ya = np.asarray(y, dtype=float)
        inv = self._inv
        col = inv.a * xa + inv.b * ya + inv.c - 0.5
        row = inv.d * xa + inv.e * ya + inv.f - 0.5
        return row, col

    def _rowcol(self, lat_deg: Any, lon_east_deg: Any) -> tuple[np.ndarray, np.ndarray]:
        x, y = self.xy(lat_deg, lon_east_deg)
        with np.errstate(invalid="ignore"):
            row, col = self.pixel(x, y)
        bad = ~(np.isfinite(row) & np.isfinite(col))
        if bad.any():
            row = np.where(bad, np.nan, row)
            col = np.where(bad, np.nan, col)
        return row, col

    # -- HeightSampler protocol --------------------------------------------------
    def covers(self, lat_deg: np.ndarray, lon_east_deg: np.ndarray) -> np.ndarray:
        row, col = self._rowcol(lat_deg, lon_east_deg)
        with np.errstate(invalid="ignore"):
            return (col >= 0) & (col <= self.width - 1) & (row >= 0) & (row <= self.height - 1)

    def heights(self, lat_deg: np.ndarray, lon_east_deg: np.ndarray) -> np.ndarray:
        row, col = self._rowcol(lat_deg, lon_east_deg)
        shape = row.shape
        row = row.ravel()
        col = col.ravel()
        out = np.full(row.shape, np.nan, dtype=float)
        with np.errstate(invalid="ignore"):
            inside = (col >= 0) & (col <= self.width - 1) & (row >= 0) & (row <= self.height - 1)
        if not inside.any():
            return out.reshape(shape)
        r, c = row[inside], col[inside]
        r0 = max(math.floor(r.min()) - 1, 0)
        r1 = min(math.ceil(r.max()) + 2, self.height)  # exclusive
        c0 = max(math.floor(c.min()) - 1, 0)
        c1 = min(math.ceil(c.max()) + 2, self.width)
        if self._cache is not None:
            block = self._cache[r0:r1, c0:c1]
        else:
            win = Window(c0, r0, c1 - c0, r1 - r0)
            block = self._decode(self._ds.read(1, window=win))
        vals = map_coordinates(
            block, [r - r0, c - c0], order=1, mode="constant", cval=np.nan, prefilter=False
        )
        out[inside] = vals
        return out.reshape(shape)

    # -- internals ---------------------------------------------------------------
    def _decode(self, raw: np.ndarray, dtype: type = np.float64) -> np.ndarray:
        a = raw.astype(dtype)
        if self.nodata is not None:
            if isinstance(self.nodata, float) and math.isnan(self.nodata):
                pass  # already NaN
            else:
                a[raw == self.nodata] = np.nan
        a[~np.isfinite(a)] = np.nan
        if self.scale != 1.0 or self.offset != 0.0:
            a = a * self.scale + self.offset
        return a
