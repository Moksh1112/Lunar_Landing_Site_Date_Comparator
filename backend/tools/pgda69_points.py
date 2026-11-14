"""Report PGDA product 69 average Sun/Earth visibility at south-pole points (V4 support).

Usage (from repo root, PYTHONPATH including C:/azelux-pkgs and backend):
  python backend/tools/pgda69_points.py [--data-dir C:/azelux-data] [--point lat,lon ...]
         [--candidates 5] [--json out.json]

Default points: verified sites in app/sites/sites.json; those outside 85-90 S are reported
as not covered. PGDA counts ANY part of the disc as visible, so values read slightly
higher than Azelux's centre-of-disc rule.
"""
from __future__ import annotations

import argparse
import json
import math
import os
from pathlib import Path

from app.terrain.illumination import CITATION, EARTH_FILE, SUN_FILE, VisibilityMaps

SITES = Path(__file__).resolve().parents[1] / "app" / "sites" / "sites.json"
NOTE = (
    "Maps are a square covering 85-90 S plus corners reaching ~84.8 S: IM-2 (~84.79 S) lies "
    "inside but at the very edge (unreliable: terrain beyond the map is not modelled); IM-1 "
    "(80.13 S) is outside and reported as not covered. The 75S 120 m maps (AVGVISIB_75S_120M_201608*.TIF, ~83 MB + "
    "43 MB at https://pgda.gsfc.nasa.gov/data/MoonIllumination/) would cover both reliably "
    "(not downloaded). Candidates are selected from the PGDA 69 map itself, not official sites."
)


def _pct(v: float) -> float | None:
    return None if math.isnan(v) else round(100.0 * v, 3)


def _row(name: str, lat: float, lon: float, m: VisibilityMaps) -> dict:
    if not m.covers(lat, lon):
        return {"name": name, "lat": lat, "lon_east": lon, "covered": False}
    f = m.fractions(lat, lon)
    return {
        "name": name, "lat": round(lat, 5), "lon_east": round(lon, 5), "covered": True,
        "sun_pct": _pct(f["sun"]), "earth_pct": _pct(f["earth"]),
        "sun_range_pct": [_pct(v) for v in f["sun_range"]],
        "earth_range_pct": [_pct(v) for v in f["earth_range"]],
        "row": f["row"], "col": f["col"],
    }


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--data-dir", default=os.environ.get("AZX_DATA_DIR", "C:/azelux-data"))
    ap.add_argument("--point", action="append", default=[], help="lat,lon (east) in degrees")
    ap.add_argument("--candidates", type=int, default=0, help="add N map-selected candidates")
    ap.add_argument("--json", dest="json_out")
    a = ap.parse_args()
    out: dict = {"citation": CITATION, "files": [SUN_FILE, EARTH_FILE], "note": NOTE,
                 "points": [], "candidates": []}
    with VisibilityMaps(a.data_dir) as m:
        for s in json.loads(SITES.read_text(encoding="utf-8"))["sites"]:
            if s.get("verified"):
                out["points"].append(_row(s["site_id"], s["lat_deg"], s["lon_east_deg"], m))
        for i, p in enumerate(a.point):
            lat, lon = (float(x) for x in p.split(","))
            out["points"].append(_row(f"point{i + 1}", lat, lon, m))
        if a.candidates:
            for i, c in enumerate(m.find_candidates(a.candidates)):
                out["candidates"].append(_row(f"cand{i + 1}", c["lat"], c["lon_east"], m))
        mx, r, c = m.max_fraction("sun")
        out["max_sun_fraction"] = {"value": mx, "row": r, "col": c}
    text = json.dumps(out, indent=2)
    print(text)
    if a.json_out:
        Path(a.json_out).write_text(text, encoding="utf-8")


if __name__ == "__main__":
    main()
