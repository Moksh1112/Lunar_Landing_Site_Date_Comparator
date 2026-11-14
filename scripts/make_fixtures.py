"""Generate SYNTHETIC contract fixtures for Azelux CONTRACT v1.0.

All values are made up for UI and contract testing. They are internally
consistent (visibility follows from elevation vs skyline; windows and metrics
follow from visibility) so the frontend can be built against them.
Never present these values as real.

Run: python scripts/make_fixtures.py   (writes into fixtures/)
"""
import base64
import json
import math
import struct
from datetime import datetime, timedelta, timezone
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "fixtures"
OUT.mkdir(exist_ok=True)

T0 = datetime(2027, 3, 1, tzinfo=timezone.utc)
STEP_MIN = 60
MISSION_H = 48
THRESHOLDS = {"sun_pct_min": 50, "earth_pct_min": 50, "dark_gap_h_max": 48, "blackout_h_max": 72}


def iso(dt):
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")


def meta(mode="terrain", step=STEP_MIN):
    return {
        "ephemeris": "SPICE DE440 (JPL NAIF)",
        "kernels": ["naif0012.tls", "de440s.bsp", "pck00011.tpc",
                    "moon_pa_de440_200625.bpc", "moon_de440_220930.tf"],
        "horizon_mode": mode,
        "dem": "LDEM_80S_20MPP_ADJ + far_160m" if mode == "terrain" else None,
        "step_minutes": step,
        "observer_height_m": 2,
        "app_version": "0.1.0",
        "contract_version": "1.0",
        "computed_at": "2026-11-14T08:00:00Z",
        "data_label": "SYNTHETIC",
    }


def skyline(seed, flat=False):
    if flat:
        return [round(-0.05, 3)] * 720, None
    elev, dist = [], []
    for i in range(720):
        az = i * 0.5
        e = 0.6 + 1.2 * math.sin(math.radians(az * 2 + seed)) + 0.6 * math.sin(math.radians(az * 5 + 3 * seed))
        elev.append(round(max(e, -0.05), 3))
        dist.append(round(5 + 40 * (1 + math.sin(math.radians(az + seed))), 2))
    return elev, dist


def sky_at(elev, az):
    x = (az % 360) / 0.5
    i0 = int(math.floor(x)) % 720
    i1 = (i0 + 1) % 720
    f = x - math.floor(x)
    return elev[i0] * (1 - f) + elev[i1] * f


def window(start, end, first, last):
    return {"start": iso(start), "end": iso(end),
            "hours": round((end-start).total_seconds()/3600, 1),
            "start_censored": first, "end_censored": last}


def runs(vis, times, margins):
    """Interpolate signed elevation-minus-skyline at visible-run boundaries."""
    def cross(i, j):
        fraction = -margins[i] / (margins[j] - margins[i])
        return times[i] + (times[j]-times[i]) * fraction
    out, i = [], 0
    while i < len(vis):
        if not vis[i]:
            i += 1
            continue
        j = i
        while j+1 < len(vis) and vis[j+1]:
            j += 1
        start = times[0] if i == 0 else cross(i-1, i)
        end = times[-1] if j == len(vis)-1 else cross(j, j+1)
        if end > start:
            out.append(window(start, end, i == 0, j == len(vis)-1))
        i = j+1
    return out


def parse(value):
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def intersect(a, b, start, end):
    out = []
    for x in a:
        for y in b:
            lo, hi = max(parse(x["start"]), parse(y["start"])), min(parse(x["end"]), parse(y["end"]))
            if hi > lo:
                out.append(window(lo, hi, lo == start, hi == end))
    return sorted(out, key=lambda w: w["start"])


def hours(windows):
    return sum((parse(w["end"])-parse(w["start"])).total_seconds()/3600 for w in windows)


def longest_gap(windows, start, end):
    cursor, best = start, 0.0
    for w in windows:
        best = max(best, (parse(w["start"])-cursor).total_seconds()/3600)
        cursor = parse(w["end"])
    return round(max(best, (end-cursor).total_seconds()/3600), 1)


def verdict(m, th):
    checks = {
        "sun_pct_min": (m["sun_pct"] >= th["sun_pct_min"], m["sun_pct"] >= 0.8 * th["sun_pct_min"]),
        "earth_pct_min": (m["earth_pct"] >= th["earth_pct_min"], m["earth_pct"] >= 0.8 * th["earth_pct_min"]),
        "dark_gap_h_max": (m["longest_dark_h"] <= th["dark_gap_h_max"], m["longest_dark_h"] <= 1.2 * th["dark_gap_h_max"]),
        "blackout_h_max": (m["longest_blackout_h"] <= th["blackout_h_max"], m["longest_blackout_h"] <= 1.2 * th["blackout_h_max"]),
    }
    failed = [k for k, (ok, _) in checks.items() if not ok]
    if not failed:
        level = "green"
    elif all(near for _, near in checks.values()):
        level = "amber"
    else:
        level = "red"
    return {"level": level, "failed": failed}


