import { describe, expect, it } from "vitest";
import { chapterBlend, toXYZ } from "../moonScene";

describe("illustration coordinates", () => {
  it("keeps east-positive lunar longitudes on the declared sphere axes", () => {
    const east = toXYZ(0, 90);
    expect(east.x).toBeCloseTo(0);
    expect(east.y).toBeCloseTo(0);
    expect(east.z).toBeCloseTo(-1);
    expect(toXYZ(0, -90).z).toBeCloseTo(1);
  });
  it("places the south pole on the negative north axis and respects scale", () => {
    const pole = toXYZ(-90, 0, 2);
    expect(pole.y).toBeCloseTo(-2);
    expect(pole.length()).toBeCloseTo(2);
  });
  it("clamps chapter endpoints to valid camera shots", () => {
    expect(chapterBlend(-1, 5)).toEqual({ i: 0, t: 0 });
    expect(chapterBlend(2, 5)).toEqual({ i: 3, t: 1 });
  });
});
