import { describe, expect, it } from "vitest";
import { countVisible, nearestIndex, nearestTrackSample, splitAtWrap, symmetricDifference, visibilityAt, windowToRange } from "../chartMath";
import fixture from "../../../../../fixtures/compare.ok.json";
import type { CompareResponse } from "../../../api/types";

describe("splitAtWrap", () => {
  it("breaks at 360->0 wrap", () => {
    const segs = splitAtWrap([350, 355, 2, 8], [1, 2, 3, 4], [1, 1, 1, 1]);
    expect(segs).toHaveLength(2);
    expect(segs[0].points.map((p) => p.x)).toEqual([350, 355]);
    expect(segs[1].points.map((p) => p.x)).toEqual([2, 8]);
  });
  it("splits on visibility change, sharing the joint point", () => {
    const segs = splitAtWrap([10, 20, 30], [0, 0, 0], [1, 0, 0]);
    expect(segs.map((s) => s.visible)).toEqual([true, false]);
    expect(segs[1].points.map((p) => p.x)).toEqual([10, 20, 30]);
  });
  it("handles empty input", () => expect(splitAtWrap([], [], [])).toEqual([]));
});

describe("nearestIndex", () => {
  const t = [0, 10, 20, 30];
  it("finds nearest", () => {
    expect(nearestIndex(t, 4)).toBe(0);
    expect(nearestIndex(t, 6)).toBe(1);
    expect(nearestIndex(t, 99)).toBe(3);
    expect(nearestIndex(t, -5)).toBe(0);
  });
  it("empty -> -1", () => expect(nearestIndex([], 1)).toBe(-1));
});

describe("windowToRange", () => {
  const w = { start: "1970-01-01T00:01:00Z", end: "1970-01-01T00:02:00Z" };
  it("calendar is absolute", () => expect(windowToRange(w, 30, "calendar")).toEqual([60, 120]));
  it("mission_day is offset", () => expect(windowToRange(w, 30, "mission_day")).toEqual([30, 90]));
});

describe("symmetricDifference / countVisible", () => {
  it("returns non-overlapping parts", () => {
    expect(symmetricDifference([[0, 10]], [[5, 15]])).toEqual([[0, 5], [10, 15]]);
    expect(symmetricDifference([[0, 10]], [[0, 10]])).toEqual([]);
  });
  it("counts", () => expect(countVisible([1, 0, 1, 1])).toBe(3));
});

describe("interactive inspection", () => {
  it("picks actual Sun/Earth positions even when a direction repeats at different times", () => {
    const series = { ...(fixture as CompareResponse).scenarios[0].series, t_unix: [0, 10, 20], sun_az: [350, 10, 10], sun_el: [1, 2, 8], earth_az: [90, 100, 110], earth_el: [1, 2, 3] };
    const project = (az: number, el: number) => ({ x: az, y: el });
    expect(nearestTrackSample(series, project, { x: 10, y: 7 })).toEqual({ body: "sun", index: 2 });
    expect(nearestTrackSample(series, project, { x: 100, y: 2 })).toEqual({ body: "earth", index: 1 });
    expect(nearestTrackSample({ ...series, t_unix: [] }, project, { x: 0, y: 0 })).toBeNull();
  });
  it("distinguishes gaps, censored mission ends and times outside a plan", () => {
    const scenario = { ...(fixture as CompareResponse).scenarios[0], series: { ...(fixture as CompareResponse).scenarios[0].series, t_unix: [0, 10, 20] }, windows: {
      sun: [{ start: "1970-01-01T00:00:00Z", end: "1970-01-01T00:00:10Z", hours: 10 / 3600, start_censored: true, end_censored: false }],
      earth: [{ start: "1970-01-01T00:00:05Z", end: "1970-01-01T00:00:20Z", hours: 15 / 3600, start_censored: false, end_censored: true }], both: [],
    } };
    expect(visibilityAt(scenario, -1)).toBe("outside this mission");
    expect(visibilityAt(scenario, 0)).toBe("Sun only; Earth hidden");
    expect(visibilityAt(scenario, 6)).toBe("Sun and Earth in view");
    expect(visibilityAt(scenario, 10)).toBe("Earth only; Sun hidden");
    expect(visibilityAt(scenario, 20)).toBe("Earth only; Sun hidden");
    expect(visibilityAt(scenario, 21)).toBe("outside this mission");
  });
});
