"""Write a small, reviewable data-provenance record (no binaries) from AZX_DATA_DIR/MANIFEST.json.

Usage (repo root):  python backend/tools/data_evidence.py --out backend/docs/DATA_EVIDENCE.md

For every file: path, role, source URL (or derivation), exact byte size, full SHA-256 (and MD5 where
recorded), and for rasters the CRS, transform, size, dtype, nodata, scale/offset and units read
directly from the file with rasterio. Units: PGDA product 90 heights are metres (product page);
PGDA product 69 visibility values are fractions after scale 4e-5 (PDS label) - GeoTIFF unit tags
are empty, so these are stated from the source documentation.
"""
from __future__ import annotations

import argparse
import json
import os
from datetime import UTC, datetime
from pathlib import Path

UNITS = {
    "dem": "metres relative to the 1,737.4 km sphere (PGDA 90)",
    "dem-derived": "metres relative to the 1,737.4 km sphere (derived from PGDA 90)",
    "tile": "metres relative to the 1,737.4 km sphere (cropped from PGDA 90, 20 m)",
    "illumination": "fraction of timesteps 0..1 after scale 4e-5 (PGDA 69 PDS label)",
}
COMMANDS = [
    "python scripts/download_kernels.py --data-dir <AZX_DATA_DIR>",
    "python scripts/download_dems.py --data-dir <AZX_DATA_DIR> --pgda69",
    "python scripts/download_dems.py --data-dir <AZX_DATA_DIR> --inspect",
    "python scripts/prepare_dems.py --data-dir <AZX_DATA_DIR> --far --hillshade",
    "python scripts/prepare_dems.py --data-dir <AZX_DATA_DIR> --tiles",
    "python scripts/precompute_skylines.py --data-dir <AZX_DATA_DIR>",
    "python backend/tools/data_evidence.py --out backend/docs/DATA_EVIDENCE.md",
]


def raster_info(path: Path) -> dict | None:
    try:
        import rasterio
    except ImportError:
        return None
    with rasterio.open(path) as ds:
        crs = ds.crs
        params = {}
        if crs is not None:
            d = crs.to_dict()
            params = {k: d[k] for k in ("proj", "lat_0", "lon_0", "R", "a", "b", "x_0", "y_0", "units") if k in d}
        return {
            "crs_name": crs.to_wkt().split('"')[1] if crs else None,
            "crs_params": params,
            "transform": [round(v, 6) for v in list(ds.transform)[:6]],
            "size": [ds.width, ds.height],
            "dtype": ds.dtypes[0],
            "nodata": ds.nodata,
            "scale_offset": [ds.scales[0], ds.offsets[0]],
            "bounds": [round(v, 3) for v in ds.bounds],
        }


def category(rel: str, entry: dict) -> str:
    if rel.startswith("tiles/"):
        return "tile"
    return entry.get("category", "")


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--data-dir", default=os.environ.get("AZX_DATA_DIR", ""))
    ap.add_argument("--out", type=Path, required=True)
    args = ap.parse_args()
    data = Path(args.data_dir)
    manifest = json.loads((data / "MANIFEST.json").read_text(encoding="utf-8"))
    lines = [
        "# Azelux data evidence (kernels, DEMs, illumination maps, derived products)",
        "",
        (f"Generated {datetime.now(UTC):%Y-%m-%d %H:%M} UTC from `MANIFEST.json` by "
         "`backend/tools/data_evidence.py`. Binaries, caches and keys are NOT in git; this file is the record."),
        ("Sizes are exact bytes on disk; SHA-256 computed after download/creation. Raster fields are read "
         "from the files themselves."),
        "",
        "## Files",
        "",
        "| File | Role | Bytes | SHA-256 | Source / derivation |",
        "| --- | --- | ---: | --- | --- |",
    ]
    rasters = []
    for rel, e in sorted(manifest["files"].items()):
        source = e.get("url") or f"derived from `{e.get('derived_from', '?')}`: {e.get('method', '')}"
        extra = ""
        if e.get("md5"):
            extra = f"<br>md5 `{e['md5']}`" + (" (matches NAIF published)" if e.get("md5_matches_published") else "")
        lines.append(f"| `{rel}` | {e.get('role', category(rel, e))} | {e['bytes']:,} | `{e['sha256']}`{extra} | {source} |")
        path = data / rel
        if path.suffix.lower() in (".tif", ".tiff") and path.is_file():
            rasters.append((rel, category(rel, e), raster_info(path)))
    lines += ["", "## Raster metadata (read from each file)", ""]
    for rel, cat, info in rasters:
        lines.append(f"### `{rel}`")
        if info is None:
            lines += ["rasterio not available on this host; metadata not read.", ""]
            continue
        lines += [
            f"- CRS: {info['crs_name']}; parameters {info['crs_params']}",
            f"- Transform (a, b, c, d, e, f): {info['transform']}; size {info['size'][0]} x {info['size'][1]} px",
            f"- Bounds (m): {info['bounds']}",
            f"- dtype {info['dtype']}; nodata {info['nodata']}; scale/offset {info['scale_offset']}",
            f"- Units: {UNITS.get(cat, 'see source documentation')}",
            "",
        ]
    citations = sorted({e["citation"] for e in manifest["files"].values() if e.get("citation")})
    lines += ["## Citations", ""] + [f"- {c}" for c in citations]
    lines += ["", "## Commands (reproduce from an empty AZX_DATA_DIR outside any cloud-synced folder)", ""]
    lines += ["```"] + COMMANDS + ["```", ""]
    args.out.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"wrote {args.out} ({len(manifest['files'])} files, {len(rasters)} rasters)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
