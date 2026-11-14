"""Download NASA PGDA LOLA south-pole DEMs and illumination maps (owner: P3).

Usage (absolute, non-OneDrive data folder):
    python scripts/download_dems.py --data-dir C:/azelux-data              # 80 m DEM, then 20 m DEM
    python scripts/download_dems.py --data-dir C:/azelux-data --skip-20m   # 80 m only (disk/time)
    python scripts/download_dems.py --data-dir C:/azelux-data --pgda69     # also V4 illumination maps
    python scripts/download_dems.py --dry-run --pgda69                     # check remote sizes only
    python scripts/download_dems.py --data-dir C:/azelux-data --inspect    # record raster metadata

Sources (confirmed 2026-11-14 by HTTP HEAD):
- PGDA product 90 "A New View of the Lunar South Pole from LOLA" (Barker et al. 2023,
  PSJ 4, 183, doi:10.3847/PSJ/acf3e1; data doi:10.60903/gsfcpgda-lola-spole).
  South polar stereographic, heights in metres, MOON_ME frame of DE421.
- PGDA product 69 "Lunar Polar Illumination" (Mazarico et al. 2011, Icarus 211, 1066,
  doi:10.1016/j.icarus.2010.10.030): average Sun / Earth visibility, 85-90 S, 60 m.
  Values are fractions of timesteps (int16 x 0.00004 per the PDS label; verify on --inspect).

--inspect needs rasterio (backend environment); it records CRS WKT, transform, size,
dtype, nodata and scale/offset for each raster into data/MANIFEST.json.
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from azx_data import common_args, data_dir_from, fetch_and_record, update_manifest

P90 = "https://pgda.gsfc.nasa.gov/data/LOLA_20mpp"
P69 = "https://pgda.gsfc.nasa.gov/data/MoonIllumination"
P90_SOURCE = "NASA GSFC PGDA product 90 (LOLA south pole DEM)"
P90_CITE = "Barker et al. 2023, PSJ 4, 183, doi:10.3847/PSJ/acf3e1"
P69_SOURCE = "NASA GSFC PGDA product 69 (Lunar Polar Illumination)"
P69_CITE = "Mazarico et al. 2011, Icarus 211, 1066, doi:10.1016/j.icarus.2010.10.030"

DEM_80M = {"rel_path": "dem/LDEM_80S_80MPP_ADJ.TIF", "url": f"{P90}/LDEM_80S_80MPP_ADJ.TIF", "bytes": 189158392,
           "role": "far-field DEM source (80 m; resampled to 160 m by prepare_dems.py)"}
DEM_20M = {"rel_path": "dem/LDEM_80S_20MPP_ADJ.TIF", "url": f"{P90}/LDEM_80S_20MPP_ADJ.TIF", "bytes": 2696082051,
           "role": "near-field DEM source (20 m; cropped to tiles by prepare_dems.py)"}
ILLUM = [
    {"rel_path": "illumination/AVGVISIB_85S_060M_201608.TIF", "url": f"{P69}/AVGVISIB_85S_060M_201608.TIF",
     "bytes": 33994464, "role": "V4 reference: average Sun visibility 85-90 S, 60 m"},
    {"rel_path": "illumination/AVGVISIB_85S_060M_201608_EARTH.TIF",
     "url": f"{P69}/AVGVISIB_85S_060M_201608_EARTH.TIF", "bytes": 24862958,
     "role": "V4 reference: average Earth visibility 85-90 S, 60 m"},
]


def inspect(data_dir: Path) -> bool:
    try:
        import rasterio  # type: ignore[import-not-found]
    except ImportError:
        print("--inspect needs rasterio: run with the backend environment (uv run --project backend ...)")
        return False
    import json

    manifest = json.loads((data_dir / "MANIFEST.json").read_text(encoding="utf-8"))
    for rel, entry in manifest.get("files", {}).items():
        if entry.get("category") not in ("dem", "illumination") or entry.get("status") != "complete":
            continue
        with rasterio.open(data_dir / rel) as ds:
            entry["raster"] = {
                "crs_wkt": ds.crs.to_wkt() if ds.crs else None,
                "transform": list(ds.transform)[:6],
                "width": ds.width, "height": ds.height, "count": ds.count,
                "dtype": ds.dtypes[0], "nodata": ds.nodata,
                "scales": list(ds.scales), "offsets": list(ds.offsets),
                "units": list(ds.units) if ds.units else None,
                "bounds": list(ds.bounds),
            }
        update_manifest(data_dir, rel, entry)
        print(f"- {rel}: {entry['raster']['width']}x{entry['raster']['height']} {entry['raster']['dtype']}, "
              f"nodata={entry['raster']['nodata']}")
    return True


def main() -> int:
    parser = common_args(__doc__.splitlines()[0])
    parser.add_argument("--skip-20m", action="store_true", help="skip the 2.7 GB 20 m DEM")
    parser.add_argument("--pgda69", action="store_true", help="also fetch the PGDA 69 visibility maps (V4)")
    parser.add_argument("--inspect", action="store_true", help="record raster metadata (needs rasterio)")
    args = parser.parse_args()
    data_dir = data_dir_from(args)
    print(f"Data directory: {data_dir}")
    if args.inspect:
        return 0 if inspect(data_dir) else 1
    items = [{**DEM_80M, "category": "dem", "source": P90_SOURCE, "citation": P90_CITE}]
    if args.pgda69:  # small files first so the 2.7 GB DEM never blocks them
        items += [{**m, "category": "illumination", "source": P69_SOURCE, "citation": P69_CITE} for m in ILLUM]
    if not args.skip_20m:
        items.append({**DEM_20M, "category": "dem", "source": P90_SOURCE, "citation": P90_CITE})
    ok = True
    for item in items:
        ok &= fetch_and_record(data_dir, item, args.dry_run)
    print("ALL DEM/MAP FILES OK" if ok else "SOME FILES FAILED")
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
