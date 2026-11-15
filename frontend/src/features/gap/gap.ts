// Visibility gaps and deterministic explanations, derived only from the contract's canonical windows.
// A "visibility gap" is an interval when the Sun and Earth are not both above the selected horizon.
// Semantics match backend app/metrics/windows.py longest_gap_hours: the mission span is the first to the
// last sample (series.t_unix), gaps are the stretches of that span not covered by windows.both, and
// stretches touching the span ends are included (censored: they may extend beyond the mission).
// No sample endpoint is reinterpreted; window edges are the backend's interpolated, second-rounded times.
import type { HorizonMode, ScenarioResult, Window } from "../../api/types";
import { nearestIndex } from "../compare/chartMath";
import { skylineAt } from "../compare/skyline";

export const GAP_DEFINITION = "An interval when the Sun and Earth are not both above the selected horizon.";
const MIN_GAP_S = 1; // window times are rounded to the second; shorter slivers are rounding, not gaps

export type Gap = {
  scenario: "A" | "B";
  startUnix: number;
  endUnix: number;
  hours: number;
  /** Seconds from the scenario's mission start (first sample). */
  offsetStart: number;
  offsetEnd: number;
  /** Touches the first sample: the interval may have begun before the mission. */
  startCensored: boolean;
  /** Touches the last sample: the interval may continue after the mission. */
  endCensored: boolean;
  wholeMission: boolean;
};

export type GapResult =
  | { state: "unavailable"; reason: string }
  | { state: "none"; missionHours: number }
  | { state: "gaps"; longest: Gap; all: Gap[]; missionHours: number };

const sec = (iso: string) => Date.parse(iso) / 1000;

function span(s: ScenarioResult): [number, number] | null {
  const t = s.series?.t_unix;
  if (!t || t.length < 2) return null;
  const t0 = t[0];
  const t1 = t[t.length - 1];
  return Number.isFinite(t0) && Number.isFinite(t1) && t1 > t0 ? [t0, t1] : null;
}

const validWindows = (ws: Window[] | undefined) =>
  Array.isArray(ws) && ws.every((w) => Number.isFinite(sec(w.start)) && Number.isFinite(sec(w.end)));

/** All gaps in simultaneous visibility and the longest one (earliest wins ties). */
export function visibilityGaps(s: ScenarioResult): GapResult {
  const sp = span(s);
  if (!sp) return { state: "unavailable", reason: "This plan has fewer than two time samples, so no gap can be measured." };
  if (!validWindows(s.windows?.both)) return { state: "unavailable", reason: "This plan's visibility windows are missing or unreadable." };
  const [t0, t1] = sp;
  const missionHours = (t1 - t0) / 3600;
  const all: Gap[] = [];
  const push = (a: number, b: number) => {
    if (b - a < MIN_GAP_S) return;
    all.push({
      scenario: s.id,
      startUnix: a,
      endUnix: b,
      hours: (b - a) / 3600,
      offsetStart: a - t0,
      offsetEnd: b - t0,
      startCensored: a <= t0,
      endCensored: b >= t1,
      wholeMission: a <= t0 && b >= t1,
    });
  };
  let cursor = t0;
  for (const w of [...s.windows.both].sort((x, y) => sec(x.start) - sec(y.start))) {
    const a = Math.min(Math.max(sec(w.start), t0), t1);
    const b = Math.min(Math.max(sec(w.end), t0), t1);
    push(cursor, a);
    cursor = Math.max(cursor, b);
  }
  push(cursor, t1);
  if (all.length === 0) return { state: "none", missionHours };
  let longest = all[0];
  for (const g of all) if (g.endUnix - g.startUnix > longest.endUnix - longest.startUnix) longest = g; // strict: earliest wins ties
  return { state: "gaps", longest, all, missionHours };
}

/** Wording for the horizon actually used, from the response's horizon_mode. */
export function horizonPhrase(mode: HorizonMode): string {
  return mode === "terrain"
    ? "the computed terrain skyline"
    : mode === "terrain_coarse"
      ? "the computed coarse-terrain skyline (160 m DEM)"
      : "the geometric horizon (smooth sphere, no terrain)";
}

