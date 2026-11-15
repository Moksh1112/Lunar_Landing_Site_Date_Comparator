import { describe, expect, it } from "vitest";
import { bodyDirection, decodeHeights, heightFraction, missionTime, terrainCameraDistance } from "../math";

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
  it("maps elevation colours monotonically and handles flat tiles", () => {
    expect([-10, 0, 10, 20, 30].map(h => heightFraction(h, 0, 20))).toEqual([0, 0, 0.5, 1, 1]);
    expect(heightFraction(10, 10, 10)).toBe(0.5);
  });
  it("keeps playback within the selected plan after switching landing dates", () => {
    expect(missionTime(null, 100, 200)).toBe(100);
    expect(missionTime(50, 100, 200)).toBe(100);
    expect(missionTime(150, 100, 200)).toBe(150);
    expect(missionTime(500, 100, 200)).toBe(200);
  });
});
