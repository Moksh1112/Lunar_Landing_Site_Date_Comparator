import { describe, expect, it } from "vitest";
import { ringPoint, ringRadius } from "../skyRingMath";

describe("sky ring mapping", () => {
  it("puts the lowest elevation on the rim and the highest inside", () => {
    expect(ringRadius(-2, -2, 10, 168, 64)).toBe(168);
    expect(ringRadius(10, -2, 10, 168, 64)).toBe(64);
    expect(ringRadius(4, -2, 10, 168, 64)).toBe(116);
  });
  it("clamps out-of-range elevations to the band", () => {
    expect(ringRadius(-30, -2, 10, 168, 64)).toBe(168);
    expect(ringRadius(45, -2, 10, 168, 64)).toBe(64);
  });
  it("handles a flat scale", () => expect(ringRadius(1, 1, 1, 168, 64)).toBe(168));
  it("azimuth runs clockwise from north at the top", () => {
    const n = ringPoint(100, 100, 0, 50);
    const e = ringPoint(100, 100, 90, 50);
    const s = ringPoint(100, 100, 180, 50);
    expect([n.x, n.y]).toEqual([100, 50]);
    expect(e.x).toBeCloseTo(150, 9);
    expect(e.y).toBeCloseTo(100, 9);
    expect(s.y).toBeCloseTo(150, 9);
  });
});