export type Cause = "sun" | "earth" | "both" | "inconsistent";
export type Part = { startUnix: number; endUnix: number; hours: number; cause: Cause };
export type GapEvent = { tUnix: number; text: string; kind: "gap-start" | "gap-end" | "sun-rise" | "sun-set" | "earth-rise" | "earth-set" };
export type Explanation = {
  scenario: "A" | "B";
  horizon: string;
  stepMinutes: number;
  parts: Part[];
  events: GapEvent[];
  summary: string;
  notes: string[];
};

const inside = (ws: Window[], t: number) => ws.some((w) => t >= sec(w.start) && t < sec(w.end));

export const fmtUtc = (t: number) => `${new Date(t * 1000).toISOString().slice(0, 16).replace("T", " ")} UTC`;
export const fmtH = (h: number) => `${h.toFixed(1)} h`;
const missionPos = (offset: number) => `mission day ${Math.floor(offset / 86400) + 1}, +${(offset / 3600).toFixed(1)} h`;
export const gapPosition = (g: Gap) => `${missionPos(g.offsetStart)} to ${missionPos(g.offsetEnd)}`;

function causeText(c: Cause, horizon: string): string {
  if (c === "sun") return `the Sun is below ${horizon} while Earth remains above it`;
  if (c === "earth") return `Earth is below ${horizon} while the Sun remains above it`;
  if (c === "both") return `both the Sun and Earth are below ${horizon}`;
  return "the returned Sun and Earth windows disagree with the both-visible windows; no cause is stated";
}

/** Explain a gap from the canonical sun/earth windows, split wherever the responsible condition changes. */
export function explainGap(s: ScenarioResult, g: Gap): Explanation {
  const horizon = horizonPhrase(s.meta.horizon_mode);
  const sunW = s.windows.sun;
  const earthW = s.windows.earth;
  const cuts = new Set<number>([g.startUnix, g.endUnix]);
  const events: GapEvent[] = [];
  for (const [ws, body] of [[sunW, "sun"], [earthW, "earth"]] as const) {
    for (const w of ws) {
      const a = sec(w.start);
      const b = sec(w.end);
      const name = body === "sun" ? "The Sun" : "Earth";
      if (a > g.startUnix && a < g.endUnix) {
        cuts.add(a);
        events.push({ tUnix: a, kind: `${body}-rise`, text: `${name} rises above ${horizon}.` });
      }
      if (b > g.startUnix && b < g.endUnix) {
        cuts.add(b);
        events.push({ tUnix: b, kind: `${body}-set`, text: `${name} sets below ${horizon}.` });
      }
    }
  }
  const pts = [...cuts].sort((a, b) => a - b);
  const raw: Part[] = [];
  for (let i = 0; i + 1 < pts.length; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    if (b - a < MIN_GAP_S) continue;
    const mid = (a + b) / 2;
    const sun = inside(sunW, mid);
    const earth = inside(earthW, mid);
    const cause: Cause = !sun && !earth ? "both" : !sun ? "sun" : !earth ? "earth" : "inconsistent";
    raw.push({ startUnix: a, endUnix: b, hours: (b - a) / 3600, cause });
  }
  const parts: Part[] = [];
  for (const p of raw) {
    const last = parts[parts.length - 1];
    if (last && last.cause === p.cause && last.endUnix === p.startUnix) {
      last.endUnix = p.endUnix;
      last.hours = (last.endUnix - last.startUnix) / 3600;
    } else parts.push({ ...p });
  }
  events.push({
    tUnix: g.startUnix,
    kind: "gap-start",
    text: g.startCensored ? "Mission starts without simultaneous Sun and Earth visibility." : "Simultaneous Sun and Earth visibility ends.",
  });
  events.push({
    tUnix: g.endUnix,
    kind: "gap-end",
    text: g.endCensored ? "Mission ends; the gap may continue after it." : "Simultaneous Sun and Earth visibility resumes.",
  });
  events.sort((a, b) => a.tUnix - b.tUnix || (a.kind === "gap-start" ? -1 : 1));
  const sentence = (p: Part) => `From ${fmtUtc(p.startUnix)} to ${fmtUtc(p.endUnix)} (${fmtH(p.hours)}), ${causeText(p.cause, horizon)}.`;
  // Several parts: a compact time-by-cause total; each part is listed separately (partText).
  const total = (c: Cause) => parts.filter((p) => p.cause === c).reduce((h, p) => h + p.hours, 0);
  const byCause = (["sun", "earth", "both", "inconsistent"] as const)
    .filter((c) => total(c) > 0)
    .map((c) => `${CAUSE_SHORT[c]} ${fmtH(total(c))}`)
    .join("; ");
  const summary =
    parts.length === 1
      ? sentence(parts[0])
      : `This gap has ${parts.length} parts, measured against ${horizon}. Time by cause: ${byCause}.`;
  const notes = [
    `Times come from visibility windows whose edges are interpolated between samples taken every ${s.meta.step_minutes} min; shown to the minute.`,
  ];
  if (g.startCensored) notes.push("The gap touches the mission start, so it may have begun earlier.");
  if (g.endCensored) notes.push("The gap touches the mission end, so it may continue afterwards.");
  if (s.meta.horizon_mode === "geometric") notes.push("This plan uses the geometric horizon only: no terrain obstruction can be stated.");
  return { scenario: s.id, horizon, stepMinutes: s.meta.step_minutes, parts, events, summary, notes };
}

