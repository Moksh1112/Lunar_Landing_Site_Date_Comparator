"""NASA PGDA product 69 average Sun / Earth visibility maps (P3, S3.2; V4 support).

Source: Mazarico et al. 2011, Icarus 211, 1066 (LOLA-derived, PGDA product 69),
files ``AVGVISIB_85S_060M_201608.TIF`` (Sun) and ``..._EARTH.TIF`` (Earth).

Semantics: each pixel is the fraction of hourly timesteps over 18.6 years in which any
part of the Sun (Earth) disc is visible, so values read slightly higher than a
centre-of-disc rule. The raster is a 5058 x 5058 px (60 m) SQUARE: it covers all of
85-90 deg S plus the square's corners/edges, which reach ~84.8 deg S (e.g. IM-2 is inside,
close to the edge, where values may be biased by terrain beyond the map).

Scaling: the GeoTIFFs are int16 with a built-in scale of 4e-5 (DN 25000 = 1.0), nodata
-32768. ``RasterSampler`` applies scale/offset exactly once in ``_decode``; this module
reuses it and never rescales. Values are therefore fractions in 0..1.
"""
from __future__ import annotations

import math
from pathlib import Path
from typing import Any, Self

import numpy as np

from .raster import RasterSampler

SUN_FILE = "AVGVISIB_85S_060M_201608.TIF"
EARTH_FILE = "AVGVISIB_85S_060M_201608_EARTH.TIF"
CITATION = (
    "Mazarico, E., Neumann, G.A., Smith, D.E., Zuber, M.T., Torrence, M.H. (2011), "
    "Illumination conditions of the lunar polar regions using LOLA topography, "
    "Icarus 211, 1066-1081; NASA PGDA product 69 (Moon Illumination), "
    "https://pgda.gsfc.nasa.gov/products/69"
)


class _Map(RasterSampler):
    """One visibility raster: nearest (default) or bilinear fractions plus 3x3 range."""

    def __init__(self, path: Path) -> None:
        super().__init__(path, preload=False)
        self._frac = self._decode(self._ds.read(1), np.float32)  # fractions, NaN = nodata

    def nearest_index(self, lat: float, lon: float) -> tuple[int, int] | None:
        row, col = self._rowcol(lat, lon)
        r, c = float(row), float(col)
        if not (math.isfinite(r) and math.isfinite(c)):
            return None
        ri, ci = round(r), round(c)
        if 0 <= ri < self.height and 0 <= ci < self.width:
            return int(ri), int(ci)
        return None

    def sample(self, lat: float, lon: float, bilinear: bool) -> dict[str, Any]:
        idx = self.nearest_index(lat, lon)
        nan = float("nan")
        if idx is None:
            return {"value": nan, "min": nan, "max": nan, "row": None, "col": None}
        r, c = idx
        block = self._frac[max(r - 1, 0) : r + 2, max(c - 1, 0) : c + 2]
        if np.isnan(block).all():
            lo = hi = nan
        else:
            lo, hi = float(np.nanmin(block)), float(np.nanmax(block))
        val = float(self.heights(lat, lon)) if bilinear else float(self._frac[r, c])
        return {"value": val, "min": lo, "max": hi, "row": r, "col": c}

    def pixel_centre_xy(self, r: int, c: int) -> tuple[float, float]:
        t = self.transform
        return t.c + (c + 0.5) * t.a, t.f + (r + 0.5) * t.e


