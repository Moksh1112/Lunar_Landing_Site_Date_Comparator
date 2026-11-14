import { describe, expect, it } from "vitest";
import type { z } from "zod";
import {
  apiErrorBodySchema,
  compareResponseSchema,
  healthSchema,
  sitesResponseSchema,
  skylineResponseSchema,
  sweepResponseSchema,
  terrainTileResponseSchema,
} from "../schemas";

const files = import.meta.glob("../../../../fixtures/*.json", { eager: true, import: "default" }) as Record<
  string,
  unknown
>;

const schemas: Record<string, z.ZodType> = {
  health: healthSchema,
  sites: sitesResponseSchema,
  compare: compareResponseSchema,
  sweep: sweepResponseSchema,
  skyline: skylineResponseSchema,
  "terrain-tile": terrainTileResponseSchema,
};

const entries = Object.entries(files).map(([path, data]) => {
  const [, endpoint, variant] = /([^/]+)\.(ok|empty|error)\.json$/.exec(path) ?? [];
  return { path, endpoint, variant, data };
});

describe("fixtures", () => {
  it("finds all 15 fixtures", () => {
    expect(entries).toHaveLength(15);
  });

  for (const { path, endpoint, variant, data } of entries) {
    if (variant === "error") {
      it(`${endpoint}.error parses as an error body`, () => {
        expect(apiErrorBodySchema.safeParse(data).success).toBe(true);
      });
    } else {
      it(`${endpoint}.${variant} parses with its schema`, () => {
        const result = schemas[endpoint]!.safeParse(data);
        if (!result.success) throw new Error(`${path}: ${JSON.stringify(result.error.issues)}`);
      });
    }
  }
});