def scenario(sid, label, site, seed, sun_bias, earth_bias, mode="terrain", flat=False):
    n = MISSION_H * 60 // STEP_MIN + 1
    times = [T0 + timedelta(minutes=STEP_MIN * k) for k in range(n)]
    elev, dist = skyline(seed, flat)
    s_az, s_el, e_az, e_el, s_vis, e_vis = [], [], [], [], [], []
    for k in range(n):
        h = k * STEP_MIN / 60
        saz = (120 + 0.51 * h + seed) % 360
        sel = sun_bias + 1.6 * math.sin(2 * math.pi * h / 30 + seed / 10)
        eaz = (2 + 3 * math.sin(2 * math.pi * h / 40)) % 360
        eel = earth_bias + 1.2 * math.sin(2 * math.pi * h / 36 + 1)
        s_az.append(round(saz, 3)); s_el.append(round(sel, 3))
        e_az.append(round(eaz, 3)); e_el.append(round(eel, 3))
        s_vis.append(1 if s_el[-1] > sky_at(elev, s_az[-1]) else 0)
        e_vis.append(1 if e_el[-1] > sky_at(elev, e_az[-1]) else 0)
    w_sun = runs(s_vis, times, [el-sky_at(elev, az) for el,az in zip(s_el,s_az)])
    w_earth = runs(e_vis, times, [el-sky_at(elev, az) for el,az in zip(e_el,e_az)])
    w_both = intersect(w_sun, w_earth, times[0], times[-1])
    sh, eh, bh = hours(w_sun), hours(w_earth), hours(w_both)
    up = [e for e, v in zip(s_el, s_vis) if v]
    m = {
        "sun_el_max_deg": round(max(s_el), 2),
        "sun_el_mean_up_deg": round(sum(up) / len(up), 2) if up else None,
        "sun_hours": round(sh, 1), "sun_pct": round(100 * sh / MISSION_H, 1),
        "earth_hours": round(eh, 1), "earth_pct": round(100 * eh / MISSION_H, 1),
        "both_hours": round(bh, 1), "both_pct": round(100 * bh / MISSION_H, 1),
        "longest_dark_h": longest_gap(w_sun, times[0], times[-1]),
        "longest_blackout_h": longest_gap(w_earth, times[0], times[-1]),
    }
    return {
        "id": sid, "label": label, "site": site, "meta": meta(mode),
        "skyline": {"az_step_deg": 0.5, "elev_deg": elev, "block_dist_km": dist},
        "series": {"t_unix": [int(t.timestamp()) for t in times], "sun_az": s_az, "sun_el": s_el,
                   "earth_az": e_az, "earth_el": e_el, "sun_vis": s_vis, "earth_vis": e_vis},
        "windows": {"sun": w_sun, "earth": w_earth, "both": w_both},
        "metrics": m, "verdict": verdict(m, THRESHOLDS),
    }


def deltas(a, b):
    out = {}
    for k, v in a["metrics"].items():
        w = b["metrics"][k]
        out[k] = None if v is None or w is None else round(v - w, 2)
    return out


def dump(name, obj):
    (OUT / name).write_text(json.dumps(obj, indent=1) + "\n")
    print("wrote", name)


LIMITS = ["SYNTHETIC fixture: values are invented for UI testing.",
          "Visibility uses the body centre; partial disks are not modelled.",
          "Sunlight is not power; Earth in view is not a radio link."]

site_a = {"site_id": "test-pole-1", "name": "Test site 1 (synthetic)", "lat_deg": -85.5, "lon_east_deg": 30.0}
site_b = {"site_id": "test-pole-2", "name": "Test site 2 (synthetic)", "lat_deg": -86.2, "lon_east_deg": 210.0}
site_far = {"site_id": None, "name": None, "lat_deg": -20.0, "lon_east_deg": 180.0}

A = scenario("A", "Original plan", site_a, 10, 1.4, 1.9)
B = scenario("B", "Alternative site", site_b, 47, 0.9, 1.1)
dump("compare.ok.json", {"contract_version": "1.0", "scenarios": [A, B], "deltas": deltas(A, B), "limitations": LIMITS})

A2 = scenario("A", "Original plan", site_a, 10, 1.4, 1.9)
# Far-side site at local night: Sun and Earth both below the horizon for the whole window.
B2 = scenario("B", "Far side (no Earth)", site_far, 5, -8.0, -12.0, mode="geometric", flat=True)
B2["skyline"]["block_dist_km"] = None
dump("compare.empty.json", {"contract_version": "1.0", "scenarios": [A2, B2], "deltas": deltas(A2, B2),
                            "limitations": LIMITS + ["Scenario B uses geometric horizon only."]})

dump("compare.error.json", {"error": {"code": "INVALID_INPUT", "message": "Scenario B latitude must be between -90 and 90.",
                                      "details": [{"field": "scenarios[1].site.lat_deg", "reason": "must be between -90 and 90"}]}})

