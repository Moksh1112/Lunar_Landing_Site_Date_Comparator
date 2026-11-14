import { describe, expect, it } from "vitest";
import { R_KM, globalInverse, normLon, polarForward, polarInverse, polarRadius, round4 } from "../projection";

describe("polar stereographic (TRD 4.2)", () => {
  it("pole maps to the origin", () => {
    const p = polarForward(-90, 0);
    expect(Math.hypot(p.x, p.y)).toBeCloseTo(0, 9);
  });
  it("matches the hand formula r = 2R tan(pi/4 + phi/2)", () =>
    expect(polarRadius(-80.7)).toBeCloseTo(2 * R_KM * Math.tan(Math.PI / 4 + (-80.7 * Math.PI) / 360), 9));
  it("0 deg E points +y and 90 deg E points +x", () => {
    const a = polarForward(-85, 0);
    const b = polarForward(-85, 90);
    expect(a.x).toBeCloseTo(0, 9);
    expect(a.y).toBeGreaterThan(0);
    expect(b.x).toBeGreaterThan(0);
    expect(b.y).toBeCloseTo(0, 9);
  });
  it("round-trips lat/lon -> x/y -> lat/lon within 1 m", () => {
    for (const [lat, lon] of [[-89.5, 0], [-85.5, 30], [-80.7, 210], [-76, 359.9], [-88.8, 45]]) {
      const p = polarForward(lat, lon);
      const q = polarInverse(p.x, p.y);
      const back = polarForward(q.lat, q.lon);
      expect(Math.hypot(back.x - p.x, back.y - p.y) * 1000).toBeLessThan(1);
      expect(q.lat).toBeCloseTo(lat, 8);
    }
  });
});

describe("global equirectangular", () => {
  it("returns lat/lon inside the map and null outside", () => {
    expect(globalInverse(-45, 120)).toEqual({ lat: -45, lon: 120 });
    expect(globalInverse(95, 10)).toBeNull();
    expect(globalInverse(0, 361)).toBeNull();
  });
  it("normalises longitude to 0..360", () => {
    expect(normLon(-90)).toBe(270);
    expect(normLon(360)).toBe(0);
  });
  it("rounds to 4 decimals for the form", () => expect(round4(-85.123456)).toBe("-85.1235"));
});
