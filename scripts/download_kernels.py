"""Download the NAIF SPICE generic kernels Azelux needs (owner: P2).

Usage (absolute, non-OneDrive data folder):
    python scripts/download_kernels.py --data-dir C:/azelux-data
    python scripts/download_kernels.py --dry-run          # check remote sizes only

Files and sizes were confirmed on naif.jpl.nasa.gov on 2026-11-14 (HTTP HEAD).
TRD 3.2 named moon_de440_220930.tf; NAIF removed it (404) and its fk/satellites
aareadme.txt names moon_de440_250416.tf, to be used with moon_pa_de440_200625.bpc.
de440s.bsp is checked against NAIF's published MD5 (spk/planets/aa_checksums.txt);
NAIF publishes no checksums for lsk/pck/fk, so their SHA-256 is recorded on download.
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from azx_data import common_args, data_dir_from, fetch_and_record

BASE = "https://naif.jpl.nasa.gov/pub/naif/generic_kernels"
SOURCE = "NASA/JPL NAIF SPICE generic kernels"
KERNELS = [
    {"rel_path": "kernels/naif0012.tls", "url": f"{BASE}/lsk/naif0012.tls", "bytes": 5257,
     "role": "leap seconds (UTC to ET)"},
    {"rel_path": "kernels/de440s.bsp", "url": f"{BASE}/spk/planets/de440s.bsp", "bytes": 32726016,
     "md5": "3917ee56769db332790c751e2168843d", "role": "Sun, Earth, Moon positions (DE440 short span)"},
    {"rel_path": "kernels/pck00011.tpc", "url": f"{BASE}/pck/pck00011.tpc", "bytes": 131226,
     "role": "body radii and constants"},
    {"rel_path": "kernels/moon_pa_de440_200625.bpc", "url": f"{BASE}/pck/moon_pa_de440_200625.bpc",
     "bytes": 12863488, "role": "high-accuracy lunar orientation (DE440)"},
    {"rel_path": "kernels/moon_de440_250416.tf", "url": f"{BASE}/fk/satellites/moon_de440_250416.tf",
     "bytes": 19478, "role": "lunar frames: MOON_ME / MOON_PA aliases (DE440)"},
]


def main() -> int:
    args = common_args(__doc__.splitlines()[0]).parse_args()
    data_dir = data_dir_from(args)
    print(f"Data directory: {data_dir}")
    ok = True
    for item in KERNELS:
        ok &= fetch_and_record(data_dir, {**item, "category": "kernel", "source": SOURCE}, args.dry_run)
    print("ALL KERNELS OK" if ok else "SOME KERNELS FAILED")
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
