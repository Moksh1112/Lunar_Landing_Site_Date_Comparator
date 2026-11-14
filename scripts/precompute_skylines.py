"""Precompute skylines for every verified curated pole site into data_dir/cache (P3 S2.4).

Usage (backend packages on the path: PYTHONPATH="C:/azelux-pkgs;backend"):
    python scripts/precompute_skylines.py --data-dir C:/azelux-data [--h-obs 2.0]
"""
from __future__ import annotations

import sys
import time
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))
from azx_data import common_args, data_dir_from
from prepare_dems import pole_sites


def main() -> int:
    ap = common_args("Fill the skyline disk cache for all curated pole sites.")
    ap.add_argument("--h-obs", type=float, default=2.0, help="observer height in metres (default 2.0)")
    args = ap.parse_args()
    data_dir = data_dir_from(args)

    from app.terrain.real import RealTerrain

    terrain = RealTerrain(data_dir)
    print(f"DEMs available: {terrain.dems_loaded()}")
    for s in pole_sites():
        lat, lon = s["lat_deg"], s["lon_east_deg"]
        t0 = time.perf_counter()
        res = terrain.skyline(lat, lon, args.h_obs)
        dt = time.perf_counter() - t0
        cp = terrain._cache_path(lat, lon, args.h_obs)
        nd = float(np.load(cp)["nodata_fraction"]) if cp.exists() else float("nan")
        print(f"{s['site_id']:<16} mode={res.mode:<14} dem={res.dem_name} time={dt:.1f}s nodata={nd:.4f} "
              f"max_elev={float(np.max(res.elev_deg)):.3f}deg n={res.elev_deg.size} "
              f"finite={bool(np.all(np.isfinite(res.elev_deg)))} site_h={terrain.site_height(lat, lon):.1f}m")
    return 0


if __name__ == "__main__":
    sys.exit(main())
