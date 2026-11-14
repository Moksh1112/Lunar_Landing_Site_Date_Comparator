import { z } from "zod";
import type {
  ApiErrorBody,
  Bit,
  CompareResponse,
  Deltas,
  Health,
  LibrarySite,
  Meta,
  Metrics,
  ScenarioResult,
  Series,
  Site,
  Skyline,
  SitesResponse,
  SkylineResponse,
  SweepDay,
  SweepResponse,
  TerrainTileResponse,
  Thresholds,
  Verdict,
  Window,
} from "./types";

export const siteSchema = z.object({
  site_id: z.string().nullable(),
  name: z.string().nullable(),
  lat_deg: z.number(),
  lon_east_deg: z.number(),
}) satisfies z.ZodType<Site>;

const thresholdKey = z.enum(["sun_pct_min", "earth_pct_min", "dark_gap_h_max", "blackout_h_max"]);

export const thresholdsSchema = z.object({
  sun_pct_min: z.number(),
  earth_pct_min: z.number(),
  dark_gap_h_max: z.number(),
  blackout_h_max: z.number(),
}) satisfies z.ZodType<Thresholds>;

const dataLabelSchema = z.enum(["REAL", "SYNTHETIC"]);

export const metaSchema = z.object({
  ephemeris: z.string(),
  kernels: z.array(z.string()),
  horizon_mode: z.enum(["terrain", "terrain_coarse", "geometric"]),
  dem: z.string().nullable(),
  step_minutes: z.number(),
  observer_height_m: z.number(),
  app_version: z.string(),
  contract_version: z.enum(["1.0", "1.1"]),
  manifest_sha256: z.string().regex(/^[0-9a-f]{64}$/).nullable().optional(),
  computed_at: z.string(),
  data_label: dataLabelSchema,
}) satisfies z.ZodType<Meta>;

export const windowSchema = z.object({
  start: z.string(),
  end: z.string(),
  hours: z.number(),
  start_censored: z.boolean(),
  end_censored: z.boolean(),
}) satisfies z.ZodType<Window>;

export const metricsSchema = z.object({
  sun_el_max_deg: z.number(),
  sun_el_mean_up_deg: z.number().nullable(),
  sun_hours: z.number(),
  sun_pct: z.number(),
  earth_hours: z.number(),
  earth_pct: z.number(),
  both_hours: z.number(),
  both_pct: z.number(),
  longest_dark_h: z.number(),
  longest_blackout_h: z.number(),
}) satisfies z.ZodType<Metrics>;

export const verdictSchema = z.object({
  level: z.enum(["green", "amber", "red"]),
  failed: z.array(thresholdKey),
}) satisfies z.ZodType<Verdict>;

export const skylineSchema = z.object({
  az_step_deg: z.literal(0.5),
  elev_deg: z.array(z.number()),
  block_dist_km: z.array(z.number()).nullable(),
}) satisfies z.ZodType<Skyline>;

const bitSchema = z.union([z.literal(0), z.literal(1)]) satisfies z.ZodType<Bit>;

export const seriesSchema = z.object({
  t_unix: z.array(z.number()),
  sun_az: z.array(z.number()),
  sun_el: z.array(z.number()),
  earth_az: z.array(z.number()),
  earth_el: z.array(z.number()),
  sun_vis: z.array(bitSchema),
  earth_vis: z.array(bitSchema),
}) satisfies z.ZodType<Series>;

export const healthSchema = z.object({
  status: z.literal("ok"),
  app_version: z.string(),
  contract_version: z.enum(["1.0", "1.1"]),
  kernels_loaded: z.array(z.string()),
  dems_loaded: z.array(z.string()),
  mock: z.boolean(),
}) satisfies z.ZodType<Health>;

export const librarySiteSchema = z.object({
  site_id: z.string(),
  name: z.string(),
  group: z.enum(["apollo", "clps", "commercial", "international", "artemis_candidate", "reference"]),
  lat_deg: z.number(),
  lon_east_deg: z.number(),
  terrain_coverage: z.boolean(),
  source_url: z.string(),
  source_note: z.string(),
  verified: z.boolean(),
}) satisfies z.ZodType<LibrarySite>;

export const sitesResponseSchema = z.object({
  sites: z.array(librarySiteSchema),
}) satisfies z.ZodType<SitesResponse>;

const scenarioId = z.enum(["A", "B"]);

export const scenarioResultSchema = z.object({
  id: scenarioId,
  label: z.string(),
  site: siteSchema,
  meta: metaSchema,
  skyline: skylineSchema,
  series: seriesSchema,
  windows: z.object({
    sun: z.array(windowSchema),
    earth: z.array(windowSchema),
    both: z.array(windowSchema),
  }),
  metrics: metricsSchema,
  verdict: verdictSchema,
}) satisfies z.ZodType<ScenarioResult>;

export const deltasSchema = z.object({
  sun_el_max_deg: z.number().nullable(),
  sun_el_mean_up_deg: z.number().nullable(),
  sun_hours: z.number().nullable(),
  sun_pct: z.number().nullable(),
  earth_hours: z.number().nullable(),
  earth_pct: z.number().nullable(),
  both_hours: z.number().nullable(),
  both_pct: z.number().nullable(),
  longest_dark_h: z.number().nullable(),
  longest_blackout_h: z.number().nullable(),
}) satisfies z.ZodType<Deltas>;

export const compareResponseSchema = z.object({
  contract_version: z.enum(["1.0", "1.1"]),
  scenarios: z.tuple([scenarioResultSchema, scenarioResultSchema]),
  deltas: deltasSchema,
  limitations: z.array(z.string()),
}) satisfies z.ZodType<CompareResponse>;

export const sweepDaySchema = z.object({
  step_minutes: z.number().nullable().optional(),
  date: z.string(),
  rank: z.number(),
  refined: z.boolean(),
  metrics: metricsSchema,
  verdict: verdictSchema,
}) satisfies z.ZodType<SweepDay>;

export const sweepResponseSchema = z.object({
  contract_version: z.enum(["1.0", "1.1"]),
  site: siteSchema,
  meta: metaSchema,
  days: z.array(sweepDaySchema),
  top: z.array(z.string()),
}) satisfies z.ZodType<SweepResponse>;

export const skylineResponseSchema = z.object({
  site: siteSchema,
  meta: metaSchema,
  skyline: skylineSchema,
}) satisfies z.ZodType<SkylineResponse>;

export const terrainTileResponseSchema = z.object({
  grid_bearing_offset_deg: z.number().nullable().optional(),
  source_dem: z.string().nullable().optional(),
  resolution_m: z.number().nullable().optional(),
  site: siteSchema,
  size_km: z.number(),
  width: z.literal(256),
  height: z.literal(256),
  heights_m_b64: z.string(),
  min_m: z.number(),
  max_m: z.number(),
  site_px: z.tuple([z.number(), z.number()]),
  data_label: dataLabelSchema,
}) satisfies z.ZodType<TerrainTileResponse>;

export const apiErrorBodySchema = z.object({
  error: z.object({
    code: z.enum([
      "INVALID_INPUT",
      "NOT_FOUND",
      "NOT_IN_COVERAGE",
      "RANGE_TOO_LARGE",
      "UPSTREAM_UNAVAILABLE",
      "INTERNAL", "RATE_LIMITED",
    ]),
    message: z.string(),
    details: z.array(z.object({ field: z.string(), reason: z.string() })),
  }),
}) satisfies z.ZodType<ApiErrorBody>;
