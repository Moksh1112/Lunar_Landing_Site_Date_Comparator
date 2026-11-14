import { describe, expect, it } from "vitest";
import { buildRequest, convertLon, linkScenarios, validate, type CompareForm, type ScenarioForm } from "../compareForm";

const sc = (o: Partial<ScenarioForm> = {}): ScenarioForm => ({
  label: "Plan", siteId: null, siteName: null, lat: "-89.5", lon: "0", startUtc: "2026-03-01T00:00", missionHours: "708", ...o,
});
const form = (a: Partial<ScenarioForm> = {}, b: Partial<ScenarioForm> = {}): CompareForm => ({
  mode: "free",
  scenarios: [sc(a), sc(b)],
  thresholds: { sun_pct_min: 50, earth_pct_min: 50, dark_gap_h_max: 48, blackout_h_max: 72 },
});

describe("validate", () => {
  it("accepts the starter example", () => expect(validate(form())).toEqual({}));
  it("rejects poles and out-of-range latitude", () => {
    expect(validate(form({ lat: "-90" }))["scenarios[0].site.lat_deg"]).toMatch(/89.99/);
    expect(validate(form({}, { lat: "89.995" }))["scenarios[1].site.lat_deg"]).toBeDefined();
    expect(validate(form({ lat: "91" }))["scenarios[0].site.lat_deg"]).toMatch(/-90 and 90/);
    expect(validate(form({ lat: "-89.99" }))["scenarios[0].site.lat_deg"]).toBeUndefined();
  });
  it("validates longitude, start and mission length", () => {
    expect(validate(form({ lon: "360" }))["scenarios[0].site.lon_east_deg"]).toBeDefined();
    expect(validate(form({ lon: "-181" }))["scenarios[0].site.lon_east_deg"]).toBeDefined();
    expect(validate(form({ lon: "-90" }))["scenarios[0].site.lon_east_deg"]).toBeUndefined();
    expect(validate(form({ startUtc: "1899-12-31T23:59" }))["scenarios[0].start_utc"]).toBeDefined();
    expect(validate(form({ startUtc: "2026-02-30T00:00" }))["scenarios[0].start_utc"]).toBeDefined();
    expect(validate(form({ missionHours: "0" }))["scenarios[0].mission_hours"]).toBeDefined();
    expect(validate(form({ missionHours: "8761" }))["scenarios[0].mission_hours"]).toBeDefined();
  });
  it("applies the 60,000 sample cap at step 15 exactly", () => {
    expect(validate(form({ missionHours: "8760" }, { missionHours: "6239.5" }), 15)["request"]).toBeUndefined();
    expect(validate(form({ missionHours: "8760" }, { missionHours: "6239.75" }), 15)["request"]).toMatch(/60001/);
  });
  it("accepts 8760 h + 708 h at 10 min and rejects 2 x 8760 h", () => {
    expect(validate(form({ missionHours: "8760" }, { missionHours: "708" }))["request"]).toBeUndefined();
    expect(validate(form({ missionHours: "8760" }, { missionHours: "8760" }))["request"]).toBeDefined();
  });
});

describe("buildRequest", () => {
  it("converts longitude and formats start with Z", () => {
    const r = buildRequest(form({ lon: "-90" }));
    expect(r.scenarios[0].site.lon_east_deg).toBe(270);
    expect(r.scenarios[0].start_utc).toBe("2026-03-01T00:00:00Z");
    expect(r.step_minutes).toBe(10);
    expect(r.observer_height_m).toBe(2);
    expect(r.scenarios[1].id).toBe("B");
  });
  it("keeps seconds when present and honours step and height", () => {
    const r = buildRequest(form({ startUtc: "2026-03-01T01:02:03", missionHours: "24" }), 15, 3);
    expect(r.scenarios[0].start_utc).toBe("2026-03-01T01:02:03Z");
    expect(r.scenarios[0].mission_hours).toBe(24);
    expect(r.step_minutes).toBe(15);
    expect(r.observer_height_m).toBe(3);
  });
});

describe("convertLon / linkScenarios", () => {
  it("converts", () => {
    expect(convertLon(-180)).toBe(180);
    expect(convertLon(0)).toBe(0);
    expect(convertLon(360)).toBeNull();
  });
  it("links per preset", () => {
    const a = sc({ startUtc: "2027-01-01T00:00", lat: "-85" });
    const b = sc({ lat: "-80" });
    expect(linkScenarios("site_vs_site", a, b)).toMatchObject({ startUtc: "2027-01-01T00:00", lat: "-80" });
    expect(linkScenarios("date_shift", a, b)).toMatchObject({ startUtc: "2026-03-01T00:00", lat: "-85" });
    expect(linkScenarios("free", a, b)).toBe(b);
  });
});