class VisibilityMaps:
    """Sun and Earth average-visibility maps (fractions 0..1)."""

    def __init__(self, data_dir: Path | str, bilinear: bool = False) -> None:
        d = Path(data_dir)
        if (d / "illumination").is_dir():
            d = d / "illumination"
        self.sun_path = d / SUN_FILE
        self.earth_path = d / EARTH_FILE
        self.bilinear = bilinear
        self.sun = _Map(self.sun_path)
        self.earth = _Map(self.earth_path)

    def close(self) -> None:
        self.sun.close()
        self.earth.close()

    def __enter__(self) -> Self:
        return self

    def __exit__(self, *exc: object) -> None:
        self.close()

    def covers(self, lat: float, lon: float) -> bool:
        return self.sun.nearest_index(lat, lon) is not None

    def fractions(self, lat: float, lon: float) -> dict[str, Any]:
        """Sun/Earth visibility fractions at a point (NaN when not covered or nodata).

        Keys: sun, earth (fractions), sun_range / earth_range ((min, max) over the 3x3
        neighbourhood of the nearest pixel), row, col (nearest pixel in the Sun map).
        """
        s = self.sun.sample(lat, lon, self.bilinear)
        e = self.earth.sample(lat, lon, self.bilinear)
        return {
            "sun": s["value"],
            "earth": e["value"],
            "sun_range": (s["min"], s["max"]),
            "earth_range": (e["min"], e["max"]),
            "row": s["row"],
            "col": s["col"],
        }

    def max_fraction(self, which: str = "sun") -> tuple[float, int, int]:
        """Global maximum fraction and its (row, col)."""
        a = (self.sun if which == "sun" else self.earth)._frac
        i = int(np.nanargmax(a))
        r, c = divmod(i, a.shape[1])
        return float(a[r, c]), r, c

    def find_candidates(
        self,
        n: int = 5,
        center: tuple[float, float] = (-89.9, 129.0),
        radius_km: float = 20.0,
        min_sep_km: float = 2.0,
        max_range: float = 0.08,
    ) -> list[dict[str, Any]]:
        """Highest Sun-visibility pixels near ``center`` (default: Shackleton area).

        Selected from the PGDA 69 map itself (greedy, ``min_sep_km`` apart, 3x3 Sun range
        <= ``max_range`` so the value is well defined, finite Earth value). These are
        candidate comparison coordinates, NOT official sites.
        """
        sm = self.sun
        cx, cy = (float(v) for v in sm.xy(*center))
        r0f, c0f = sm.pixel(cx, cy)
        rad = int(radius_km * 1000 / sm.resolution_m)
        r0, c0 = round(float(r0f)), round(float(c0f))
        ra, rb = max(r0 - rad, 1), min(r0 + rad + 1, sm.height - 1)
        ca, cb = max(c0 - rad, 1), min(c0 + rad + 1, sm.width - 1)
        rr, cc = np.mgrid[ra:rb, ca:cb]
        inside = (rr - r0) ** 2 + (cc - c0) ** 2 <= rad**2
        f = sm._frac
        lo = np.full(rr.shape, np.inf, dtype=np.float32)
        hi = np.full(rr.shape, -np.inf, dtype=np.float32)
        for dr in (-1, 0, 1):
            for dc in (-1, 0, 1):
                v = f[ra + dr : rb + dr, ca + dc : cb + dc]
                lo = np.fmin(lo, v)
                hi = np.fmax(hi, v)
        centre = f[ra:rb, ca:cb]
        earth = self.earth._frac[ra:rb, ca:cb]
        ok = inside & np.isfinite(centre) & np.isfinite(earth) & ((hi - lo) <= max_range)
        order = np.argsort(np.where(ok, centre, -np.inf), axis=None)[::-1]
        sep_px = min_sep_km * 1000 / sm.resolution_m
        chosen: list[tuple[int, int]] = []
        for k in order:
            r, c = divmod(int(k), rr.shape[1])
            if not ok[r, c]:
                break
            pr, pc = int(rr[r, c]), int(cc[r, c])
            if all((pr - a) ** 2 + (pc - b) ** 2 >= sep_px**2 for a, b in chosen):
                chosen.append((pr, pc))
                if len(chosen) == n:
                    break
        out = []
        for pr, pc in chosen:
            x, y = sm.pixel_centre_xy(pr, pc)
            lat, lon = (float(v) for v in sm.latlon(x, y))
            out.append({"lat": lat, "lon_east": lon % 360.0, **self.fractions(lat, lon)})
        return out
