// Mission Planning Simulator: level and console state machine (pure; unit tested).
import type { CompareMode, CompareRequest, Thresholds } from "../../api/types";
import { buildRequest, type ScenarioForm } from "../compare/compareForm";

export type Level = "boot" | "briefing" | "demo" | "practice" | "qualify" | "debrief";
export const LEVELS: Level[] = ["boot", "briefing", "demo", "practice", "qualify", "debrief"];
export const LEVEL_TITLE: Record<Level, string> = {
  boot: "Mission Planning Simulator",
  briefing: "Briefing",
  demo: "Demonstration",
  practice: "Practice",
  qualify: "Qualification",
  debrief: "Debrief",
};

export type Control = "site" | "date" | "mission" | "plan" | "compare";

/** Library sites (backend sites.json, verified: true). Coordinates are the library values. */
export const SIM_SITES = [
  { id: "im1-odysseus", name: "IM-1 Odysseus", lat: -80.13, lon: 1.44 },
  { id: "im2-athena", name: "IM-2 Athena", lat: -84.7906, lon: 29.1957 },
  { id: "im2-intended", name: "IM-2 intended site", lat: -84.78, lon: 29.13 },
] as const;
export const MISSION_HOURS = [240, 480, 708] as const;
export const BASE_DAY = "2027-03-01";

export type Console = { plan: "A" | "B"; site: number; dayA: number; dayB: number; hours: number };
export const START_CONSOLE: Console = { plan: "A", site: 0, dayA: 3, dayB: 3, hours: 240 };

export const dayToDate = (offset: number): string =>
  new Date(Date.parse(`${BASE_DAY}T00:00:00Z`) + offset * 86_400_000).toISOString().slice(0, 10);

export type Step = { id: string; text: string; control: Control; done: (c: Console) => boolean };

export const PRACTICE_STEPS: Step[] = [
  { id: "site", text: "Turn SITE to IM-2 Athena", control: "site", done: (c) => SIM_SITES[c.site].id === "im2-athena" },
  { id: "dateA", text: "Set Plan A DATE to 2027-03-01", control: "date", done: (c) => c.dayA === 0 },
  { id: "mission", text: "Pull MISSION to 708 h (one lunar day)", control: "mission", done: (c) => c.hours === 708 },
  { id: "plan", text: "Flip PLAN to B", control: "plan", done: (c) => c.plan === "B" },
  { id: "dateB", text: "Set Plan B DATE to 2027-03-15", control: "date", done: (c) => c.dayB === 14 },
  { id: "compare", text: "Press COMPARE", control: "compare", done: () => false },
];

/** Index of the first unfinished practice step (steps must hold in order). */
export function currentStep(c: Console): number {
  const i = PRACTICE_STEPS.findIndex((s) => !s.done(c));
  return i === -1 ? PRACTICE_STEPS.length - 1 : i;
}

/** Apply a control action. `delta` is +1/-1 for the date dial; other controls cycle. */
export function operate(c: Console, control: Control, delta = 1): Console {
  switch (control) {
    case "site":
      return { ...c, site: (c.site + 1) % SIM_SITES.length };
    case "date":
      return c.plan === "A"
        ? { ...c, dayA: Math.min(30, Math.max(0, c.dayA + delta)) }
        : { ...c, dayB: Math.min(30, Math.max(0, c.dayB + delta)) };
    case "mission": {
      const i = MISSION_HOURS.indexOf(c.hours as (typeof MISSION_HOURS)[number]);
      return { ...c, hours: MISSION_HOURS[(i + 1) % MISSION_HOURS.length] };
    }
    case "plan":
      return { ...c, plan: c.plan === "A" ? "B" : "A" };
    case "compare":
      return c;
  }
}

/** Practice feedback: a control other than the step's control is a hint, never a penalty. */
export function hintFor(c: Console, control: Control): string | null {
  const step = PRACTICE_STEPS[currentStep(c)];
  if (control === step.control) return null;
  return `Not yet: ${step.text}.`;
}

/** Date-shift request: same site for A and B, two landing days. Uses the comparator's builder. */
export function requestFor(c: Console, thresholds: Thresholds): CompareRequest {
  const s = SIM_SITES[c.site];
  const plan = (label: string, day: number): ScenarioForm => ({
    label,
    siteId: s.id,
    siteName: s.name,
    lat: String(s.lat),
    lon: String(s.lon),
    startUtc: `${dayToDate(day)}T00:00`,
    missionHours: String(c.hours),
  });
  const mode: CompareMode = "date_shift";
  return buildRequest({ mode, scenarios: [plan("Plan A", c.dayA), plan("Plan B", c.dayB)], thresholds });
}

/**
 * Qualification mission length. Real-backend evidence (IM-2 Athena, terrain mode, Plan B days
 * 2027-03-01..30): with 708 h (one lunar day) every start date is RED (sunlight 35.5-39.7 %,
 * longest dark gap 209-413 h), so "find a GREEN day" had no answer. With a 240 h (10-day)
 * mission the landing day decides the verdict (days 13-16 Mar GREEN). The science, thresholds
 * and the GREEN rule are unchanged; only the challenge scenario is set to a solvable length.
 */
export const QUALIFY_HOURS = 240;

/** Challenge start: edit Plan B, 240 h mission, Plan B begins at Plan A's day so the user must search. */
export const qualifyStart = (c: Console): Console => ({ ...c, plan: "B", hours: QUALIFY_HOURS, dayB: c.dayA });

export type Attempt = { dayB: number; verdictB: "green" | "amber" | "red" | null; synthetic: boolean; error?: string };

/** Qualification: a GREEN Plan B within 3 attempts. Synthetic results never count as a pass. */
export function qualification(attempts: Attempt[]): { done: boolean; passed: boolean; left: number } {
  const passed = attempts.some((a) => a.verdictB === "green" && !a.synthetic);
  const left = Math.max(0, 3 - attempts.length);
  return { done: passed || left === 0, passed, left };
}

export function score(attempts: Attempt[], seconds: number): number {
  const q = qualification(attempts);
  if (!q.passed) return 0;
  return Math.max(100, 1000 - (attempts.length - 1) * 250 - Math.round(seconds) * 2);
}
