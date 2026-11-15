import { describe, expect, it } from "vitest";
import type { HorizonMode, ScenarioResult, Window } from "../../../api/types";
import { compareLongest, defaultFocus, explainGap, readingAt, scrubValue, visibilityGaps } from "../gap";

const T0 = Date.UTC(2027, 2, 1) / 1000;
const H = 3600;
const iso = (h: number) => new Date((T0 + h * H) * 1000).toISOString().replace(/\.\d{3}Z$/, "Z");
const w = (a: number, b: number, sc = false, ec = false): Window => ({ start: iso(a), end: iso(b), hours: b - a, start_censored: sc, end_censored: ec });

function scenario(id: "A" | "B", hours: number, win: { sun: Window[]; earth: Window[]; both: Window[] }, mode: HorizonMode = "terrain"): ScenarioResult {
  const n = hours + 1;
  const t = Array.from({ length: n }, (_, i) => T0 + i * H);
  return {
    id,
    label: `Plan ${id} <script>`,
    site: { site_id: null, name: "x", lat_deg: -85, lon_east_deg: 30 },
    meta: { ephemeris: "SPICE DE440", kernels: [], horizon_mode: mode, dem: null, step_minutes: 60, observer_height_m: 2, app_version: "t", contract_version: "1.1", computed_at: iso(0), data_label: "SYNTHETIC" },
    skyline: { az_step_deg: 0.5, elev_deg: Array.from({ length: 720 }, () => 1.5), block_dist_km: null },
    series: { t_unix: t, sun_az: t.map(() => 90), sun_el: t.map(() => 0.5), earth_az: t.map(() => 0), earth_el: t.map(() => 3), sun_vis: t.map(() => 0), earth_vis: t.map(() => 1) },
    windows: win,
    metrics: { sun_el_max_deg: 0, sun_el_mean_up_deg: null, sun_hours: 0, sun_pct: 0, earth_hours: 0, earth_pct: 0, both_hours: 0, both_pct: 0, longest_dark_h: 0, longest_blackout_h: 0 },
    verdict: { level: "red", failed: [] },
  };
}

describe("visibilityGaps", () => {
  it("reports no gap when both are visible for the whole sampled mission", () => {
    const s = scenario("A", 24, { sun: [w(0, 24, true, true)], earth: [w(0, 24, true, true)], both: [w(0, 24, true, true)] });
    expect(visibilityGaps(s)).toEqual({ state: "none", missionHours: 24 });
  });
  it("reports a whole-mission gap with zero simultaneous visibility", () => {
    const r = visibilityGaps(scenario("A", 24, { sun: [], earth: [w(0, 24, true, true)], both: [] }));
    expect(r.state).toBe("gaps");
    if (r.state !== "gaps") return;
    expect(r.longest).toMatchObject({ hours: 24, wholeMission: true, startCensored: true, endCensored: true });
  });
  it("finds the longest of multiple gaps, includes edge gaps, and keeps the earliest of ties", () => {
    const both = [w(2, 5), w(9, 12), w(16, 20)]; // gaps: 0-2 (edge), 5-9 (4 h), 12-16 (4 h), 20-24 (edge 4 h)
    const r = visibilityGaps(scenario("A", 24, { sun: both, earth: both, both }));
    if (r.state !== "gaps") throw new Error("expected gaps");
    expect(r.all.map((g) => [g.offsetStart / H, g.offsetEnd / H])).toEqual([[0, 2], [5, 9], [12, 16], [20, 24]]);
    expect(r.longest.offsetStart / H).toBe(5);
    expect(r.all[0].startCensored).toBe(true);
    expect(r.all[3].endCensored).toBe(true);
    expect(r.all[1].startCensored || r.all[1].endCensored).toBe(false);
  });
  it("is unavailable without samples or with unreadable windows, never a fabricated gap", () => {
    const s = scenario("A", 24, { sun: [], earth: [], both: [] });
    expect(visibilityGaps({ ...s, series: { ...s.series, t_unix: [T0] } }).state).toBe("unavailable");
    expect(visibilityGaps({ ...s, windows: { ...s.windows, both: [{ ...w(1, 2), start: "nope" }] } }).state).toBe("unavailable");
  });
  it("uses each plan's own mission span for different dates and lengths", () => {
    const b = scenario("B", 48, { sun: [], earth: [], both: [w(10, 20)] });
    const r = visibilityGaps(b);
    if (r.state !== "gaps") throw new Error("expected gaps");
    expect(r.missionHours).toBe(48);
    expect(r.longest).toMatchObject({ hours: 28, endCensored: true });
  });
});