# Sites
dump("sites.ok.json", {"sites": [
    {**site_a, "group": "artemis_candidate", "terrain_coverage": True, "source_url": "https://example.invalid/synthetic",
     "source_note": "SYNTHETIC test site, not a real landing site", "verified": False},
    {**site_b, "group": "artemis_candidate", "terrain_coverage": True, "source_url": "https://example.invalid/synthetic",
     "source_note": "SYNTHETIC test site, not a real landing site", "verified": False},
    {"site_id": "test-near-1", "name": "Test near-side site (synthetic)", "lat_deg": 10.0, "lon_east_deg": 20.0,
     "group": "apollo", "terrain_coverage": False, "source_url": "https://example.invalid/synthetic",
     "source_note": "SYNTHETIC test site", "verified": False},
]})
dump("sites.empty.json", {"sites": []})
dump("sites.error.json", {"error": {"code": "INTERNAL", "message": "Site library could not be loaded.", "details": []}})

# Sweep
days = []
for d in range(14):
    sp = round(40 + 25 * math.sin(d / 2.2), 1)
    ep = round(55 + 20 * math.cos(d / 3.1), 1)
    m = {"sun_el_max_deg": round(1.5 + 0.8 * math.sin(d), 2), "sun_el_mean_up_deg": round(1.0 + 0.4 * math.sin(d), 2),
         "sun_hours": round(sp * 7.08, 1), "sun_pct": sp, "earth_hours": round(ep * 7.08, 1), "earth_pct": ep,
         "both_hours": round(min(sp, ep) * 5.0, 1), "both_pct": round(round(min(sp, ep) * 5.0, 1) / 708 * 100, 1),
         "longest_dark_h": round(30 + 40 * (1 - math.sin(d / 2.2)), 1), "longest_blackout_h": round(40 + 30 * (1 - math.cos(d / 3.1)), 1)}
    days.append({"date": (T0 + timedelta(days=d)).strftime("%Y-%m-%d"), "rank": 0, "refined": False,
                 "metrics": m, "verdict": verdict(m, THRESHOLDS)})
order = {"green": 0, "amber": 1, "red": 2}
ranked = sorted(days, key=lambda x: (order[x["verdict"]["level"]], -x["metrics"]["both_hours"], x["metrics"]["longest_dark_h"]))
for r, d in enumerate(ranked, 1):
    d["rank"] = r
    d["refined"] = r <= 5
dump("sweep.ok.json", {"contract_version": "1.0", "site": site_a, "meta": meta(step=30), "days": days,
                       "top": [d["date"] for d in ranked[:5]]})
dump("sweep.empty.json", {"contract_version": "1.0", "site": site_a, "meta": meta(step=30), "days": [], "top": []})
dump("sweep.error.json", {"error": {"code": "RANGE_TOO_LARGE", "message": "Date range must be 183 days or less.",
                                    "details": [{"field": "range_end", "reason": "range longer than 183 days"}]}})

# Skyline
el, di = skyline(10)
dump("skyline.ok.json", {"site": site_a, "meta": meta(), "skyline": {"az_step_deg": 0.5, "elev_deg": el, "block_dist_km": di}})
dump("skyline.error.json", {"error": {"code": "NOT_IN_COVERAGE", "message": "Terrain data does not cover this point; results use the geometric horizon.",
                                      "details": [{"field": "lat_deg", "reason": "terrain coverage is south of -80.7"}]}})

# Terrain tile: 256x256 synthetic hill + ridge, float32 little-endian, row-major, north-up
W = H = 256
vals = []
for y in range(H):
    for x in range(W):
        dx, dy = (x - 128) / 40, (y - 128) / 40
        h = 1800 * math.exp(-(dx * dx + dy * dy)) + 600 * math.exp(-((x - 200) / 25) ** 2) - 300
        vals.append(h)
raw = struct.pack("<%df" % len(vals), *vals)
dump("terrain-tile.ok.json", {"site": site_a, "size_km": 20, "width": W, "height": H,
                              "heights_m_b64": base64.b64encode(raw).decode(), "min_m": round(min(vals), 1),
                              "max_m": round(max(vals), 1), "site_px": [128, 128], "data_label": "SYNTHETIC"})
dump("terrain-tile.error.json", {"error": {"code": "NOT_IN_COVERAGE", "message": "No terrain tile for this point.",
                                           "details": [{"field": "lat_deg", "reason": "outside terrain coverage"}]}})

# Health fixture describes mock resources, never loaded real kernels/DEMs.
dump("health.ok.json", {"status":"ok", "app_version":"0.1.0", "contract_version":"1.0", "kernels_loaded":[], "dems_loaded":[], "mock":True})
dump("health.error.json", {"error":{"code":"INTERNAL", "message":"Synthetic health failure for testing.", "details":[]}})
