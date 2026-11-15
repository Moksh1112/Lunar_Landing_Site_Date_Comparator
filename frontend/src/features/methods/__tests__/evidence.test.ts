import { describe, expect, it } from "vitest";
import { parseEvidence, validationFiles } from "../validationEvidence";

// Parser examples live with the tests (validation/README.md), never in validation/results/.
const base = {
  schema_version: "1.0",
  check_id: "V1",
  title: "SPICE vs Horizons",
  data_label: "REAL",
  scope: "spot_check",
  review_status: "owner_reported",
  generated_at: "2026-11-15T00:00:00Z",
  producer_commit: "a".repeat(40),
  command: "python tool.py",
  sources: [{ label: "src", reference: "backend/docs/x.json", sha256: "b".repeat(64) }],
  coverage: "1 site x 6 times",
  status: "pass",
  rows: [{ case: "sun t0", metric: "azimuth", actual: 1.0, reference: 1.0, unit: "deg", abs_error: 0, tolerance: 0.05, status: "pass" }],
  limitations: ["Spot check only."],
};

describe("validation evidence parser", () => {
  it("accepts REAL owner-reported spot check", () => {
    const f = parseEvidence("v1.json", base);
    expect(f.state).toBe("ok");
    if (f.state === "ok") expect([f.evidence.scope, f.evidence.review_status, f.evidence.data_label]).toEqual(["spot_check", "owner_reported", "REAL"]);
  });
  it("accepts SYNTHETIC evidence and keeps the label", () => {
    const f = parseEvidence("s.json", { ...base, data_label: "SYNTHETIC" });
    expect(f.state === "ok" && f.evidence.data_label).toBe("SYNTHETIC");
  });
  it("accepts failed and incomplete checks with not_evaluated rows", () => {
    const row = { ...base.rows[0], actual: null, reference: null, status: "not_evaluated" };
    expect(parseEvidence("f.json", { ...base, status: "fail" }).state).toBe("ok");
    const inc = parseEvidence("i.json", { ...base, status: "incomplete", rows: [row] });
    expect(inc.state === "ok" && inc.evidence.rows[0].status).toBe("not_evaluated");
  });
  it("rejects malformed files", () => {
    expect(parseEvidence("m.json", { ...base, producer_commit: "abc" }).state).toBe("invalid");
    expect(parseEvidence("m.json", { ...base, rows: [] }).state).toBe("invalid");
    expect(parseEvidence("m.json", { ...base, extra: 1 }).state).toBe("invalid");
    expect(parseEvidence("m.json", "not json object").state).toBe("invalid");
  });
  it("reports unsupported schema versions", () => {
    const f = parseEvidence("u.json", { ...base, schema_version: "2.0" });
    expect(f.state).toBe("unsupported");
  });
  it("missing results is empty, never a pass", () => expect(validationFiles({})).toEqual([]));
  it("every committed validation/results file parses (none shown as invalid on Methods)", () => {
    const bad = validationFiles().filter((f) => f.state !== "ok").map((f) => `${f.name}: ${"reason" in f ? f.reason : ""}`);
    expect(bad).toEqual([]);
  });
});
