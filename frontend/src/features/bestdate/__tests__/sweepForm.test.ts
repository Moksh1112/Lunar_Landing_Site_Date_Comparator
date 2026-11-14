import { describe, expect, it } from "vitest";
import { validationFiles } from "../../methods/validationEvidence";
import { buildSweepRequest, candidateDays, parseDate, stepLabel, validateSweep, type SweepForm } from "../sweepForm";

const ok: SweepForm = { siteId: null, siteName: null, lat: "-85.5", lon: "30", rangeStart: "2027-03-01", rangeEnd: "2027-03-14", missionHours: "708" };
const T = { sun_pct_min: 50, earth_pct_min: 50, dark_gap_h_max: 48, blackout_h_max: 72 };

describe("validateSweep (F7)", () => {
  it("accepts a valid form", () => expect(validateSweep(ok)).toEqual({}));
  it("rejects lat beyond 89.99", () => expect(validateSweep({ ...ok, lat: "-90" })).toHaveProperty("site.lat_deg"));
  it("rejects bad lon", () => expect(validateSweep({ ...ok, lon: "400" })).toHaveProperty("site.lon_east_deg"));
  it("rejects end before start", () => expect(validateSweep({ ...ok, rangeEnd: "2027-02-28" })["range_end"]).toMatch(/on or after/));
  it("allows exactly 183 days, rejects 184", () => {
    expect(validateSweep({ ...ok, rangeEnd: "2027-08-31" })).toEqual({}); // 183 days after 03-01
    expect(validateSweep({ ...ok, rangeEnd: "2027-09-01" })["range_end"]).toMatch(/183 days/);
  });
  it("rejects impossible dates", () => expect(validateSweep({ ...ok, rangeStart: "2027-02-30" })).toHaveProperty("range_start"));
  it("mission 1..8760 h", () => {
    expect(validateSweep({ ...ok, missionHours: "0.5" })).toHaveProperty("mission_hours");
    expect(validateSweep({ ...ok, missionHours: "8761" })).toHaveProperty("mission_hours");
    expect(validateSweep({ ...ok, missionHours: "8760" })).toEqual({});
  });
  it("mission must end by 2149-12-31", () =>
    expect(validateSweep({ ...ok, rangeStart: "2149-12-01", rangeEnd: "2149-12-31", missionHours: "48" })).toHaveProperty("mission_hours"));
});

describe("sweep request", () => {
  it("converts negative longitude and keeps contract fields only", () => {
    const r = buildSweepRequest({ ...ok, lon: "-90" }, T);
    expect(r).toEqual({
      site: { site_id: null, name: null, lat_deg: -85.5, lon_east_deg: 270 },
      range_start: "2027-03-01", range_end: "2027-03-14", mission_hours: 708, observer_height_m: 2, thresholds: T,
    });
  });
  it("counts candidate days inclusively", () => expect(candidateDays(parseDate("2027-03-01")!, parseDate("2027-03-14")!)).toBe(14));
  it("labels the step", () => {
    expect(stepLabel(true)).toBe("refined, 10 min step");
    expect(stepLabel(false)).toBe("30 min step");
  });
});

describe("validation evidence (F22/F23)", () => {
  it("is empty when nothing is committed", () => expect(validationFiles({})).toEqual([]));
  it("lists files by name, sorted", () =>
    expect(validationFiles({ "/x/validation/results/v2.json": {}, "/x/validation/results/v1.json": {} }).map((f) => f.name)).toEqual(["v1.json", "v2.json"]));
});
