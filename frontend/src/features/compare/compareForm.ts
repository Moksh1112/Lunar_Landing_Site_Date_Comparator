// Pure form logic for the Compare page: validation mirrors backend limits (FRONTEND_HANDOFF.md), no React.
import type { CompareMode, CompareRequest, ScenarioRequest, ScenarioResult, Thresholds } from "../../api/types";

export type ScenarioForm = {
  label: string;
  siteId: string | null;
  siteName: string | null;
  lat: string;
  lon: string;
  /** datetime-local value (YYYY-MM-DDTHH:MM), interpreted as UTC. */
  startUtc: string;
  missionHours: string;
};
export type CompareForm = { mode: CompareMode; scenarios: [ScenarioForm, ScenarioForm]; thresholds: Thresholds };
/** Keys use the backend field path, e.g. "scenarios[1].site.lat_deg"; "request" is a whole-request error. */
export type FieldErrors = Record<string, string>;

export const MAX_SAMPLES = 60000;
export const MIN_START_MS = Date.UTC(1900, 0, 1);
export const END_LIMIT_MS = Date.UTC(2150, 0, 1); // exclusive: mission must end by 2149-12-31
const START_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;

const FIELD_PATH = { lat: "site.lat_deg", lon: "site.lon_east_deg", start: "start_utc", hours: "mission_hours" } as const;
export const fieldKey = (i: 0 | 1, f: keyof typeof FIELD_PATH): string => `scenarios[${i}].${FIELD_PATH[f]}`;

/** Parse a decimal string strictly (no empty, no NaN). */
export function parseNum(s: string): number | null {
  if (s.trim() === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** Longitude accepted as -180..180 or 0..<360; returns east-positive 0..<360, or null if out of range. */
export function convertLon(lon: number): number | null {
  if (lon >= 0 && lon < 360) return lon;
  if (lon >= -180 && lon < 0) return lon + 360;
  return null;
}

/** Human note when an entered longitude is converted, else null. */
export function lonNote(s: string): string | null {
  const n = parseNum(s);
  if (n === null || n >= 0) return null;
  const c = convertLon(n);
  return c === null ? null : `Sent as ${c} deg east`;
}

/** Normalise a datetime-local value to YYYY-MM-DDTHH:MM:SSZ and epoch ms; null if malformed or not a real date. */
export function parseStartUtc(s: string): { iso: string; ms: number } | null {
  const m = START_RE.exec(s.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const h = Number(m[4]);
  const mi = Number(m[5]);
  const se = Number(m[6] ?? "0");
  const ms = Date.UTC(y, mo - 1, d, h, mi, se);
  const dt = new Date(ms);
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d || h > 23 || mi > 59 || se > 59)
    return null;
  return { iso: `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${String(se).padStart(2, "0")}Z`, ms };
}

export const sampleCount = (hours: number, stepMin: number): number => Math.ceil((hours * 60) / stepMin) + 1;

export function validate(form: CompareForm, step = 10): FieldErrors {
  const errors: FieldErrors = {};
  let total = 0;
  let totalKnown = true;
  form.scenarios.forEach((sc, idx) => {
    const i = idx as 0 | 1;
    const tag = i === 0 ? "A" : "B";
    const lat = parseNum(sc.lat);
    if (lat === null) errors[fieldKey(i, "lat")] = `Plan ${tag}: enter a latitude in degrees.`;
    else if (lat < -90 || lat > 90) errors[fieldKey(i, "lat")] = `Plan ${tag}: latitude must be between -90 and 90.`;
    else if (Math.abs(lat) > 89.99)
      errors[fieldKey(i, "lat")] = `Plan ${tag}: latitude must be at most 89.99 degrees from the equator (not exactly at a pole).`;
    const lon = parseNum(sc.lon);
    if (lon === null) errors[fieldKey(i, "lon")] = `Plan ${tag}: enter a longitude in degrees east.`;
    else if (convertLon(lon) === null)
      errors[fieldKey(i, "lon")] = `Plan ${tag}: longitude must be 0 up to (not including) 360, or -180 to 180.`;
    const start = parseStartUtc(sc.startUtc);
    const hours = parseNum(sc.missionHours);
    if (!start) errors[fieldKey(i, "start")] = `Plan ${tag}: enter a valid UTC start date and time.`;
    else if (start.ms < MIN_START_MS || start.ms >= END_LIMIT_MS)
      errors[fieldKey(i, "start")] = `Plan ${tag}: start must be between 1900-01-01 and 2149-12-31 UTC.`;
    if (hours === null || hours < 1 || hours > 8760) {
      errors[fieldKey(i, "hours")] = `Plan ${tag}: mission length must be between 1 and 8760 hours.`;
      totalKnown = false;
    } else {
      total += sampleCount(hours, step);
      if (start && !errors[fieldKey(i, "start")] && start.ms + hours * 3600000 >= END_LIMIT_MS)
        errors[fieldKey(i, "hours")] = `Plan ${tag}: the mission must end by 2149-12-31 UTC.`;
    }
  });
  if (totalKnown && total > MAX_SAMPLES)
    errors["request"] = `Too many time samples (${total}; the limit is ${MAX_SAMPLES}). Shorten one or both missions.`;
  return errors;
}

/** Build the API request. Call only when validate() returned no errors. */
export function buildRequest(form: CompareForm, step = 10, height = 2): CompareRequest {
  const mk = (sc: ScenarioForm, id: "A" | "B"): ScenarioRequest => {
    const start = parseStartUtc(sc.startUtc);
    const lat = parseNum(sc.lat);
    const lon = parseNum(sc.lon);
    if (!start || lat === null || lon === null) throw new Error("buildRequest called with an invalid form");
    return {
      id,
      label: sc.label.trim() || `Plan ${id}`,
      site: { site_id: sc.siteId, name: sc.siteName, lat_deg: lat, lon_east_deg: convertLon(lon) ?? lon },
      start_utc: start.iso,
      mission_hours: Number(sc.missionHours),
    };
  };
  return {
    mode: form.mode,
    scenarios: [mk(form.scenarios[0], "A"), mk(form.scenarios[1], "B")],
    step_minutes: step,
    observer_height_m: height,
    thresholds: form.thresholds,
  };
}

/** Preset linking (TRD 7.2): returns B updated so it stays consistent with A for the mode. */
export function linkScenarios(mode: CompareMode, a: ScenarioForm, b: ScenarioForm): ScenarioForm {
  if (mode === "site_vs_site") return { ...b, startUtc: a.startUtc };
  if (mode === "date_shift") return { ...b, siteId: a.siteId, siteName: a.siteName, lat: a.lat, lon: a.lon };
  return b;
}

/** Shared vertical range (deg) for both panoramas: skylines and Sun/Earth paths, at least -2..10. */
export function sharedYRange(scenarios: ScenarioResult[]): { yMin: number; yMax: number } {
  let lo = -2;
  let hi = 10;
  for (const s of scenarios) {
    for (const arr of [s.skyline.elev_deg, s.series.sun_el, s.series.earth_el]) {
      for (const v of arr) {
        if (v < lo) lo = v;
        if (v > hi) hi = v;
      }
    }
  }
  return { yMin: Math.floor(lo), yMax: Math.ceil(hi) };
}
