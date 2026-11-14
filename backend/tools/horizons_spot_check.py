"""P2 S1.3 quick Horizons spot check: our SPICE Sun/Earth az/el vs JPL Horizons.

Usage (repo root; kernels in AZX_DATA_DIR):
    python backend/tools/horizons_spot_check.py [--lat -84.7906 --lon 29.1957] [--out FILE]

Horizons API notes (verified 2026-11-14): the angle format parameter is ANG_FORMAT
(the TRD template's ANGLE_FORMAT is rejected with HTTP 400). A surface site is
CENTER='coord@301', COORD_TYPE='GEODETIC', SITE_COORD='<E-lon>,<lat>,<alt km>';
Horizons echoes the site and uses a 1737.4 km sphere for the Moon. QUANTITIES='4' with
APPARENT='AIRLESS' gives apparent azimuth (from north, clockwise) and elevation without
refraction. Horizons uses DE441; Azelux uses DE440, so tiny differences are expected.
This is a spot check (6 times), not the full V1 validation (P6, 3 sites x 48 times).
"""
from __future__ import annotations

import argparse
import json
import sys
import time
import urllib.parse
import urllib.request
from datetime import UTC, datetime, timedelta
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND))

from app.ephemeris import load_kernels, sun_earth_series
from app.settings import Settings

API = "https://ssd.jpl.nasa.gov/api/horizons.api"
START = "2027-03-01T00:00:00Z"
DAYS, N_TIMES = 30, 6


def horizons(command: str, lat: float, lon: float, start: datetime, stop: datetime, step_min: int) -> list[tuple]:
    params = {
        "format": "json", "COMMAND": f"'{command}'", "OBJ_DATA": "'NO'", "MAKE_EPHEM": "'YES'",
        "EPHEM_TYPE": "'OBSERVER'", "CENTER": "'coord@301'", "COORD_TYPE": "'GEODETIC'",
        "SITE_COORD": f"'{lon},{lat},0'", "START_TIME": f"'{start:%Y-%m-%d %H:%M}'",
        "STOP_TIME": f"'{stop:%Y-%m-%d %H:%M}'", "STEP_SIZE": f"'{step_min} m'", "QUANTITIES": "'4'",
        "ANG_FORMAT": "'DEG'", "APPARENT": "'AIRLESS'", "EXTRA_PREC": "'YES'", "CSV_FORMAT": "'YES'",
    }
    url = API + "?" + urllib.parse.urlencode(params)
    with urllib.request.urlopen(url, timeout=90) as reply:
        result = json.load(reply)["result"].splitlines()
    rows = result[result.index("$$SOE") + 1: result.index("$$EOE")]
    site_echo = next(line.strip() for line in result if line.strip().startswith("Center geodetic"))
    out = []
    for row in rows:
        cols = [c.strip() for c in row.split(",")]
        out.append((cols[0], float(cols[3]), float(cols[4]), site_echo))
    return out


def angle_diff(a: float, b: float) -> float:
    return abs((a - b + 180.0) % 360.0 - 180.0)


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--lat", type=float, default=-84.7906)
    ap.add_argument("--lon", type=float, default=29.1957)
    ap.add_argument("--out", type=Path, help="write results JSON here")
    args = ap.parse_args()

    settings = Settings()
    loaded = load_kernels(settings.data_dir / "kernels", settings.kernel_list)
    if len(loaded) < len(settings.kernel_list):
        sys.exit(f"Kernels missing in {settings.data_dir / 'kernels'}: loaded {loaded}")

    step_min = DAYS * 24 * 60 // (N_TIMES - 1)
    ours = sun_earth_series(args.lat, args.lon, 0.0, START, DAYS * 24.0, step_min)
    t0 = datetime(2027, 3, 1, tzinfo=UTC)
    t1 = t0 + timedelta(days=DAYS)
    started = time.time()
    hz = {"sun": horizons("10", args.lat, args.lon, t0, t1, step_min),
          "earth": horizons("399", args.lat, args.lon, t0, t1, step_min)}
    rows, worst = [], {"sun_az": 0.0, "sun_el": 0.0, "earth_az": 0.0, "earth_el": 0.0}
    for body in ("sun", "earth"):
        for k, (when, h_az, h_el, _) in enumerate(hz[body]):
            o_az, o_el = float(ours[f"{body}_az"][k]), float(ours[f"{body}_el"][k])
            d_az, d_el = angle_diff(o_az, h_az), abs(o_el - h_el)
            worst[f"{body}_az"] = max(worst[f"{body}_az"], d_az)
            worst[f"{body}_el"] = max(worst[f"{body}_el"], d_el)
            rows.append({"body": body, "time_utc": when, "horizons_az": h_az, "ours_az": round(o_az, 9),
                         "horizons_el": h_el, "ours_el": round(o_el, 9),
                         "d_az_deg": float(f"{d_az:.3e}"), "d_el_deg": float(f"{d_el:.3e}")})
    report = {
        "check": "P2 S1.3 Horizons spot check (not full V1)",
        "site": {"lat_deg": args.lat, "lon_east_deg": args.lon, "height_m": 0.0},
        "horizons_site_echo": hz["sun"][0][3],
        "start_utc": START, "days": DAYS, "times": N_TIMES,
        "ours": "SpiceyPy spkcpo LT+S, MOON_ME, DE440 kernels " + ", ".join(loaded),
        "horizons": "JPL Horizons API, QUANTITIES=4, APPARENT=AIRLESS (DE441)",
        "max_abs_diff_deg": {k: float(f"{v:.3e}") for k, v in worst.items()},
        "max_abs_diff_arcsec": {k: float(f"{v * 3600:.3e}") for k, v in worst.items()},
        "note_precision": "Horizons returns 9 decimals of a degree (EXTRA_PREC); differences below ~1e-9 deg are at that output resolution.",
        "pass_target_deg": 0.05, "passed": all(v <= 0.05 for v in worst.values()),
        "horizons_query_s": round(time.time() - started, 1),
        "rows": rows,
    }
    for r in rows:
        print(f"{r['body']:5} {r['time_utc']}  az H {r['horizons_az']:14.9f} us {r['ours_az']:14.9f} "
              f"d {r['d_az_deg']:.2e} | el H {r['horizons_el']:13.9f} us {r['ours_el']:13.9f} d {r['d_el_deg']:.2e}")
    print("max |diff| deg:", report["max_abs_diff_deg"], "arcsec:", report["max_abs_diff_arcsec"], "PASS" if report["passed"] else "FAIL (> 0.05 deg)")
    if args.out:
        args.out.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
        print("wrote", args.out)
    return 0 if report["passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
