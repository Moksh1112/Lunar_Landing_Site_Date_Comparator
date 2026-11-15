"""Download NASA SVS context imagery and shift its 0-centred map to east longitude 0..360.

Visual context only: NASA explicitly says this map is optimized for aesthetics,
not science. It is never used by the terrain/visibility calculations.
"""
import sys
from pathlib import Path

import numpy as np
import rasterio

sys.path.insert(0, str(Path(__file__).resolve().parent))
from azx_data import common_args, data_dir_from, fetch_and_record
from prepare_dems import png_bytes, record

URL = 'https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/lroc_color_2k.jpg'


def main():
    args = common_args(__doc__.splitlines()[0]).parse_args()
    root = data_dir_from(args)
    import urllib.request
    with urllib.request.urlopen(urllib.request.Request(URL, method='HEAD'), timeout=20) as response:
        size = int(response.headers['Content-Length'])
    if not fetch_and_record(root, {'rel_path': 'imagery/lroc_color_2k.jpg', 'url': URL, 'bytes': size,
                                  'category': 'imagery', 'role': 'visual context only',
                                  'source': 'NASA Scientific Visualization Studio CGI Moon Kit'}, args.dry_run):
        raise RuntimeError('NASA image could not be verified/downloaded')
    if args.dry_run:
        return
    with rasterio.open(root / 'imagery/lroc_color_2k.jpg') as src:
        rgb = np.moveaxis(src.read(), 0, 2)
    if rgb.shape != (1024, 2048, 3):
        raise ValueError('Unexpected NASA source image dimensions')
    rgba = np.empty((1024, 2048, 4), dtype='uint8')
    rgba[:, :, :3] = np.roll(rgb, 1024, axis=1)
    rgba[:, :, 3] = 255
    out = root / 'dem/whole_moon_context.png'
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_bytes(png_bytes(rgba))
    record(root, 'dem/whole_moon_context.png', 'imagery/lroc_color_2k.jpg',
           'Half-width cyclic shift: source centred at 0 longitude becomes east-longitude 0..360; no scientific use')
    print(out)


if __name__ == '__main__':
    main()
