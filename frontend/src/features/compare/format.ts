import type { MetricKey, Thresholds } from "../../api/types";

export const NA = "n/a";
const MINUS = "−";

export type MetricUnit = "h" | "%" | "deg";

export const METRIC_KEYS: MetricKey[] = [
  "sun_hours",
  "sun_pct",
  "earth_hours",
  "earth_pct",
  "both_hours",
  "both_pct",
  "longest_dark_h",
  "longest_blackout_h",
  "sun_el_max_deg",
  "sun_el_mean_up_deg",
];

const LABELS: Record<MetricKey, string> = {
  sun_el_max_deg: "Maximum Sun elevation",
  sun_el_mean_up_deg: "Mean Sun elevation while up",
  sun_hours: "Sunlight",
  sun_pct: "Sunlight share",
  earth_hours: "Earth visible",
  earth_pct: "Earth visible share",
  both_hours: "Sun and Earth together",
  both_pct: "Sun and Earth together share",
  longest_dark_h: "Longest dark gap",
  longest_blackout_h: "Longest Earth blackout",
};

export const metricLabel = (key: MetricKey): string => LABELS[key];

export function metricUnit(key: MetricKey): MetricUnit {
  if (key.endsWith("_pct")) return "%";
  if (key.endsWith("_deg")) return "deg";
  return "h";
}

const fixed = (n: number, dp: number): string => n.toFixed(dp);

export const formatHours = (n: number | null): string => (n === null ? NA : `${fixed(n, 1)} h`);
export const formatPct = (n: number | null): string => (n === null ? NA : `${fixed(n, 1)} %`);
export const formatDeg = (n: number | null, expert = false): string =>
  n === null ? NA : `${fixed(n, expert ? 2 : 1)}°`;

/** Signed value with unit, e.g. formatSigned(-16, "h") -> "−16.0 h". null -> "n/a". */
export function formatSigned(n: number | null, unit: string, dp = 1): string {
  if (n === null) return NA;
  const body = fixed(Math.abs(n), dp);
  const isZero = Number(body) === 0;
  const sign = isZero ? "" : n > 0 ? "+" : MINUS;
  const u = unit === "deg" ? "°" : ` ${unit}`;
  return `${sign}${body}${u}`;
}

export function formatMetric(key: MetricKey, n: number | null, expert = false): string {
  const u = metricUnit(key);
  if (u === "h") return formatHours(n);
  if (u === "%") return formatPct(n);
  return formatDeg(n, expert);
}

export function formatDeltaMetric(key: MetricKey, n: number | null, expert = false): string {
  const u = metricUnit(key);
  return formatSigned(n, u, u === "deg" && expert ? 2 : 1);
}

export function failedThresholdText(key: keyof Thresholds, thresholds?: Thresholds): string {
  switch (key) {
    case "sun_pct_min":
      return `Sunlight below ${thresholds?.sun_pct_min ?? 50} %`;
    case "earth_pct_min":
      return `Earth visible below ${thresholds?.earth_pct_min ?? 50} %`;
    case "dark_gap_h_max":
      return `Longest dark gap above ${thresholds?.dark_gap_h_max ?? 48} h`;
    case "blackout_h_max":
      return `Longest Earth blackout above ${thresholds?.blackout_h_max ?? 72} h`;
  }
}
