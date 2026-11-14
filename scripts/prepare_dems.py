"""Prepare derived DEM products for Azelux (owner: P3, stage S2).

Usage (run with the backend packages: PYTHONPATH="C:/azelux-pkgs;backend"):
    python scripts/prepare_dems.py --data-dir C:/azelux-data --far --hillshade
    python scripts/prepare_dems.py --data-dir C:/azelux-data --tiles      # needs the finished 20 m DEM

--far        dem/far_160m.tif: 2x2 NaN-aware block mean of the 80 m LOLA DEM (float32, deflate, tiled).
--hillshade  dem/south_pole_hillshade_2048.png (+ .json sidecar with CRS and projected bounds).
--tiles      tiles/<site_id>.tif: 50 x 50 km crops of the 20 m DEM centred on each verified
             curated site with lat <= -80.7 (pixel-grid snapped). Refuses to run until the 20 m
             file is complete.
Every product is recorded in MANIFEST.json (category "dem-derived").
"""
from __future__ import annotations

import json
import struct
import sys
import time
import zlib
from datetime import UTC, datetime
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from azx_data import common_args, data_dir_from, file_hashes, update_manifest

REPO = Path(__file__).resolve().parents[1]
SITES_JSON = REPO / "backend" / "app" / "sites" / "sites.json"
DEM_80M = "dem/LDEM_80S_80MPP_ADJ.TIF"
DEM_20M = "dem/LDEM_80S_20MPP_ADJ.TIF"
DEM_20M_BYTES = 2696082051
FAR_REL = "dem/far_160m.tif"
HILLSHADE_REL = "dem/south_pole_hillshade_2048.png"
HILLSHADE_PX = 2048
COVERAGE_LAT_MAX_DEG = -80.7
TILE_KM = 50.0


def _now() -> str:
    return datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")


def pole_sites() -> list[dict]:
    """Verified curated sites south of the terrain coverage limit."""
    sites = json.loads(SITES_JSON.read_text(encoding="utf-8"))["sites"]
    return [s for s in sites if s.get("verified") and s["lat_deg"] <= COVERAGE_LAT_MAX_DEG]


