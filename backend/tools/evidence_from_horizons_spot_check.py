"""Adapt the owner's S1 Horizons spot check into validation evidence v1.0 (validation/README.md).

    python backend/tools/evidence_from_horizons_spot_check.py \
        --src backend/docs/horizons_spot_check_S1.json \
        --out validation/results/V1-horizons-spot-check-S1.json

Pure format adapter: it recomputes nothing and adds no science. Scope stays `spot_check`
(1 site x 6 times, not the full V1 plan of 3 sites x 48 hourly times) and review stays
`owner_reported`. Status is taken from the source's own per-row differences against the
PRD 8.3 V1 target (0.05 deg). The producer commit is the commit that added the source file.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

V1_TOLERANCE_DEG = 0.05  # PRD 8.3 V1 pass target (ASSUMED there; tighten if achieved)
SOURCE_COMMIT = "0856c1416b40c194a22f4452a65e3ff4fbb67e2d"  # published current source values
COMMAND = (
    "python backend/tools/evidence_from_horizons_spot_check.py "
    "--src backend/docs/horizons_spot_check_S1.json --out validation/results/V1-horizons-spot-check-S1.json"
)


def _row(case: str, metric: str, ours: float, ref: float, diff: float) -> dict:
    err = abs(float(diff))
    return {
        "case": case,
        "metric": metric,
        "actual": float(ours),
        "reference": float(ref),
        "unit": "deg",
        "abs_error": err,
        "tolerance": V1_TOLERANCE_DEG,
        "status": "pass" if err <= V1_TOLERANCE_DEG else "fail",
    }


def adapt(src: dict, src_rel: str, src_sha256: str, generated_at: str) -> dict:
    rows: list[dict] = []
    for r in src["rows"]:
        case = f"{r['body']} {r['time_utc']} UTC"
        rows.append(_row(case, f"{r['body']} azimuth", r["ours_az"], r["horizons_az"], r["d_az_deg"]))
        rows.append(_row(case, f"{r['body']} elevation", r["ours_el"], r["horizons_el"], r["d_el_deg"]))
    if not rows:
        raise ValueError("source has no rows")
    site = src["site"]
    return {
        "schema_version": "1.0",
        "check_id": "V1",
        "title": "SPICE vs JPL Horizons azimuth/elevation (S1 spot check)",
        "data_label": "REAL",
        "scope": "spot_check",
        "review_status": "owner_reported",
        "generated_at": generated_at,
        "producer_commit": SOURCE_COMMIT,
        "command": f"{COMMAND} --generated-at {generated_at}",
        "sources": [
            {"label": "Owner spot-check output (P2, S1)", "reference": src_rel, "sha256": src_sha256},
            {"label": "Our ephemeris", "reference": src["ours"]},
            {"label": "Reference", "reference": src["horizons"]},
        ],
        "coverage": (
            f"1 site (lat {site['lat_deg']}, lon_east {site['lon_east_deg']}), {src['times']} times over "
            f"{src['days']} days from {src['start_utc']}, Sun and Earth. Full V1 needs 3 sites x 48 hourly times."
        ),
        "status": "pass" if all(r["status"] == "pass" for r in rows) else "fail",
        "rows": rows,
        "limitations": [
            "Spot check only; not the full V1 plan.",
            "Owner-reported; not independently reproduced.",
            "The original producer command line is not recorded in the source file.",
            src.get("note_precision", ""),
        ],
    }


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--generated-at", required=True, help="UTC timestamp YYYY-MM-DDTHH:MM:SSZ")
    a = ap.parse_args()
    raw = Path(a.src).read_bytes()
    out = adapt(json.loads(raw), a.src.replace("\\", "/"), hashlib.sha256(raw).hexdigest(), a.generated_at)
    out["limitations"] = [x for x in out["limitations"] if x]
    Path(a.out).parent.mkdir(parents=True, exist_ok=True)
    Path(a.out).write_text(json.dumps(out, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
