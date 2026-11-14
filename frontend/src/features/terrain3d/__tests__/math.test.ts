import { describe, expect, it } from "vitest";
import { bodyDirection, decodeHeights } from "../math";

describe("grid-up terrain orientation", () => {
  it("maps local north through the site's east longitude", () => {
    expect(bodyDirection(0, 0, 0)[2]).toBeCloseTo(-1);
    expect(bodyDirection(0, 0, 90)[0]).toBeCloseTo(1);
    expect(bodyDirection(90, 0, 0)[0]).toBeCloseTo(1);
    expect(bodyDirection(0, 90, 0)[1]).toBeCloseTo(1);
  });
  it("rejects corrupt height payloads", () => expect(() => decodeHeights("AAAA", 256, 256)).toThrow());
});
