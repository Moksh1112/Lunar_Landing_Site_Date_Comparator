import { describe, expect, it } from "vitest";
import { bodyDirection, decodeHeights, terrainCameraDistance } from "../math";

describe("grid-up terrain orientation", () => {
  it("maps local north through the site's east longitude", () => {
    expect(bodyDirection(0, 0, 0)[2]).toBeCloseTo(-1);
    expect(bodyDirection(0, 0, 90)[0]).toBeCloseTo(1);
    expect(bodyDirection(90, 0, 0)[0]).toBeCloseTo(1);
    expect(bodyDirection(0, 90, 0)[1]).toBeCloseTo(1);
  });
  it("rejects corrupt height payloads", () => expect(() => decodeHeights("AAAA", 256, 256)).toThrow());
  it("fits taller exaggerated relief and narrow screens without clipping", () => {
    expect(terrainCameraDistance(4, 45, 2)).toBeGreaterThan(terrainCameraDistance(0.5, 45, 2));
    expect(terrainCameraDistance(4, 45, 0.6)).toBeGreaterThan(terrainCameraDistance(4, 45, 2));
    expect(Number.isFinite(terrainCameraDistance(0, 45, 0))).toBe(true);
  });
});
