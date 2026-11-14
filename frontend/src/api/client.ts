import type { z } from "zod";
import { createHttpTransport } from "./httpTransport";
import {
  compareResponseSchema,
  healthSchema,
  sitesResponseSchema,
  skylineResponseSchema,
  sweepResponseSchema,
  terrainTileResponseSchema,
} from "./schemas";
import type { ApiRequest, Transport } from "./transport";
import type {
  CompareRequest,
  CompareResponse,
  Health,
  SitesResponse,
  SkylineResponse,
  SweepRequest,
  SweepResponse,
  TerrainTileResponse,
} from "./types";

const TIMEOUT_MS = 30_000;
const API_PREFIX = "/api/v1";

export const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

// The mock module (and with it the fixtures) is only imported when VITE_USE_MOCK === "true",
// so a real-mode build does not bundle fixtures.
function chooseTransport(): Transport {
  if (USE_MOCK) {
    let loaded: Promise<Transport> | null = null;
    return {
      async send(req) {
        loaded ??= import("./mockTransport").then((m) => m.createMockTransport());
        return (await loaded).send(req);
      },
    };
  }
  return createHttpTransport(import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000");
}

let transport: Transport = chooseTransport();

/** Test hook: replace the transport. */
export function setTransport(t: Transport): void {
  transport = t;
}

// Dev/test only: log a mismatch but still return the data.
function checked<T>(endpoint: string, schema: z.ZodType<T>, data: unknown): T {
  if (import.meta.env.DEV) {
    const result = schema.safeParse(data);
    if (!result.success) console.warn(`[contract mismatch] ${endpoint}`, result.error.issues);
  }
  return data as T;
}

async function call<T>(
  req: Omit<ApiRequest, "timeoutMs">,
  schema: z.ZodType<T>,
): Promise<T> {
  const data = await transport.send({ ...req, timeoutMs: TIMEOUT_MS });
  return checked(req.endpoint, schema, data);
}

export const getHealth = (): Promise<Health> =>
  call({ endpoint: "health", method: "GET", path: "/health" }, healthSchema);

export const getSites = (): Promise<SitesResponse> =>
  call({ endpoint: "sites", method: "GET", path: `${API_PREFIX}/sites` }, sitesResponseSchema);

export const postCompare = (body: CompareRequest): Promise<CompareResponse> =>
  call({ endpoint: "compare", method: "POST", path: `${API_PREFIX}/compare`, body }, compareResponseSchema);

export const postSweep = (body: SweepRequest): Promise<SweepResponse> =>
  call({ endpoint: "sweep", method: "POST", path: `${API_PREFIX}/sweep`, body }, sweepResponseSchema);

export const getSkyline = (p: {
  lat_deg: number;
  lon_east_deg: number;
  observer_height_m: number;
}): Promise<SkylineResponse> =>
  call({ endpoint: "skyline", method: "GET", path: `${API_PREFIX}/skyline`, query: p }, skylineResponseSchema);

export const getTerrainTile = (p: {
  lat_deg: number;
  lon_east_deg: number;
  size_km: number;
}): Promise<TerrainTileResponse> =>
  call(
    { endpoint: "terrain-tile", method: "GET", path: `${API_PREFIX}/terrain-tile`, query: p },
    terrainTileResponseSchema,
  );
