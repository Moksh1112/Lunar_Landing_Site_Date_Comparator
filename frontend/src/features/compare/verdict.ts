// F14 / TRD 5.3: the browser recomputes the verdict when thresholds change, without new ephemeris.
// Same rule as the backend:
//   pass = value >= min (sun_pct, earth_pct) | value <= max (longest_dark_h, longest_blackout_h)
//   near = value >= 0.8 * min                | value <= 1.2 * max
//   green if every metric passes; amber if every metric is at least near; red otherwise.
import type { Metrics, Thresholds, Verdict } from "../../api/types";

type Check = { key: keyof Thresholds; value: (m: Metrics) => number; kind: "min" | "max" };

const EPS = 1e-9; // Same boundary tolerance as backend/app/metrics/verdict.py.

const CHECKS: Check[] = [
  { key: "sun_pct_min", value: (m) => m.sun_pct, kind: "min" },
  { key: "earth_pct_min", value: (m) => m.earth_pct, kind: "min" },
  { key: "dark_gap_h_max", value: (m) => m.longest_dark_h, kind: "max" },
  { key: "blackout_h_max", value: (m) => m.longest_blackout_h, kind: "max" },
];

export function computeVerdict(metrics: Metrics, t: Thresholds): Verdict {
  const failed: (keyof Thresholds)[] = [];
  let allNear = true;
  for (const c of CHECKS) {
    const v = c.value(metrics);
    const limit = t[c.key];
    const pass = c.kind === "min" ? v >= limit - EPS : v <= limit + EPS;
    const near = c.kind === "min" ? v >= 0.8 * limit - EPS : v <= 1.2 * limit + EPS;
    if (!pass) failed.push(c.key);
    if (!pass && !near) allNear = false;
  }
  const level = failed.length === 0 ? "green" : allNear ? "amber" : "red";
  return { level, failed };
}

export const sameThresholds = (a: Thresholds, b: Thresholds): boolean =>
  a.sun_pct_min === b.sun_pct_min &&
  a.earth_pct_min === b.earth_pct_min &&
  a.dark_gap_h_max === b.dark_gap_h_max &&
  a.blackout_h_max === b.blackout_h_max;
