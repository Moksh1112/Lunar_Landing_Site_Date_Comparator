import { create } from "zustand";
import type { CompareMode, CompareRequest, CompareResponse, Thresholds } from "./api/types";
import type { AlignBy } from "./features/compare/contracts";
import { linkScenarios, type ScenarioForm } from "./features/compare/compareForm";
import { defaultFocus, scrubValue, visibilityGaps } from "./features/gap/gap";

type UiState = {
  expert: boolean;
  setExpert: (expert: boolean) => void;
  mode: CompareMode;
  scenarios: { A: ScenarioForm; B: ScenarioForm };
  thresholds: Thresholds;
  scrubT: number | null;
  alignBy: AlignBy;
  setMode: (mode: CompareMode) => void;
  setScenario: (id: "A" | "B", patch: Partial<ScenarioForm>) => void;
  setThresholds: (patch: Partial<Thresholds>) => void;
  setScrubT: (t: number | null) => void;
  setAlignBy: (a: AlignBy) => void;
  /** Last successful compare, kept so Report/export and navigation back to Compare keep the result. */
  lastCompare: { request: CompareRequest; response: CompareResponse } | null;
  setLastCompare: (c: { request: CompareRequest; response: CompareResponse } | null) => void;
  /** Plan whose longest visibility gap is in focus ("Start with the gap"); null = mission start. */
  gapFocus: "A" | "B" | null;
  /** Move the shared scrubber to a plan's longest gap midpoint (null: mission start). */
  focusGap: (id: "A" | "B" | null) => void;
  /** A newly computed comparison: store it and open on the longest gap (A first, else B). */
  showNewCompare: (c: { request: CompareRequest; response: CompareResponse }) => void;
  /** Best-date "Load as B": replaces Plan B and switches to the free preset so nothing is re-linked. */
  loadAsB: (patch: Partial<ScenarioForm>) => void;
};

/** Scrubber value for the midpoint of a plan's longest gap, in the current alignment's units. */
function gapScrub(c: { response: CompareResponse } | null, id: "A" | "B" | null, alignBy: AlignBy): number | null {
  if (!c || !id) return null;
  const s = c.response.scenarios.find((x) => x.id === id);
  const r = s ? visibilityGaps(s) : null;
  if (!s || !r || r.state !== "gaps") return null;
  return scrubValue((r.longest.startUnix + r.longest.endUnix) / 2, s.series.t_unix[0], alignBy);
}

// Starter example: two south-pole points on the same date (SYNTHETIC data in mock mode).
const starterA: ScenarioForm = {
  label: "Plan A", siteId: null, siteName: null, lat: "-89.5", lon: "0", startUtc: "2026-03-01T00:00", missionHours: "708",
};
const starterB: ScenarioForm = { ...starterA, label: "Plan B", lat: "-88.8", lon: "45" };

export const useStore = create<UiState>((set) => ({
  expert: false,
  setExpert: (expert) => set({ expert }),
  mode: "site_vs_site",
  scenarios: { A: starterA, B: linkScenarios("site_vs_site", starterA, starterB) },
  thresholds: { sun_pct_min: 50, earth_pct_min: 50, dark_gap_h_max: 48, blackout_h_max: 72 },
  scrubT: null,
  alignBy: "calendar",
  setMode: (mode) =>
    set((s) => ({ mode, scenarios: { A: s.scenarios.A, B: linkScenarios(mode, s.scenarios.A, s.scenarios.B) } })),
  setScenario: (id, patch) =>
    set((s) => {
      const next = { ...s.scenarios, [id]: { ...s.scenarios[id], ...patch } };
      return { scenarios: { A: next.A, B: linkScenarios(s.mode, next.A, next.B) } };
    }),
  setThresholds: (patch) => set((s) => ({ thresholds: { ...s.thresholds, ...patch } })),
  setScrubT: (scrubT) => set({ scrubT }),
  // Switching alignment keeps a focused gap in view (re-expressed in the new units); otherwise mission start.
  setAlignBy: (alignBy) => set((s) => ({ alignBy, scrubT: gapScrub(s.lastCompare, s.gapFocus, alignBy) })),
  lastCompare: null,
  setLastCompare: (lastCompare) => set({ lastCompare, gapFocus: null }),
  gapFocus: null,
  focusGap: (id) => set((s) => ({ gapFocus: id, scrubT: gapScrub(s.lastCompare, id, s.alignBy) })),
  showNewCompare: (c) =>
    set((s) => {
      const [a, b] = c.response.scenarios;
      const focus = defaultFocus(visibilityGaps(a), visibilityGaps(b))?.scenario ?? null;
      // Date-shift plans have different UTC dates: compare mission-relative positions by default.
      const alignBy: AlignBy = c.request.mode === "date_shift" ? "mission_day" : s.alignBy;
      return { lastCompare: c, gapFocus: focus, alignBy, scrubT: gapScrub(c, focus, alignBy) };
    }),
  loadAsB: (patch) => set((s) => ({ mode: "free", scenarios: { A: s.scenarios.A, B: { ...s.scenarios.B, ...patch } } })),
}));
