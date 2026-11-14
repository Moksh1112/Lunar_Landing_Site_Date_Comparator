"""Terrain performance check (P3 S4.1): coverage, uncached/cached skyline and terrain_tile timings.

Run from backend/:  python tools/terrain_perf.py [data_dir]
Uses the real far DEM; skylines are computed into a throw-away cache dir (the real cache is
never touched). TRD budgets: skyline < 2 s, custom-site compare < 5 s.
"""
from __future__ import annotations

import os
import sys
import tempfile
import time
from collections.abc import Callable
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.terrain.real import RealTerrain

SITES = {"IM-2 Athena": (-84.7906, 29.1957), "custom (-86.5, 210.0)": (-86.5, 210.0)}
SKYLINE_BUDGET_S = 2.0
H_OBS = 2.0


def _time(fn: Callable[[], object], repeat: int = 1) -> float:
    best = float("inf")
    for _ in range(repeat):
        t0 = time.perf_counter()
        fn()
        best = min(best, time.perf_counter() - t0)
    return best


def main() -> int:
    data_dir = Path(sys.argv[1] if len(sys.argv) > 1 else os.environ.get("AZX_DATA_DIR", "C:/azelux-data"))
    prov = RealTerrain(data_dir)
    if not prov.dems_loaded():
        print(f"no DEMs in {data_dir}/dem - nothing to time")
        return 1
    with tempfile.TemporaryDirectory(prefix="azx_perf_") as tmp:
        prov.cache_dir = Path(tmp)
        t_load = _time(lambda: prov.coverage(-85.0, 0.0))  # first call opens + preloads the far DEM
        rows: list[tuple[str, str, float, str]] = [("(all)", "DEM open + first coverage", t_load, "")]
        worst = 0.0
        for name, (lat, lon) in SITES.items():
            cov = prov.coverage(lat, lon)
            rows.append((name, f"coverage [{cov}]", _time(lambda la=lat, lo=lon: prov.coverage(la, lo), 5), ""))
            unc = _time(lambda la=lat, lo=lon: prov.skyline(la, lo, H_OBS))  # empty cache -> full compute
            worst = max(worst, unc)
            rows.append((name, "skyline uncached", unc, "OK" if unc < SKYLINE_BUDGET_S else "OVER 2 s"))
            rows.append((name, "skyline cached", _time(lambda la=lat, lo=lon: prov.skyline(la, lo, H_OBS), 5), ""))
            if cov != "geometric":
                rows.append((name, "terrain_tile 20 km", _time(lambda la=lat, lo=lon: prov.terrain_tile(la, lo, 20.0), 3), ""))
        print(f"data_dir={data_dir}  dems={prov.dems_loaded()}  h_obs={H_OBS} m")
        print(f"{'site':<24}{'operation':<28}{'seconds':>9}  note")
        for site, op, sec, note in rows:
            print(f"{site:<24}{op:<28}{sec:>9.3f}  {note}")
        print(f"worst uncached skyline: {worst:.3f} s (budget {SKYLINE_BUDGET_S} s)")
    return 0 if worst < SKYLINE_BUDGET_S else 2


if __name__ == "__main__":
    raise SystemExit(main())
