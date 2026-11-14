"""P3 S1.4: real skyline at one verified pole site + one lunar day of SPICE Sun/Earth paths.

Usage (repo root; AZX_DATA_DIR holds kernels/ and dem/):
    python backend/tools/skyline_demo.py [--site im2-athena] [--start 2027-03-01T00:00:00Z] [--svg out.svg]

Uses the 80 m DEM for both near and far field until the 20 m tiles exist, so the
result corresponds to horizon mode "terrain_coarse". Visibility = body centre above
the skyline at its azimuth (linear interpolation between 0.5 deg bins, TRD 4.5).
This is an S1 sanity tool, not the compare endpoint.
"""
from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path

import numpy as np

BACKEND = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND))

from app.ephemeris import load_kernels, sun_earth_series
from app.settings import Settings
from app.sites.loader import get_site
from app.terrain.raster import RasterSampler
from app.terrain.skyline import compute_skyline


def skyline_at(elev_deg: np.ndarray, az_deg: np.ndarray) -> np.ndarray:
    x = (np.asarray(az_deg) % 360.0) / 0.5
    i0 = np.floor(x).astype(int) % 720
    f = x - np.floor(x)
    return elev_deg[i0] * (1 - f) + elev_deg[(i0 + 1) % 720] * f


def svg_panorama(sky: np.ndarray, series: dict, vis: dict, title: str) -> str:
    w, h, top, bottom = 1440, 360, -2.0, 10.0
    lo = min(top, float(np.nanmin(sky)) - 0.5, float(min(series["sun_el"].min(), series["earth_el"].min())) - 0.5)
    hi = max(bottom, float(np.nanmax(sky)) + 0.5)

    def X(a):
        return np.asarray(a) / 360.0 * w

    def Y(e):
        return h - (np.asarray(e) - lo) / (hi - lo) * h

    az = np.arange(720) * 0.5
    sky_pts = " ".join(f"{x:.1f},{y:.1f}" for x, y in zip(X(az), Y(sky), strict=True))
    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h + 40}" font-family="sans-serif" font-size="12">',
        f'<rect width="{w}" height="{h + 40}" fill="#0b1020"/>',
        f'<text x="8" y="{h + 28}" fill="#cbd5e1">{title}</text>',
        f'<polygon points="0,{h} {sky_pts} {w},{h}" fill="#475569" stroke="#94a3b8" stroke-width="1"/>',
        f'<line x1="0" x2="{w}" y1="{Y(0):.1f}" y2="{Y(0):.1f}" stroke="#334155" stroke-dasharray="4 4"/>',
    ]
    for body, colour in (("sun", "#f59e0b"), ("earth", "#3b82f6")):
        xs, ys, v = X(series[f"{body}_az"]), Y(series[f"{body}_el"]), vis[body]
        for k in range(0, len(xs), 3):
            parts.append(f'<circle cx="{xs[k]:.1f}" cy="{ys[k]:.1f}" r="{1.6 if v[k] else 0.7}" '
                         f'fill="{colour}" opacity="{1.0 if v[k] else 0.45}"/>')
    for az_lbl, name in ((0, "N"), (90, "E"), (180, "S"), (270, "W")):
        parts.append(f'<text x="{X(az_lbl) + 3:.1f}" y="14" fill="#e2e8f0">{name}</text>')
    parts.append("</svg>")
    return "\n".join(parts)


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--site", default="im2-athena")
    ap.add_argument("--start", default="2027-03-01T00:00:00Z")
    ap.add_argument("--hours", type=float, default=708.0)
    ap.add_argument("--h-obs", type=float, default=2.0)
    ap.add_argument("--svg", type=Path)
    ap.add_argument("--json", type=Path)
    args = ap.parse_args()

    settings = Settings()
    site = get_site(args.site)
    dem = settings.data_dir / "dem" / "LDEM_80S_80MPP_ADJ.TIF"
    load_kernels(settings.data_dir / "kernels", settings.kernel_list)

    t0 = time.perf_counter()
    with RasterSampler(dem) as sampler:
        sky = compute_skyline(site["lat_deg"], site["lon_east_deg"], args.h_obs, near=sampler, far=sampler)
    t_sky = time.perf_counter() - t0

    t1 = time.perf_counter()
    series = sun_earth_series(site["lat_deg"], site["lon_east_deg"], sky.h_site_m + args.h_obs,
                              args.start, args.hours, 10)
    t_eph = time.perf_counter() - t1
    vis = {b: series[f"{b}_el"] > skyline_at(sky.elev_deg, series[f"{b}_az"]) for b in ("sun", "earth")}
    both = vis["sun"] & vis["earth"]
    imax = int(np.nanargmax(sky.elev_deg))
    summary = {
        "site": site["site_id"], "lat_deg": site["lat_deg"], "lon_east_deg": site["lon_east_deg"],
        "dem": dem.name, "mode_equivalent": "terrain_coarse (80 m near+far, 20 m pending)",
        "h_site_m": round(sky.h_site_m, 1), "h_obs_m": args.h_obs, "dip_deg": round(sky.dip_deg, 4),
        "skyline_max_deg": round(float(sky.elev_deg[imax]), 3), "skyline_max_az_deg": imax * 0.5,
        "skyline_max_block_km": round(float(sky.block_dist_km[imax]), 2),
        "skyline_min_deg": round(float(np.nanmin(sky.elev_deg)), 3),
        "nodata_fraction": round(sky.nodata_fraction, 5), "n_samples": sky.n_samples,
        "skyline_seconds": round(t_sky, 2), "ephemeris_seconds": round(t_eph, 2),
        "start_utc": args.start, "mission_hours": args.hours, "step_minutes": 10, "samples": len(both),
        "sun_visible_pct_samples": round(100 * float(vis["sun"].mean()), 1),
        "earth_visible_pct_samples": round(100 * float(vis["earth"].mean()), 1),
        "both_visible_pct_samples": round(100 * float(both.mean()), 1),
        "sun_el_range_deg": [round(float(series["sun_el"].min()), 2), round(float(series["sun_el"].max()), 2)],
        "earth_el_range_deg": [round(float(series["earth_el"].min()), 2),
                               round(float(series["earth_el"].max()), 2)],
        "note": "Sample-count percentages (S1 sanity); the API will use interpolated window edges (TRD 5).",
    }
    print(json.dumps(summary, indent=2))
    if args.json:
        args.json.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    if args.svg:
        title = (f"{site['name']} | skyline from {dem.name} (coarse) | Sun (amber) and Earth (blue), "
                 f"{args.hours:.0f} h from {args.start}; bright = visible | REAL data, S1 sanity check")
        args.svg.write_text(svg_panorama(sky.elev_deg, series, vis, title), encoding="utf-8")
        print("wrote", args.svg)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
