// Mirrors docs/CONTRACT.md v1.0 exactly. snake_case is kept on purpose.
export type Site = { site_id: string | null; name: string | null; lat_deg: number; lon_east_deg: number };
export type Thresholds = {
  sun_pct_min: number;
  earth_pct_min: number;
  dark_gap_h_max: number;
  blackout_h_max: number;
};
export type HorizonMode = "terrain" | "terrain_coarse" | "geometric";
export type DataLabel = "REAL" | "SYNTHETIC";
export type Meta = {
  ephemeris: string;
  kernels: string[];
  horizon_mode: HorizonMode;
  dem: string | null;
  step_minutes: number;
  observer_height_m: number;
  app_version: string;
  contract_version: "1.0" | "1.1";
  manifest_sha256?: string | null;
  computed_at: string;
  data_label: DataLabel;
};
export type Window = { start: string; end: string; hours: number; start_censored: boolean; end_censored: boolean };
export type Metrics = {
  sun_el_max_deg: number;
  sun_el_mean_up_deg: number | null;
  sun_hours: number;
  sun_pct: number;
  earth_hours: number;
  earth_pct: number;
  both_hours: number;
  both_pct: number;
  longest_dark_h: number;
  longest_blackout_h: number;
};
export type MetricKey = keyof Metrics;
export type Verdict = { level: "green" | "amber" | "red"; failed: (keyof Thresholds)[] };
export type Skyline = { az_step_deg: 0.5; elev_deg: number[]; block_dist_km: number[] | null }; // 720 each
export type Bit = 0 | 1;
export type Series = {
  t_unix: number[];
  sun_az: number[];
  sun_el: number[];
  earth_az: number[];
  earth_el: number[];
  sun_vis: Bit[];
  earth_vis: Bit[];
};
export type ScenarioId = "A" | "B";
export type CompareMode = "site_vs_site" | "date_shift" | "free";

export type Health = {
  status: "ok";
  app_version: string;
  contract_version: "1.0" | "1.1";
  kernels_loaded: string[];
  dems_loaded: string[];
  mock: boolean;
};
export type SiteGroup = "apollo" | "clps" | "commercial" | "international" | "artemis_candidate" | "reference";
export type LibrarySite = {
  site_id: string;
  name: string;
  group: SiteGroup;
  lat_deg: number;
  lon_east_deg: number;
  terrain_coverage: boolean;
  source_url: string;
  source_note: string;
  verified: boolean;
};
export type SitesResponse = { sites: LibrarySite[] };

export type ScenarioRequest = {
  id: ScenarioId;
  label: string;
  site: Site;
  start_utc: string;
  mission_hours: number;
};
export type CompareRequest = {
  mode: CompareMode;
  scenarios: [ScenarioRequest, ScenarioRequest];
  step_minutes: number;
  observer_height_m: number;
  thresholds: Thresholds;
};
export type ScenarioResult = {
  id: ScenarioId;
  label: string;
  site: Site;
  meta: Meta;
  skyline: Skyline;
  series: Series;
  windows: { sun: Window[]; earth: Window[]; both: Window[] };
  metrics: Metrics;
  verdict: Verdict;
};
export type Deltas = Record<MetricKey, number | null>; // A minus B
export type CompareResponse = {
  contract_version: "1.0" | "1.1";
  scenarios: [ScenarioResult, ScenarioResult];
  deltas: Deltas;
  limitations: string[];
};

export type SweepRequest = {
  site: Site;
  range_start: string;
  range_end: string;
  mission_hours: number;
  observer_height_m: number;
  thresholds: Thresholds;
};
export type SweepDay = { step_minutes?: number | null; date: string; rank: number; refined: boolean; metrics: Metrics; verdict: Verdict };
export type SweepResponse = { contract_version: "1.0" | "1.1"; site: Site; meta: Meta; days: SweepDay[]; top: string[] };
export type SkylineResponse = { site: Site; meta: Meta; skyline: Skyline }; // no contract_version
export type TerrainTileResponse = {
  grid_bearing_offset_deg?: number | null;
  source_dem?: string | null;
  resolution_m?: number | null;
  site: Site;
  size_km: number;
  width: 256;
  height: 256;
  heights_m_b64: string;
  min_m: number;
  max_m: number;
  site_px: [number, number];
  data_label: DataLabel;
};

export type ApiErrorCode =
  "INVALID_INPUT" | "NOT_FOUND" | "NOT_IN_COVERAGE" | "RANGE_TOO_LARGE" | "UPSTREAM_UNAVAILABLE" | "INTERNAL" | "RATE_LIMITED";
export type ApiErrorBody = {
  error: { code: ApiErrorCode; message: string; details: { field: string; reason: string }[] };
};
