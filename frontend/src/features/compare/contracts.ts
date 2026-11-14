// Shared props contract for the Compare journey (lead-defined; all three component groups code to this).
// Contract types come from src/api/types.ts (docs/CONTRACT.md v1.0) - never add response fields here.
import type { CompareResponse, ScenarioResult, Thresholds } from "../../api/types";

export type AlignBy = "calendar" | "mission_day";

/** Results summary: verdict chips, delta strip (B relative to A), metrics table, source labels, limitations. */
export type ResultsSummaryProps = {
  data: CompareResponse;
  expert: boolean;
  /** Current (possibly edited) thresholds; when they differ from sentThresholds the verdict is recomputed locally (F14). */
  thresholds?: Thresholds;
  sentThresholds?: Thresholds;
};

/** One horizon panorama per scenario: skyline + Sun/Earth paths; marker at scrubT (unix s) if set. */
export type HorizonPanoramaProps = {
  scenario: ScenarioResult;
  scrubT: number | null;
  yMinDeg: number;
  yMaxDeg: number;
  /** Expert mode: skyline value readout on pointer hover (PRD 6.3). */
  expert?: boolean;
};

/** Aligned Sun/Earth/Both lanes for A and B on one time axis, plus a difference lane; scrubber input. */
export type TimelineLanesProps = {
  data: CompareResponse;
  alignBy: AlignBy;
  /** Absolute unix seconds for calendar alignment; for mission_day the offset in seconds since each start. */
  scrubT: number | null;
  onScrub: (t: number) => void;
};

/** Delta display rule (contract: deltas are A minus B): the strip reads "B vs A" = -(delta). */
export const bRelativeToA = (delta: number | null): number | null => (delta === null ? null : -delta);