describe("explainGap", () => {
  it("names the Sun when only the Sun is below the horizon", () => {
    const s = scenario("A", 24, { sun: [w(0, 4, true), w(10, 24, false, true)], earth: [w(0, 24, true, true)], both: [w(0, 4, true), w(10, 24, false, true)] });
    const r = visibilityGaps(s);
    if (r.state !== "gaps") throw new Error();
    const e = explainGap(s, r.longest);
    expect(e.parts).toHaveLength(1);
    expect(e.parts[0].cause).toBe("sun");
    expect(e.summary).toContain("the Sun is below the computed terrain skyline while Earth remains above it");
    expect(e.summary).toContain("2027-03-01 04:00 UTC");
  });
  it("names Earth when only Earth is below the horizon", () => {
    const s = scenario("A", 24, { sun: [w(0, 24, true, true)], earth: [w(0, 6, true)], both: [w(0, 6, true)] });
    const r = visibilityGaps(s);
    if (r.state !== "gaps") throw new Error();
    expect(explainGap(s, r.longest).parts.map((p) => p.cause)).toEqual(["earth"]);
  });
  it("splits at actual visibility changes when the cause changes inside the gap", () => {
    // gap 4-20: sun down 4-12, earth down 10-20 -> sun (4-10), both (10-12), earth (12-20)
    const s = scenario("A", 24, { sun: [w(0, 4, true), w(12, 24, false, true)], earth: [w(0, 10, true), w(20, 24, false, true)], both: [w(0, 4, true), w(20, 24, false, true)] });
    const r = visibilityGaps(s);
    if (r.state !== "gaps") throw new Error();
    const e = explainGap(s, r.longest);
    expect(e.parts.map((p) => [p.cause, p.hours])).toEqual([["sun", 6], ["both", 2], ["earth", 8]]);
    expect(e.events.map((x) => x.kind)).toEqual(["gap-start", "earth-set", "sun-rise", "gap-end"]);
    expect(e.summary).toBe(
      "This gap has 3 parts, measured against the computed terrain skyline. Time by cause: only the Sun below 6.0 h; only Earth below 8.0 h; both below 2.0 h.",
    );
  });
  it("words censored boundaries and geometric mode honestly", () => {
    const s = scenario("A", 24, { sun: [], earth: [w(0, 24, true, true)], both: [] }, "geometric");
    const r = visibilityGaps(s);
    if (r.state !== "gaps") throw new Error();
    const e = explainGap(s, r.longest);
    expect(e.horizon).toBe("the geometric horizon (smooth sphere, no terrain)");
    expect(e.events[0].text).toBe("Mission starts without simultaneous Sun and Earth visibility.");
    expect(e.notes.join(" ")).toMatch(/may have begun earlier.*may continue afterwards.*no terrain obstruction/);
    expect(e.summary).not.toMatch(/terrain skyline|ridge/);
  });
  it("uses the coarse-terrain wording in terrain_coarse mode", () => {
    const s = scenario("A", 24, { sun: [], earth: [w(0, 24, true, true)], both: [] }, "terrain_coarse");
    const r = visibilityGaps(s);
    if (r.state !== "gaps") throw new Error();
    expect(explainGap(s, r.longest).summary).toContain("coarse-terrain skyline (160 m DEM)");
  });
});

describe("focus, comparison and readings", () => {
  const withGap = scenario("A", 24, { sun: [], earth: [], both: [w(0, 10, true)] });
  const noGap = scenario("B", 24, { sun: [w(0, 24, true, true)], earth: [w(0, 24, true, true)], both: [w(0, 24, true, true)] });
  it("focuses A's gap first, else B's, else none", () => {
    expect(defaultFocus(visibilityGaps(withGap), visibilityGaps(noGap))?.scenario).toBe("A");
    expect(defaultFocus(visibilityGaps(noGap), visibilityGaps({ ...withGap, id: "B" }))?.scenario).toBe("B");
    expect(defaultFocus(visibilityGaps(noGap), visibilityGaps(noGap))).toBeNull();
  });
  it("labels A and B and states the shorter gap only from measured values", () => {
    expect(compareLongest(visibilityGaps(withGap), visibilityGaps(noGap))).toBe(
      "Longest visibility gap: Plan A 14.0 h, Plan B 0.0 h. Plan B's longest gap is shorter by 14.0 h.",
    );
    expect(compareLongest(visibilityGaps(noGap), visibilityGaps(withGap))).toContain("Plan A's longest gap is shorter by 14.0 h");
    expect(compareLongest({ state: "unavailable", reason: "x" }, visibilityGaps(noGap))).toMatch(/cannot be compared/);
  });
  it("maps gap times to calendar and mission-relative scrubber values", () => {
    expect(scrubValue(T0 + 5 * H, T0, "calendar")).toBe(T0 + 5 * H);
    expect(scrubValue(T0 + 5 * H, T0, "mission_day")).toBe(5 * H);
  });
  it("reads az/el, visibility bits and the skyline at the body's azimuth", () => {
    const r = readingAt(withGap, T0 + 2.4 * H);
    expect(r).toMatchObject({ sampleUnix: T0 + 2 * H, sun: { az: 90, el: 0.5, skyline: 1.5, visible: false }, earth: { visible: true } });
  });
});
