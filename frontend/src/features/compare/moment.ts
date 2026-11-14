// F12 countdowns + F17 "all views agree at the scrubber time". Computed in the browser from the
// compare response (TRD 5.2: next_sunset / next_earthset need no API call).
import type { ScenarioResult, Window } from "../../api/types";
import type { AlignBy } from "./contracts";
import { nearestIndex } from "./chartMath";

/** Absolute unix seconds for a scenario, given the shared scrubber value and alignment. */
export function absoluteTime(s: ScenarioResult, scrubT: number | null, alignBy: AlignBy): number | null {
  const t0 = s.series.t_unix[0];
  if (t0 === undefined) return null;
  if (scrubT === null) return t0;
  return alignBy === "calendar" ? scrubT : t0 + scrubT;
}

export type Countdown =
  | { state: "up"; hours: number; censored: boolean } // visible now; hours until it sets (or mission end if censored)
  | { state: "down"; hours: number | null }; // not visible; hours until it next rises, null if never in mission

const sec = (iso: string): number => Date.parse(iso) / 1000;

/** Time to the next set (if visible at t) or next rise (if not), from the contract windows. */
export function countdown(windows: Window[], t: number): Countdown {
  for (const w of windows) {
    const s = sec(w.start);
    const e = sec(w.end);
    if (t >= s && t < e) return { state: "up", hours: (e - t) / 3600, censored: w.end_censored };
  }
  const next = windows.map((w) => sec(w.start)).filter((s) => s > t).sort((a, b) => a - b)[0];
  return { state: "down", hours: next === undefined ? null : (next - t) / 3600 };
}

export type Moment = {
  t: number;
  sunEl: number;
  sunAz: number;
  earthEl: number;
  earthAz: number;
  sun: Countdown;
  earth: Countdown;
};

export function momentAt(s: ScenarioResult, t: number): Moment | null {
  if (s.series.t_unix.length === 0) return null;
  const i = nearestIndex(s.series.t_unix, t);
  return {
    t,
    sunEl: s.series.sun_el[i],
    sunAz: s.series.sun_az[i],
    earthEl: s.series.earth_el[i],
    earthAz: s.series.earth_az[i],
    sun: countdown(s.windows.sun, t),
    earth: countdown(s.windows.earth, t),
  };
}

export function countdownText(c: Countdown, body: "Sun" | "Earth"): string {
  const set = body === "Sun" ? "sunset" : "Earthset";
  const rise = body === "Sun" ? "sunrise" : "Earthrise";
  if (c.state === "up") return c.censored ? `up until mission end (${c.hours.toFixed(1)} h)` : `${set} in ${c.hours.toFixed(1)} h`;
  return c.hours === null ? `not visible again this mission` : `${rise} in ${c.hours.toFixed(1)} h`;
}
