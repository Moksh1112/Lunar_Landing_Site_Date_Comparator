import { describe, expect, it } from "vitest";
import fixture from "../../../../fixtures/compare.ok.json";
import { apiErrorBodySchema, compareResponseSchema } from "../schemas";
import { STATUS_FOR_CODE } from "../errors";

describe("v1.1 compatible additions", () => {
  it("still accepts v1.0 fixtures and validates v1.1 provenance", () => {
    expect(compareResponseSchema.parse(fixture).contract_version).toBe("1.0");
    const data = structuredClone(fixture);
    Object.assign(data, { contract_version: "1.1" });
    for (const s of data.scenarios) Object.assign(s.meta, { contract_version: "1.1", manifest_sha256: "a".repeat(64) });
    expect(compareResponseSchema.parse(data).scenarios[0].meta.manifest_sha256).toBe("a".repeat(64));
  });
  it("accepts the server rate-limit code", () => {
    expect(apiErrorBodySchema.parse({ error: { code: "RATE_LIMITED", message: "Retry later", details: [] } }).error.code).toBe("RATE_LIMITED");
    expect(STATUS_FOR_CODE.RATE_LIMITED).toBe(429);
  });
});
