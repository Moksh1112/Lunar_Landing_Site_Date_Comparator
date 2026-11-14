import { describe, expect, it } from "vitest";
import compareOk from "../../../../../fixtures/compare.ok.json";
import type { CompareResponse, Metrics, Thresholds } from "../../../api/types";
import { computeVerdict, sameThresholds } from "../verdict";
import { absoluteTime, countdown, countdownText, momentAt } from "../moment";

const T: Thresholds = { sun_pct_min: 50, earth_pct_min: 50, dark_gap_h_max: 48, blackout_h_max: 72 };
const base: Metrics = {
  sun_el_max_deg: 2, sun_el_mean_up_deg: 1, sun_hours: 400, sun_pct: 60, earth_hours: 400, earth_pct: 60,
  both_hours: 300, both_pct: 42, longest_dark_h: 30, longest_blackout_h: 40,
};
const m = (p: Partial<Metrics>): Metrics => ({ ...base, ...p });

// TRD 5.3 cases including Python/TypeScript boundary parity.
describe("computeVerdict (TRD 5.3)", () => {
  const cases: [string, Metrics, "green" | "amber" | "red", (keyof Thresholds)[]][] = [
    ["all pass", m({}), "green", []],
    ["exact boundaries pass", m({ sun_pct: 50, earth_pct: 50, longest_dark_h: 48, longest_blackout_h: 72 }), "green", []],
    ["sun just below, within 20%", m({ sun_pct: 40 }), "amber", ["sun_pct_min"]],
    ["sun below 80% of min", m({ sun_pct: 39.9 }), "red", ["sun_pct_min"]],
    // Inclusive amber boundary agrees with the backend despite binary float error.
    ["dark gap exactly at 1.2x max", m({ longest_dark_h: 57.6 }), "amber", ["dark_gap_h_max"]],
    ["gap beyond tolerance", m({ longest_dark_h: 57.6 + 1e-7 }), "red", ["dark_gap_h_max"]],
    ["minimum within tolerance", m({ sun_pct: 50 - 5e-10 }), "green", []],
    ["minimum outside tolerance", m({ sun_pct: 50 - 1e-7 }), "amber", ["sun_pct_min"]],
    ["blackout above 1.2x max", m({ longest_blackout_h: 86.5 }), "red", ["blackout_h_max"]],
    ["two near misses", m({ earth_pct: 45, longest_dark_h: 50 }), "amber", ["earth_pct_min", "dark_gap_h_max"]],
    ["one near one far", m({ earth_pct: 45, longest_blackout_h: 200 }), "red", ["earth_pct_min", "blackout_h_max"]],
  ];
  for (const [name, metrics, level, failed] of cases)
    it(name, () => expect(computeVerdict(metrics, T)).toEqual({ level, failed }));

  it("matches the fixture verdicts for the thresholds sent", () => {
    for (const s of (compareOk as unknown as CompareResponse).scenarios)
      expect(computeVerdict(s.metrics, T).level).toBe(s.verdict.level);
  });
  it("sameThresholds", () => {
    expect(sameThresholds(T, { ...T })).toBe(true);
    expect(sameThresholds(T, { ...T, sun_pct_min: 40 })).toBe(false);
  });
});

describe("countdown", () => {
  const w = (s: string, e: string, end_censored = false) => ({ start: s, end: e, hours: 0, start_censored: false, end_censored });
  const at = (iso: string) => Date.parse(iso) / 1000;
  const wins = [w("2027-01-01T00:00:00Z", "2027-01-01T10:00:00Z"), w("2027-01-02T00:00:00Z", "2027-01-03T00:00:00Z", true)];
  it("up: hours to set", () => expect(countdown(wins, at("2027-01-01T04:00:00Z"))).toEqual({ state: "up", hours: 6, censored: false }));
  it("down: hours to next rise", () => expect(countdown(wins, at("2027-01-01T12:00:00Z"))).toEqual({ state: "down", hours: 12 }));
  it("down with no later window", () => expect(countdown(wins, at("2027-01-04T00:00:00Z"))).toEqual({ state: "down", hours: null }));
  it("censored end reads as mission end", () =>
    expect(countdownText(countdown(wins, at("2027-01-02T12:00:00Z")), "Sun")).toBe("up until mission end (12.0 h)"));
  it("text", () => {
    expect(countdownText({ state: "up", hours: 6, censored: false }, "Earth")).toBe("Earthset in 6.0 h");
    expect(countdownText({ state: "down", hours: 2.5 }, "Sun")).toBe("sunrise in 2.5 h");
    expect(countdownText({ state: "down", hours: null }, "Earth")).toBe("not visible again this mission");
  });
});

describe("momentAt / absoluteTime", () => {
  const res = compareOk as unknown as CompareResponse;
  const [a] = res.scenarios;
  const t0 = a.series.t_unix[0];
  it("null scrub = mission start", () => expect(absoluteTime(a, null, "calendar")).toBe(t0));
  it("mission_day adds the offset to each start", () => expect(absoluteTime(a, 3600, "mission_day")).toBe(t0 + 3600));
  it("reads the series sample at the time", () => {
    const mo = momentAt(a, t0)!;
    expect(mo.sunEl).toBe(a.series.sun_el[0]);
    expect(mo.earthAz).toBe(a.series.earth_az[0]);
  });
});
