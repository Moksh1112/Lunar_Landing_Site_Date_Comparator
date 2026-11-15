import { describe, expect, it } from "vitest";
import compareOk from "../../../../../fixtures/compare.ok.json";
import compareEmpty from "../../../../../fixtures/compare.empty.json";
import type { CompareRequest, CompareResponse } from "../../../api/types";
import { buildCsv, buildJson, buildProvenance, dataLabelOf, exportFileName } from "../exportData";

const res = compareOk as unknown as CompareResponse;
const now = new Date("2026-11-15T10:20:30.000Z");
const req: CompareRequest = {
  mode: "site_vs_site",
  scenarios: [
    { id: "A", label: "A", site: res.scenarios[0].site, start_utc: "2027-03-01T00:00:00Z", mission_hours: 708 },
    { id: "B", label: "B", site: res.scenarios[1].site, start_utc: "2027-03-01T00:00:00Z", mission_hours: 708 },
  ],
  step_minutes: 10,
  observer_height_m: 2,
  thresholds: { sun_pct_min: 50, earth_pct_min: 50, dark_gap_h_max: 48, blackout_h_max: 72 },
};

describe("export provenance (F25)", () => {
  it("labels fixture data SYNTHETIC", () => expect(dataLabelOf(res)).toBe("SYNTHETIC"));
  it("carries sources, versions and settings", () => {
    const p = buildProvenance(res, req, now);
    expect(p.exported_at).toBe("2026-11-15T10:20:30Z");
    expect(p.scenarios[0].kernels).toEqual(res.scenarios[0].meta.kernels);
    expect(p.scenarios[0].app_version).toBe(res.scenarios[0].meta.app_version);
    expect(p.request?.thresholds.sun_pct_min).toBe(50);
    expect(p.data_manifest).toMatch(/not available/);
  });
  it("keeps 'geometric horizon only' visible", () => {
    const empty = compareEmpty as unknown as CompareResponse;
    const geo = buildProvenance(empty, null, now).scenarios.filter((s) => s.horizon_mode.startsWith("geometric"));
    for (const g of geo) expect(g.horizon_mode).toContain("geometric horizon only");
  });
});

describe("JSON export", () => {
  it("round-trips with provenance first and the full result", () => {
    const j = JSON.parse(buildJson(res, req, now));
    expect(Object.keys(j)).toEqual(["provenance", "result"]);
    expect(j.result.deltas).toEqual(res.deltas);
  });
});

describe("CSV export", () => {
  const csv = buildCsv(res, req, now);
  const lines = csv.trimEnd().split("\n");
  it("opens with the provenance block", () => {
    expect(lines[0]).toBe("# Azelux export - data label: SYNTHETIC");
    expect(csv).toContain("# deltas are A minus B");
    expect(csv).toContain(res.scenarios[0].meta.ephemeris);
  });
  it("has a metrics table with A, B and A-B", () => {
    const i = lines.indexOf("metric,A,B,A_minus_B");
    expect(i).toBeGreaterThan(0);
    expect(lines[i + 1]).toBe(`sun_el_max_deg,${res.scenarios[0].metrics.sun_el_max_deg},${res.scenarios[1].metrics.sun_el_max_deg},${res.deltas.sun_el_max_deg}`);
  });
  it("has one series row per sample for both scenarios", () => {
    const i = lines.indexOf("scenario,t_unix,utc,sun_az,sun_el,earth_az,earth_el,sun_vis,earth_vis");
    const n = res.scenarios[0].series.t_unix.length + res.scenarios[1].series.t_unix.length;
    expect(lines.length - i - 1).toBe(n);
    expect(lines[i + 1].startsWith(`A,${res.scenarios[0].series.t_unix[0]},`)).toBe(true);
  });
  it("names files by label and time", () => expect(exportFileName(res, "csv", now)).toBe("azelux-compare-synthetic-202611151020.csv"));
});

describe("CSV completeness", () => {
  it("includes the complete request and both complete skylines", () => {
    const csv = buildCsv(res, req, now);
    const lines = csv.trimEnd().split("\n");
    expect(JSON.parse(lines.find((line) => line.startsWith("# request: "))!.slice(11))).toEqual(req);
    const start = lines.indexOf("scenario,az_deg,skyline_el_deg,blocking_distance_km");
    const end = lines.indexOf("scenario,t_unix,utc,sun_az,sun_el,earth_az,earth_el,sun_vis,earth_vis");
    expect(lines.slice(start + 1, end).filter(Boolean)).toHaveLength(res.scenarios.reduce((n, s) => n + s.skyline.elev_deg.length, 0));
  });
  it("keeps multiline plan labels inside a single provenance line", () => {
    const changed = structuredClone(res);
    changed.scenarios[0].label = "First\n=1+1";
    expect(buildCsv(changed, req, now).split("\n").some((line) => line.startsWith("=1+1"))).toBe(false);
  });
});

