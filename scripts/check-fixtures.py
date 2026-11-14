"""Read-only Azelux fixture invariants; no real science/API conformance claim."""
import base64
import json
import math
import struct
import subprocess
import sys
import tempfile
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
F = ROOT / "fixtures"
def read(name):
    return json.loads((F / name).read_text(encoding="utf-8"))
def utc(s):
    return datetime.fromisoformat(s.replace("Z", "+00:00")).timestamp()
def sky(elev, az):
    index = az / .5
    low = math.floor(index)
    fraction = index-low
    return elev[low % 720]*(1-fraction) + elev[(low+1) % 720]*fraction

def validate():
    paths = sorted(F.glob("*.json"))
    assert len(paths) == 15, paths
    for path in paths:
        d = read(path.name)
        if path.name.endswith(".error.json"):
            assert set(d) == {"error"} and set(d["error"]) == {"code", "message", "details"}
    for name in ("compare.ok.json", "compare.empty.json"):
        d = read(name)
        assert d["contract_version"] == "1.0"
        assert [s["id"] for s in d["scenarios"]] == ["A", "B"]
        for s in d["scenarios"]:
            assert s["meta"]["data_label"] == "SYNTHETIC"
            series, horizon = s["series"], s["skyline"]["elev_deg"]
            times = series["t_unix"]
            assert len(horizon) == 720
            assert all(len(v) == len(times) for v in series.values())
            assert all(b-a == s["meta"]["step_minutes"]*60 for a,b in zip(times,times[1:]))
            duration = (times[-1]-times[0])/3600
            for target, hourkey, pctkey, gapkey in (("sun", "sun_hours", "sun_pct", "longest_dark_h"),
                                                   ("earth", "earth_hours", "earth_pct", "longest_blackout_h"),
                                                   ("both", "both_hours", "both_pct", None)):
                windows = s["windows"][target]
                hours = 0
                cursor, gap = times[0], 0
                for w in windows:
                    start,end = utc(w["start"]), utc(w["end"])
                    assert times[0] <= start < end <= times[-1]
                    assert start >= cursor
                    assert w["hours"] == round((end-start)/3600,1)
                    assert w["start_censored"] == (start == times[0])
                    assert w["end_censored"] == (end == times[-1])
                    gap = max(gap,(start-cursor)/3600)
                    cursor=end
                    hours += (end-start)/3600
                assert s["metrics"][hourkey] == round(hours,1)
                assert s["metrics"][pctkey] == round(hours/duration*100,1)
                if gapkey:
                    gap=max(gap,(times[-1]-cursor)/3600)
                    assert s["metrics"][gapkey] == round(gap,1)
                if target != "both":
                    margins = [el-sky(horizon,az) for el,az in zip(series[target+"_el"],series[target+"_az"])]
                    assert series[target+"_vis"] == [int(x>0) for x in margins]
                    # Every sign crossing must appear as an interpolated boundary.
                    for i in range(1,len(times)):
                        if (margins[i-1]>0) != (margins[i]>0):
                            expected=times[i-1] + (times[i]-times[i-1])*(-margins[i-1])/(margins[i]-margins[i-1])
                            field="start" if margins[i]>0 else "end"
                            assert any(abs(utc(w[field])-expected) < 1.001 for w in windows)
            # Combined windows must be the exact intersections, not independent fabricated runs.
            expected=[]
            for a in s["windows"]["sun"]:
                for b in s["windows"]["earth"]:
                    lo,hi=max(utc(a["start"]),utc(b["start"])),min(utc(a["end"]),utc(b["end"]))
                    if hi>lo:expected.append((lo,hi))
            assert sorted(expected) == [(utc(w["start"]),utc(w["end"])) for w in s["windows"]["both"]]
        a,b = d["scenarios"]
        for k,v in a["metrics"].items():
            other=b["metrics"][k]
            assert d["deltas"][k] == (None if v is None or other is None else round(v-other,2))
    sites=read("sites.ok.json")["sites"]
    assert all(not s["verified"] and "synthetic" in s["source_note"].lower() for s in sites)
    health=read("health.ok.json")
    assert health["mock"] and not health["kernels_loaded"] and not health["dems_loaded"]
    sweep=read("sweep.ok.json")
    assert sweep["meta"]["data_label"] == "SYNTHETIC"
    for day in sweep["days"]:
        m=day["metrics"]
        for body in ("sun","earth","both"):
            assert abs(m[body+"_pct"]-round(m[body+"_hours"]/708*100,1)) <= .100001
    expected=sorted(sweep["days"],key=lambda d: ({"green":0,"amber":1,"red":2}[d["verdict"]["level"]],-d["metrics"]["both_hours"],d["metrics"]["longest_dark_h"]))
    assert sweep["top"] == [d["date"] for d in expected[:5]]
    tile=read("terrain-tile.ok.json")
    raw=base64.b64decode(tile["heights_m_b64"],validate=True)
    assert len(raw)==tile["width"]*tile["height"]*4
    values=struct.unpack("<%df" % (len(raw)//4),raw)
    assert all(math.isfinite(v) for v in values)
    assert round(min(values),1)==tile["min_m"] and round(max(values),1)==tile["max_m"]
    # Reproducibility checked in isolated scratch, never overwrite active fixtures.
    with tempfile.TemporaryDirectory() as temp:
        script=Path(temp)/"scripts"/"make_fixtures.py"
        script.parent.mkdir()
        script.write_bytes((ROOT/"scripts/make_fixtures.py").read_bytes())
        subprocess.run([sys.executable,str(script)],check=True,capture_output=True)
        for path in paths:
            assert path.read_bytes()==(Path(temp)/"fixtures"/path.name).read_bytes(), path.name
    print("PASS 15 Azelux fixtures: labels, grids, geometry/visibility, interpolated windows, gaps, deltas, sweep, tile and reproducibility")

if __name__ == "__main__":
    validate()
