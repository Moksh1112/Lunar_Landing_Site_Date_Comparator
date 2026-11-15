import { beforeEach, describe, expect, it } from "vitest";
import compareOk from "../../../../../fixtures/compare.ok.json";
import type { CompareRequest, CompareResponse } from "../../../api/types";
import { useStore } from "../../../store";
import { visibilityGaps } from "../gap";

const res = compareOk as unknown as CompareResponse;
const req = (mode: CompareRequest["mode"]): CompareRequest => ({
  mode,
  scenarios: [
    { id: "A", label: "A", site: res.scenarios[0].site, start_utc: "2027-03-01T00:00:00Z", mission_hours: 708 },
    { id: "B", label: "B", site: res.scenarios[1].site, start_utc: "2027-03-15T00:00:00Z", mission_hours: 708 },
  ],
  step_minutes: 10,
  observer_height_m: 2,
  thresholds: { sun_pct_min: 50, earth_pct_min: 50, dark_gap_h_max: 48, blackout_h_max: 72 },
});
const gap = (id: "A" | "B") => {
  const r = visibilityGaps(res.scenarios[id === "A" ? 0 : 1]);
  if (r.state !== "gaps") throw new Error("fixture has no gap");
  return r.longest;
};

describe("gap focus in the store", () => {
  beforeEach(() => useStore.setState({ alignBy: "calendar", scrubT: null, gapFocus: null, lastCompare: null }));

  it("opens a new comparison on Plan A's longest gap midpoint", () => {
    useStore.getState().showNewCompare({ request: req("site_vs_site"), response: res });
    const s = useStore.getState();
    expect(s.gapFocus).toBe("A");
    expect(s.alignBy).toBe("calendar");
    expect(s.scrubT).toBe((gap("A").startUnix + gap("A").endUnix) / 2);
  });
  it("uses mission-relative alignment for date-shift comparisons", () => {
    useStore.getState().showNewCompare({ request: req("date_shift"), response: res });
    const s = useStore.getState();
    expect(s.alignBy).toBe("mission_day");
    expect(s.scrubT).toBe((gap("A").startUnix + gap("A").endUnix) / 2 - res.scenarios[0].series.t_unix[0]);
  });
  it("keeps user focus and scrubber when thresholds change, and re-expresses it on alignment change", () => {
    const st = useStore.getState();
    st.showNewCompare({ request: req("site_vs_site"), response: res });
    st.focusGap("B");
    st.setScrubT(12345);
    st.setThresholds({ sun_pct_min: 40 });
    expect(useStore.getState().scrubT).toBe(12345);
    expect(useStore.getState().gapFocus).toBe("B");
    st.setAlignBy("mission_day");
    expect(useStore.getState().scrubT).toBe((gap("B").startUnix + gap("B").endUnix) / 2 - res.scenarios[1].series.t_unix[0]);
  });
  it("clears gap focus for results stored without a fresh compare (simulator handoff resets to mission start)", () => {
    useStore.getState().setLastCompare({ request: req("date_shift"), response: res });
    expect(useStore.getState().gapFocus).toBeNull();
  });
});