# -- far DEM -------------------------------------------------------------------------
def average_2x2_nan(a: np.ndarray) -> np.ndarray:
    """2x2 block mean over valid pixels; all-NaN blocks stay NaN. Shape must be even."""
    h, w = a.shape
    blk = a.reshape(h // 2, 2, w // 2, 2).astype(np.float64)
    valid = np.isfinite(blk)
    cnt = valid.sum(axis=(1, 3))
    tot = np.where(valid, blk, 0.0).sum(axis=(1, 3))
    with np.errstate(invalid="ignore", divide="ignore"):
        out = np.where(cnt > 0, tot / cnt, np.nan)
    return out.astype(np.float32)


def build_far(src_path: Path, dst_path: Path, strip_rows: int = 400) -> dict:
    import rasterio
    from rasterio.windows import Window

    with rasterio.open(src_path) as src:
        h, w = src.height - src.height % 2, src.width - src.width % 2
        profile = {
            "driver": "GTiff", "dtype": "float32", "count": 1, "width": w // 2, "height": h // 2,
            "crs": src.crs, "transform": src.transform @ src.transform.scale(2.0, 2.0),
            "nodata": float("nan"), "compress": "deflate", "predictor": 3, "tiled": True,
            "blockxsize": 256, "blockysize": 256,
        }
        tmp = dst_path.with_name(dst_path.name + ".part")
        dst_path.parent.mkdir(parents=True, exist_ok=True)
        strip_rows -= strip_rows % 2
        with rasterio.open(tmp, "w", **profile) as dst:
            for r0 in range(0, h, strip_rows):
                rows = min(strip_rows, h - r0)
                a = src.read(1, window=Window(0, r0, w, rows)).astype(np.float32)
                if src.nodata is not None and np.isfinite(src.nodata):
                    a[a == src.nodata] = np.nan
                dst.write(average_2x2_nan(a), 1, window=Window(0, r0 // 2, w // 2, rows // 2))
        tmp.replace(dst_path)
        return {"width": w // 2, "height": h // 2, "pixel_m": abs(profile["transform"].a)}


# -- PNG (no Pillow) -------------------------------------------------------------------
def png_bytes(rgba: np.ndarray) -> bytes:
    """Encode an (H, W, 4) uint8 array as an RGBA PNG using zlib + struct only."""
    if rgba.ndim != 3 or rgba.shape[2] != 4 or rgba.dtype != np.uint8:
        raise ValueError("expected (H, W, 4) uint8")
    h, w, _ = rgba.shape

    def chunk(tag: bytes, data: bytes) -> bytes:
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)

    raw = np.zeros((h, 1 + w * 4), dtype=np.uint8)  # filter byte 0 per scanline
    raw[:, 1:] = rgba.reshape(h, w * 4)
    return (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 6, 0, 0, 0))
        + chunk(b"IDAT", zlib.compress(raw.tobytes(), 6))
        + chunk(b"IEND", b"")
    )


def hillshade(z: np.ndarray, pixel_m: float, azimuth_deg: float = 315.0, altitude_deg: float = 45.0) -> np.ndarray:
    """Standard Lambertian hillshade in [0, 1]; z rows run down (-y), cols run +x, NaN allowed."""
    zz = np.where(np.isfinite(z), z, np.nanmean(z)).astype(np.float64)
    dz_dy_row, dz_dx = np.gradient(zz, pixel_m)
    dz_dy = -dz_dy_row  # rows decrease in y, so north gradient flips sign
    az, alt = np.radians(azimuth_deg), np.radians(altitude_deg)
    light = np.array([np.sin(az) * np.cos(alt), np.cos(az) * np.cos(alt), np.sin(alt)])
    norm = np.sqrt(dz_dx**2 + dz_dy**2 + 1.0)
    shade = (-dz_dx * light[0] - dz_dy * light[1] + light[2]) / norm
    return np.clip(shade, 0.0, 1.0)


def build_hillshade(far_path: Path, png_path: Path) -> dict:
    import rasterio
    from scipy.ndimage import zoom

    with rasterio.open(far_path) as src:
        z = src.read(1).astype(np.float64)
        z[~np.isfinite(z)] = np.nan
        t, crs_wkt, w, h = src.transform, src.crs.to_wkt(), src.width, src.height
        px = abs(t.a)
    shade = hillshade(z, px)
    factor = (HILLSHADE_PX / h, HILLSHADE_PX / w)
    shade_s = zoom(shade, factor, order=1)[:HILLSHADE_PX, :HILLSHADE_PX]
    valid_s = zoom(np.isfinite(z).astype(np.float32), factor, order=1)[:HILLSHADE_PX, :HILLSHADE_PX] > 0.5
    rgba = np.zeros((HILLSHADE_PX, HILLSHADE_PX, 4), dtype=np.uint8)
    g = np.round(np.clip(shade_s, 0, 1) * 255).astype(np.uint8)
    rgba[..., 0] = rgba[..., 1] = rgba[..., 2] = g
    rgba[..., 3] = np.where(valid_s, 255, 0)  # nodata -> transparent
    png_path.write_bytes(png_bytes(rgba))
    bounds = [t.c, t.f + t.e * h, t.c + t.a * w, t.f]  # left, bottom, right, top (projected metres)
    sidecar = {
        "image": png_path.name, "width": HILLSHADE_PX, "height": HILLSHADE_PX,
        "crs_wkt": crs_wkt, "bounds_m": bounds, "bounds_order": "left,bottom,right,top",
        "pixel_size_m": [(bounds[2] - bounds[0]) / HILLSHADE_PX, (bounds[3] - bounds[1]) / HILLSHADE_PX],
        "row0": "+y (grid-up); col0 = -x", "source": far_path.name,
        "sun_azimuth_deg": 315.0, "sun_altitude_deg": 45.0, "nodata": "transparent (alpha 0)",
        "note": "South polar stereographic, x = r sin(lon), y = r cos(lon), sphere R = 1737400 m.",
    }
    png_path.with_suffix(".json").write_text(json.dumps(sidecar, indent=2) + "\n", encoding="utf-8")
    return sidecar


# -- tiles -----------------------------------------------------------------------------
def crop_tile(src_path: Path, dst_path: Path, lat: float, lon: float, tile_km: float = TILE_KM) -> dict:
    import rasterio
    from rasterio.windows import Window

    sys.path.insert(0, str(REPO / "backend"))
    from app.terrain.raster import RasterSampler

    with RasterSampler(src_path) as s:
        cx, cy = (float(v) for v in s.xy(lat, lon))
    with rasterio.open(src_path) as src:
        t = src.transform
        n = round(tile_km * 1000.0 / abs(t.a))
        col0 = round((cx - tile_km * 500.0 - t.c) / t.a)
        row0 = round((cy + tile_km * 500.0 - t.f) / t.e)
        col0c, row0c = max(col0, 0), max(row0, 0)
        wd = min(col0 + n, src.width) - col0c
        ht = min(row0 + n, src.height) - row0c
        win = Window(col0c, row0c, wd, ht)
        data = src.read(1, window=win).astype(np.float32)
        profile = {
            "driver": "GTiff", "dtype": "float32", "count": 1, "width": wd, "height": ht, "crs": src.crs,
            "transform": src.window_transform(win), "nodata": float("nan"), "compress": "deflate",
            "predictor": 3, "tiled": True, "blockxsize": 256, "blockysize": 256,
        }
        dst_path.parent.mkdir(parents=True, exist_ok=True)
        tmp = dst_path.with_name(dst_path.name + ".part")
        with rasterio.open(tmp, "w", **profile) as dst:
            dst.write(data, 1)
        tmp.replace(dst_path)
    return {"width": wd, "height": ht, "clipped": (wd, ht) != (n, n), "nan_fraction": float(np.isnan(data).mean())}


def twenty_m_ready(data_dir: Path) -> str | None:
    """None if the 20 m DEM is complete, else the reason it is not."""
    p = data_dir / DEM_20M
    if not p.is_file():
        return f"{p} does not exist (only a .part file?)"
    if p.stat().st_size != DEM_20M_BYTES:
        return f"{p} has {p.stat().st_size:,} bytes, expected {DEM_20M_BYTES:,}"
    mf = data_dir / "MANIFEST.json"
    if mf.exists():
        entry = json.loads(mf.read_text(encoding="utf-8")).get("files", {}).get(DEM_20M)
        if entry is None or entry.get("status") != "complete":
            return "MANIFEST.json does not mark the 20 m DEM as complete"
    return None


# -- manifest + CLI --------------------------------------------------------------------
def record(data_dir: Path, rel: str, derived_from: str, method: str, extra: dict | None = None) -> tuple[int, str]:
    path = data_dir / rel
    sha, _ = file_hashes(path)
    entry = {
        "bytes": path.stat().st_size, "category": "dem-derived", "derived_from": derived_from,
        "method": method, "sha256": sha, "status": "complete", "created_utc": _now(),
    }
    entry.update(extra or {})
    update_manifest(data_dir, rel, entry)
    return entry["bytes"], sha


def main() -> int:
    ap = common_args("Prepare derived DEM products (far 160 m DEM, hillshade, 20 m tiles).")
    ap.add_argument("--far", action="store_true", help="build dem/far_160m.tif from the 80 m DEM")
    ap.add_argument("--hillshade", action="store_true", help="build the 2048 px hillshade PNG from the far DEM")
    ap.add_argument("--tiles", action="store_true", help="crop 50 km tiles from the finished 20 m DEM")
    args = ap.parse_args()
    if not (args.far or args.hillshade or args.tiles):
        ap.error("choose at least one of --far --hillshade --tiles")
    data_dir = data_dir_from(args)

    if args.tiles:
        why = twenty_m_ready(data_dir)
        if why:
            print(f"ERROR: cannot build tiles, 20 m DEM not complete: {why}", file=sys.stderr)
            return 1

    if args.far:
        t0 = time.perf_counter()
        src = data_dir / DEM_80M
        if not src.is_file():
            print(f"ERROR: missing {src}", file=sys.stderr)
            return 1
        info = build_far(src, data_dir / FAR_REL)
        size, sha = record(data_dir, FAR_REL, DEM_80M, "2x2 block mean over valid pixels (NaN-aware), float32",
                           {"pixel_m": info["pixel_m"], "width": info["width"], "height": info["height"]})
        print(f"far DEM: {FAR_REL} {info['width']}x{info['height']} {size:,} bytes sha256 {sha[:16]} "
              f"{time.perf_counter() - t0:.1f}s")

    if args.hillshade:
        t0 = time.perf_counter()
        far = data_dir / FAR_REL
        if not far.is_file():
            print(f"ERROR: {far} missing; run --far first", file=sys.stderr)
            return 1
        build_hillshade(far, data_dir / HILLSHADE_REL)
        size, sha = record(data_dir, HILLSHADE_REL, FAR_REL, "hillshade az 315 alt 45, 2048 px RGBA PNG")
        sidecar_rel = HILLSHADE_REL.replace(".png", ".json")
        ssize, ssha = record(data_dir, sidecar_rel, HILLSHADE_REL, "georeferencing sidecar (CRS + bounds)")
        print(f"hillshade: {HILLSHADE_REL} {size:,} bytes sha256 {sha[:16]}; sidecar {ssize} bytes "
              f"sha256 {ssha[:16]} {time.perf_counter() - t0:.1f}s")

    if args.tiles:
        for s in pole_sites():
            t0 = time.perf_counter()
            rel = f"tiles/{s['site_id']}.tif"
            info = crop_tile(data_dir / DEM_20M, data_dir / rel, s["lat_deg"], s["lon_east_deg"])
            size, sha = record(data_dir, rel, DEM_20M, f"{TILE_KM:.0f} km square crop centred on {s['site_id']}",
                               {"width": info["width"], "height": info["height"]})
            flag = " CLIPPED at DEM edge" if info["clipped"] else ""
            print(f"tile {s['site_id']}: {info['width']}x{info['height']} {size:,} bytes sha256 {sha[:16]} "
                  f"nan {info['nan_fraction']:.4f} {time.perf_counter() - t0:.1f}s{flag}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
