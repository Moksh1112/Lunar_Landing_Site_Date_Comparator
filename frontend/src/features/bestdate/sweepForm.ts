// F7 best-date form: inline validation mirroring CONTRACT /sweep and TRD 5.4
// (range up to 183 days, mission 1..8760 h, |lat| <= 89.99, lon converted to 0..360).
import type { SweepRequest, Thresholds } from "../../api/types";
import { END_LIMIT_MS, MIN_START_MS, convertLon, parseNum } from "../compare/compareForm";

export type SweepForm = {
  siteId: string | null;
  siteName: string | null;
  lat: string;
  lon: string;
  rangeStart: string; // YYYY-MM-DD
  rangeEnd: string;
  missionHours: string;
};
export type SweepErrors = Record<string, string>;

export const MAX_RANGE_DAYS = 183;
const DAY_MS = 86_400_000;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function parseDate(s: string): number | null {
  if (!DATE_RE.test(s)) return null;
  const ms = Date.parse(`${s}T00:00:00Z`);
  return Number.isFinite(ms) && new Date(ms).toISOString().slice(0, 10) === s ? ms : null;
}

/** Number of candidate landing days (inclusive). */
export const candidateDays = (startMs: number, endMs: number): number => Math.round((endMs - startMs) / DAY_MS) + 1;

export function validateSweep(f: SweepForm): SweepErrors {
  const e: SweepErrors = {};
  const lat = parseNum(f.lat);
  if (lat === null || Math.abs(lat) > 89.99) e["site.lat_deg"] = "Latitude must be a number between -89.99 and 89.99.";
  const lon = parseNum(f.lon);
  if (lon === null || convertLon(lon) === null) e["site.lon_east_deg"] = "Longitude must be from -180 to under 360 degrees east.";
  const s = parseDate(f.rangeStart);
  const end = parseDate(f.rangeEnd);
  if (s === null || s < MIN_START_MS) e["range_start"] = "Enter a start date from 1900-01-01 (YYYY-MM-DD).";
  if (end === null) e["range_end"] = "Enter an end date (YYYY-MM-DD).";
  const hours = parseNum(f.missionHours);
  if (hours === null || hours < 1 || hours > 8760) e["mission_hours"] = "Mission length must be 1 to 8,760 hours.";
  if (s !== null && end !== null) {
    if (end < s) e["range_end"] = "End date must be on or after the start date.";
    else if (end - s > MAX_RANGE_DAYS * DAY_MS) e["range_end"] = `Date range must be ${MAX_RANGE_DAYS} days or less.`;
    else if (hours !== null && end + hours * 3_600_000 > END_LIMIT_MS) e["mission_hours"] = "The last mission must end by 2149-12-31.";
  }
  return e;
}

export function buildSweepRequest(f: SweepForm, thresholds: Thresholds, height = 2): SweepRequest {
  return {
    site: {
      site_id: f.siteId,
      name: f.siteName,
      lat_deg: Number(f.lat),
      lon_east_deg: convertLon(Number(f.lon)) ?? Number(f.lon),
    },
    range_start: f.rangeStart,
    range_end: f.rangeEnd,
    mission_hours: Number(f.missionHours),
    observer_height_m: height,
    thresholds,
  };
}

/** Step label for a sweep day (C03 is open: infer from `refined` until step_minutes per day is agreed). */
export const stepLabel = (refined: boolean): string => (refined ? "refined, 10 min step" : "30 min step");
