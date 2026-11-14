import { ApiError } from "./errors";
import { apiErrorBodySchema } from "./schemas";
import type { ApiRequest, Transport } from "./transport";

function buildUrl(base: string, req: ApiRequest): string {
  const url = base.replace(/\/+$/, "") + req.path;
  if (!req.query) return url;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(req.query)) params.set(key, String(value));
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

export function createHttpTransport(baseUrl: string): Transport {
  return {
    async send(req) {
      const controller = new AbortController();
      let timedOut = false;
      const timer = setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, req.timeoutMs);

      try {
        let response: Response;
        try {
          response = await fetch(buildUrl(baseUrl, req), {
            method: req.method,
            headers: req.body === undefined ? undefined : { "Content-Type": "application/json" },
            body: req.body === undefined ? undefined : JSON.stringify(req.body),
            signal: controller.signal,
          });
        } catch (cause) {
          if (timedOut) throw ApiError.client("TIMEOUT", `The request timed out after ${req.timeoutMs / 1000} s.`);
          throw ApiError.client("NETWORK", cause instanceof Error ? cause.message : "Network request failed.");
        }

        let payload: unknown;
        try {
          payload = await response.json();
        } catch {
          throw ApiError.client("BAD_RESPONSE", `Response was not valid JSON (HTTP ${response.status}).`, response.status);
        }

        if (!response.ok) {
          const parsed = apiErrorBodySchema.safeParse(payload);
          if (parsed.success) throw ApiError.fromBody(parsed.data, response.status);
          throw ApiError.client("BAD_RESPONSE", `Unexpected error response (HTTP ${response.status}).`, response.status);
        }
        return payload;
      } finally {
        clearTimeout(timer);
      }
    },
  };
}
