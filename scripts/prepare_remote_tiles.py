"""Crop required 20 m near-field tiles directly from NASA's cloud-optimized GeoTIFF.

HTTP range reads avoid downloading the entire 2.7 GB product. Each derived crop gets
its own SHA256; no full upstream-file checksum verification is claimed.
"""
from __future__ import annotations

import json
import math
import sys
from pathlib import Path

import numpy as np
import rasterio
from rasterio.windows import Window

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from azx_data import common_args, data_dir_from, file_hashes, update_manifest

URL = 'https://pgda.gsfc.nasa.gov/data/LOLA_20mpp/LDEM_80S_20MPP_ADJ.TIF'


def main() -> None:
    args = common_args(__doc__.splitlines()[0]).parse_args()
    if args.dry_run:
        print(URL, '50 km crops for verified polar sites; HTTP range reads')
        return
    out_dir = data_dir_from(args)
    sites = json.loads((ROOT / 'backend/app/sites/sites.json').read_text())['sites']
    with rasterio.Env(GDAL_HTTP_TIMEOUT=30, GDAL_HTTP_MAX_RETRY=0, GDAL_DISABLE_READDIR_ON_OPEN='EMPTY_DIR'), rasterio.open(URL) as src:
        if src.width != 30400 or src.height != 30400 or abs(src.transform.a) != 20:
            raise ValueError('Unexpected upstream dimensions/resolution')
        crs = src.crs.to_dict()
        if crs.get('lat_0') != -90 or crs.get('lon_0') != 0 or crs.get('R') != 1737400:
            raise ValueError(f'Unexpected source projection: {crs}')
        for site in sites:
            if not site['verified'] or site['lat_deg'] > -80.7:
                continue
            lat, lon = math.radians(site['lat_deg']), math.radians(site['lon_east_deg'])
            r = 2 * 1737400 * math.tan(math.pi / 4 + lat / 2)
            x, y = r * math.sin(lon), r * math.cos(lon)
            col = round((x - 25000 - src.transform.c) / src.transform.a)
            row = round((y + 25000 - src.transform.f) / src.transform.e)
            win = Window(col, row, 2500, 2500)
            if col < 0 or row < 0 or col + 2500 > src.width or row + 2500 > src.height:
                raise ValueError('Requested crop exceeds raster bounds')
            data = src.read(1, window=win).astype('float32')
            if src.nodata is not None:
                data[data == src.nodata] = np.nan
            data = data * src.scales[0] + src.offsets[0]
            rel = f"tiles/{site['site_id']}.tif"
            dest = out_dir / rel
            dest.parent.mkdir(parents=True, exist_ok=True)
            tmp = dest.with_suffix('.tif.part')
            with rasterio.open(tmp, 'w', driver='GTiff', width=2500, height=2500, count=1,
                               dtype='float32', crs=src.crs, transform=src.window_transform(win),
                               nodata=float('nan'), tiled=True, compress='deflate', predictor=3) as dst:
                dst.write(data, 1)
            tmp.replace(dest)
            sha, md5 = file_hashes(dest)
            update_manifest(out_dir, rel, {'category': 'dem-derived', 'status': 'complete',
                'url': URL, 'source': 'NASA PGDA product 90, 20 m LOLA COG',
                'derivation': '50 km pixel-aligned crop via HTTP byte ranges; decoded scale/offset',
                'upstream_full_checksum_verified': False, 'sha256': sha, 'md5': md5,
                'bytes': dest.stat().st_size, 'window': [col, row, 2500, 2500],
                'source_crs': src.crs.to_wkt(), 'nan_fraction': float(np.isnan(data).mean())})
            print(rel, sha, flush=True)


if __name__ == '__main__':
    main()
