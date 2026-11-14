import { describe, expect, it } from "vitest";
import sitesOk from "../../../../fixtures/sites.ok.json";
import compareEmpty from "../../../../fixtures/compare.empty.json";
import type { CompareResponse, Skyline, SitesResponse } from "../../api/types";
import { skylineAt } from "../../features/compare/skyline";
import { GLOSSARY } from "../glossary";
import { findSite, safeHref } from "../SiteSource";

describe("glossary (PRD 6.4)", () => {
  it("covers every PRD term with a plain definition", () => {
    const terms = Object.values(GLOSSARY).map((g) => g.term.toLowerCase());
    for (const t of ["solar elevation", "skyline", "earthset", "libration", "dte"]) expect(terms).toContain(t);
    for (const g of Object.values(GLOSSARY)) expect(g.definition.length).toBeGreaterThan(20);
  });
  it("never implies a guaranteed link", () => expect(GLOSSARY.dte.definition).toMatch(/never a guaranteed link/));
});

describe("site coordinate source (F1)", () => {
  const sites = (sitesOk as unknown as SitesResponse).sites;
  it("finds a library site by id", () => expect(findSite(sites, sites[0].site_id)?.source_note).toBe(sites[0].source_note));
  it("returns null for custom points and unknown ids", () => {
    expect(findSite(sites, null)).toBeNull();
    expect(findSite(sites, "nope")).toBeNull();
    expect(findSite(undefined, "x")).toBeNull();
  });
  it("only links http(s) URLs", () => {
    expect(safeHref("https://example.invalid/synthetic")).toBe("https://example.invalid/synthetic");
    expect(safeHref("javascript:alert(1)")).toBeNull();
    expect(safeHref("not a url")).toBeNull();
  });
});

describe("skylineAt (Expert hover)", () => {
  const sky: Skyline = { az_step_deg: 0.5, elev_deg: Array.from({ length: 720 }, (_, i) => i / 100), block_dist_km: Array.from({ length: 720 }, () => 3) };
  it("snaps to the nearest 0.5° sample", () => expect(skylineAt(sky, 10.2)).toEqual({ az: 10, elev: 0.2, distKm: 3 }));
  it("wraps 359.9° and 360° to north", () => {
    expect(skylineAt(sky, 359.9)?.az).toBe(0);
    expect(skylineAt(sky, 360)?.az).toBe(0);
    expect(skylineAt(sky, -0.5)?.az).toBe(359.5);
  });
  it("reports no distance in geometric mode", () => {
    const geo = (compareEmpty as unknown as CompareResponse).scenarios.find((s) => s.skyline.block_dist_km === null);
    if (geo) expect(skylineAt(geo.skyline, 90)?.distKm).toBeNull();
  });
  it("handles an empty skyline", () => expect(skylineAt({ ...sky, elev_deg: [] }, 5)).toBeNull());
});
