import { describe, expect, it } from "vitest";
import type { MetricKey } from "../../../api/types";
import { bRelativeToA } from "../contracts";
import {
  METRIC_KEYS,
  failedThresholdText,
  formatDeg,
  formatHours,
  formatPct,
  formatSigned,
  metricLabel,
} from "../format";

describe("format", () => {
  it("flips A-B delta to B vs A", () => {
    expect(formatSigned(bRelativeToA(16), "h")).toBe("−16.0 h");
    expect(formatSigned(bRelativeToA(-4.25), "h")).toBe("+4.3 h");
  });
  it("renders null as n/a", () => {
    expect(formatSigned(bRelativeToA(null), "h")).toBe("n/a");
    expect(formatHours(null)).toBe("n/a");
    expect(formatPct(null)).toBe("n/a");
    expect(formatDeg(null)).toBe("n/a");
  });
  it("rounds", () => {
    expect(formatHours(12.34)).toBe("12.3 h");
    expect(formatPct(49.96)).toBe("50.0 %");
    expect(formatDeg(5.678)).toBe("5.7°");
    expect(formatDeg(5.678, true)).toBe("5.68°");
    expect(formatSigned(-0.01, "h")).toBe("0.0 h");
  });
  it("labels every metric key", () => {
    const keys: MetricKey[] = [
      "sun_el_max_deg",
      "sun_el_mean_up_deg",
      "sun_hours",
      "sun_pct",
      "earth_hours",
      "earth_pct",
      "both_hours",
      "both_pct",
      "longest_dark_h",
      "longest_blackout_h",
    ];
    expect([...METRIC_KEYS].sort()).toEqual([...keys].sort());
    for (const k of keys) expect(metricLabel(k).length).toBeGreaterThan(0);
  });
  it("words failed thresholds", () => {
    expect(failedThresholdText("sun_pct_min")).toBe("Sunlight below 50 %");
    expect(
      failedThresholdText("blackout_h_max", {
        sun_pct_min: 1,
        earth_pct_min: 1,
        dark_gap_h_max: 1,
        blackout_h_max: 60,
      }),
    ).toBe("Longest Earth blackout above 60 h");
  });
});
