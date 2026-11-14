import { ApiError, STATUS_FOR_CODE } from "./errors";
import { apiErrorBodySchema } from "./schemas";
import type { ApiEndpoint, ApiRequest, Transport } from "./transport";

// Fixtures are SYNTHETIC and read in place from ../fixtures; they are never copied or edited.
// The request body is ignored on purpose: results are fixed fixtures, not computed from user input.
const registry = import.meta.glob("../../../fixtures/*.json", { import: "default" }) as Record<
  string,
  () => Promise<unknown>
>;

export type MockVariant = string; // "ok" | "empty" | "error" (a missing variant falls back to "ok")

/** `?mock=error` applies to every endpoint; `?mock=compare:error,sites:empty` targets endpoints. */
export function resolveVariant(endpoint: ApiEndpoint, search: string): MockVariant {
  const raw = new URLSearchParams(search).get("mock");
  if (!raw) return "ok";
  let global: MockVariant | null = null;
  for (const part of raw.split(",")) {
    const [key, value] = part.includes(":") ? part.split(":", 2) : [null, part];
    if (!value) continue;
    if (key === endpoint) return value;
    if (key === null) global = value;
  }
  return global ?? "ok";
}

export function fixtureKey(endpoint: ApiEndpoint, variant: MockVariant): string {
  return `../../../fixtures/${endpoint}.${variant}.json`;
}

export type MockOptions = {
  delayMs?: number;
  /** Returns the current location search string; defaults to window.location.search. */
  getSearch?: () => string;
};

export function createMockTransport(options: MockOptions = {}): Transport {
  const delayMs = options.delayMs ?? 300;
  const getSearch = options.getSearch ?? (() => globalThis.location?.search ?? "");

  return {
    async send(req: ApiRequest) {
      const variant = resolveVariant(req.endpoint, getSearch());
      let loader = registry[fixtureKey(req.endpoint, variant)];
      if (!loader) loader = registry[fixtureKey(req.endpoint, "ok")];
      if (!loader) {
        throw ApiError.client("BAD_RESPONSE", `No mock fixture for endpoint "${req.endpoint}".`);
      }
      const [payload] = await Promise.all([loader(), new Promise((r) => setTimeout(r, delayMs))]);

      const asError = apiErrorBodySchema.safeParse(payload);
      if (asError.success) {
        throw ApiError.fromBody(asError.data, STATUS_FOR_CODE[asError.data.error.code]);
      }
      return payload;
    },
  };
}
