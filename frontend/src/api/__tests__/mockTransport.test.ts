import { describe, expect, it } from "vitest";
import { ApiError, STATUS_FOR_CODE } from "../errors";
import { createMockTransport, resolveVariant } from "../mockTransport";
import type { ApiEndpoint } from "../transport";

const req = (endpoint: ApiEndpoint) => ({
  endpoint,
  method: "GET" as const,
  path: `/${endpoint}`,
  timeoutMs: 1000,
});
const mock = (search: string) => createMockTransport({ delayMs: 0, getSearch: () => search });

describe("resolveVariant", () => {
  it("defaults to ok", () => expect(resolveVariant("sites", "")).toBe("ok"));
  it("applies a bare variant to every endpoint", () => expect(resolveVariant("sites", "?mock=error")).toBe("error"));
  it("targets one endpoint", () => {
    const q = "?mock=compare:error,sites:empty";
    expect(resolveVariant("compare", q)).toBe("error");
    expect(resolveVariant("sites", q)).toBe("empty");
    expect(resolveVariant("health", q)).toBe("ok");
  });
});

describe("mock transport", () => {
  it("serves ok fixtures", async () => {
    const data = (await mock("").send(req("sites"))) as { sites: unknown[] };
    expect(data.sites).toHaveLength(3);
  });

  it("falls back to ok when a variant is missing", async () => {
    const data = (await mock("?mock=empty").send(req("health"))) as { status: string };
    expect(data.status).toBe("ok");
  });

  const errorCases: [ApiEndpoint, string][] = [
    ["health", "INTERNAL"],
    ["sites", "INTERNAL"],
    ["compare", "INVALID_INPUT"],
    ["sweep", "RANGE_TOO_LARGE"],
    ["skyline", "NOT_IN_COVERAGE"],
    ["terrain-tile", "NOT_IN_COVERAGE"],
  ];
  for (const [endpoint, code] of errorCases) {
    it(`${endpoint}.error becomes ApiError ${code}`, async () => {
      const err = await mock("?mock=error")
        .send(req(endpoint))
        .catch((e: unknown) => e);
      expect(err).toBeInstanceOf(ApiError);
      const apiErr = err as ApiError;
      expect(apiErr.code).toBe(code);
      expect(apiErr.status).toBe(STATUS_FOR_CODE[code as keyof typeof STATUS_FOR_CODE]);
      expect(apiErr.origin).toBe("api");
    });
  }
});
