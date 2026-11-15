import { describe, expect, it } from "vitest";
import compareOk from "../../../../../fixtures/compare.ok.json";
import compareEmpty from "../../../../../fixtures/compare.empty.json";
import type { CompareRequest, CompareResponse } from "../../../api/types";
import { buildJson } from "../../export/exportData";
import { explainGap, visibilityGaps } from "../../gap/gap";
import { BRIEF_SCHEMA, buildBriefingHtml, buildSnapshot, embedJson, esc, safeHref, validateSnapshot } from "../briefing";

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
const embedded = (html: string) => JSON.parse(html.match(/<script type="application\/json" id="azx-brief">([\s\S]*?)<\/script>/)![1]);

describe("briefing snapshot", () => {
  it("is versioned, validates, and carries the exact response, provenance and shared gap results", () => {
    const snap = buildSnapshot(res, req, now);
    expect(snap.schema).toBe(BRIEF_SCHEMA);
    expect(validateSnapshot(snap)).toBeNull();
    expect(snap.response).toEqual(res);
    expect(JSON.parse(buildJson(res, req, now)).result).toEqual(snap.response); // parity with the JSON export
    expect(snap.provenance.data_label).toBe("SYNTHETIC");
    const gA = visibilityGaps(res.scenarios[0]);
    expect(snap.gaps.A).toEqual(gA);
    if (gA.state === "gaps") expect(snap.explanations.A).toEqual(explainGap(res.scenarios[0], gA.longest));
  });
  it("rejects malformed snapshots", () => {
    expect(validateSnapshot(null)).toBe("not an object");
    expect(validateSnapshot({ schema: BRIEF_SCHEMA, version: 2 })).toMatch(/unsupported version/);
    const snap = buildSnapshot(res, req, now);
    const bad = structuredClone(snap);
    bad.response.scenarios[1].series.sun_vis = bad.response.scenarios[1].series.sun_vis.slice(1);
    expect(validateSnapshot(bad)).toMatch(/sun_vis/);
  });
  it("round-trips through the HTML file unchanged", () => {
    const html = buildBriefingHtml(res, req, now);
    expect(embedded(html)).toEqual(JSON.parse(JSON.stringify(buildSnapshot(res, req, now))));
  });
  it("works for an empty-visibility response", () => {
    const empty = compareEmpty as unknown as CompareResponse;
    expect(validateSnapshot(buildSnapshot(empty, null, now))).toBeNull();
    expect(buildBriefingHtml(empty, null, now)).toContain("SYNTHETIC");
  });
});

describe("briefing safety", () => {
  const evil = "</script><script>alert(1)</script><img src=x onerror=alert(2)>\"'& ";
  const hostile: CompareResponse = structuredClone(res);
  hostile.scenarios[0].label = evil;
  hostile.scenarios[1].site = { ...hostile.scenarios[1].site, name: evil };
  const html = buildBriefingHtml(hostile, null, now);

  it("escapes untrusted labels and names in markup", () => {
    expect(esc(evil)).not.toMatch(/[<>"']/);
    const body = html.replace(/<script type="application\/json"[\s\S]*?<\/script>/, "").replace(/<script>[\s\S]*?<\/script>/, "");
    expect(body).not.toContain("<script>alert");
    expect(body).not.toContain("<img src=x");
    expect(body).toContain("&lt;/script&gt;");
  });
  it("encodes closing-script sequences in the embedded JSON and still decodes the original text", () => {
    expect(embedJson({ x: "</script><!--" })).not.toMatch(/<\/script|<!--/);
    expect(html.match(/<\/script>/g)).toHaveLength(2); // only the two real closing tags
    expect(embedded(html).response.scenarios[0].label).toBe(evil);
  });
  it("keeps only http(s) links", () => {
    expect(safeHref("https://pgda.gsfc.nasa.gov/products/69")).toBe("https://pgda.gsfc.nasa.gov/products/69");
    expect(safeHref("javascript:alert(1)")).toBeNull();
    expect(safeHref("data:text/html,x")).toBeNull();
    expect(safeHref("not a url")).toBeNull();
  });
  it("makes no remote requests: no external src/href for scripts, styles, fonts or images, and a strict CSP", () => {
    expect(html).toContain("default-src 'none'");
    expect(html).not.toMatch(/<(script|link|img|iframe)[^>]+(src|href)=["']?https?:/i);
    expect(html).not.toMatch(/@import|url\(\s*["']?https?:/i);
    expect(html).not.toMatch(/fetch\(|XMLHttpRequest|navigator\.sendBeacon/);
  });
  it("has a readable no-script summary, tables, glossary and a white-paper print stylesheet", () => {
    for (const s of ["<h2>Summary</h2>", "Visibility windows (text equivalent of the timeline)", "<h2>Metrics</h2>", "<h2>Glossary</h2>", "@media print", "background:#fff"]) expect(html).toContain(s);
    expect(html).toMatch(/<section id="replay"[^>]*hidden/); // interactive part only appears with JavaScript
  });
});