const CAUSE_SHORT: Record<Cause, string> = {
  sun: "only the Sun below",
  earth: "only Earth below",
  both: "both below",
  inconsistent: "windows disagree",
};

/** One explanation part as a plain sentence (used for part lists). */
export const partText = (p: Part, horizon: string) =>
  `${fmtUtc(p.startUnix)} to ${fmtUtc(p.endUnix)} (${fmtH(p.hours)}): ${causeText(p.cause, horizon)}.`;

export type BodyReading = { az: number; el: number; skyline: number | null; visible: boolean };
export type Reading = { sampleUnix: number; sun: BodyReading; earth: BodyReading };

/** Values at the sample nearest t, with the skyline elevation at each body's azimuth. */
export function readingAt(s: ScenarioResult, t: number): Reading | null {
  const i = nearestIndex(s.series.t_unix, t);
  if (i < 0) return null;
  const body = (az: number, el: number, vis: number): BodyReading => ({ az, el, skyline: skylineAt(s.skyline, az)?.elev ?? null, visible: vis === 1 });
  return {
    sampleUnix: s.series.t_unix[i],
    sun: body(s.series.sun_az[i], s.series.sun_el[i], s.series.sun_vis[i]),
    earth: body(s.series.earth_az[i], s.series.earth_el[i], s.series.earth_vis[i]),
  };
}

/** Labelled A/B comparison of the longest gaps; never assumes which plan is better. */
export function compareLongest(a: GapResult, b: GapResult): string {
  const h = (r: GapResult) => (r.state === "gaps" ? r.longest.hours : r.state === "none" ? 0 : null);
  const ha = h(a);
  const hb = h(b);
  if (ha === null || hb === null) return "The longest gaps cannot be compared because one plan's gap is unavailable.";
  const base = `Longest visibility gap: Plan A ${fmtH(ha)}, Plan B ${fmtH(hb)}.`;
  const d = ha - hb;
  if (Math.abs(d) < 0.05) return `${base} They are the same to 0.1 h.`;
  return `${base} Plan ${d > 0 ? "B" : "A"}'s longest gap is shorter by ${fmtH(Math.abs(d))}.`;
}

/** Default focus after a new comparison: A's longest gap, else B's, else none (mission start). */
export function defaultFocus(a: GapResult, b: GapResult): Gap | null {
  if (a.state === "gaps") return a.longest;
  if (b.state === "gaps") return b.longest;
  return null;
}

/** Scrubber value (store units) for a time within a scenario: absolute unix (calendar) or mission offset. */
export function scrubValue(t: number, missionStart: number, alignBy: "calendar" | "mission_day"): number {
  return alignBy === "calendar" ? t : t - missionStart;
}
