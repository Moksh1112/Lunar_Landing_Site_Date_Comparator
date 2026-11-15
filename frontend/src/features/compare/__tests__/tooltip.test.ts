import { expect, it } from "vitest";
import { followCursor, tooltipTarget } from "../tooltipMath";

it("loosely follows by 25 percent of the remaining distance", () => {
  const target = { x: 100, y: 40 };
  const next = followCursor({ x: 0, y: 0 }, target);
  expect(next).toEqual({ x: 25, y: 10 });
  expect(followCursor(next, target)).toEqual({ x: 43.75, y: 17.5 });
});

it("flips tooltips at viewport edges and keeps their padding", () => {
  expect(tooltipTarget({ x: 100, y: 100 }, 240, 80, 800, 600)).toEqual({ x: 114, y: 114 });
  expect(tooltipTarget({ x: 790, y: 590 }, 240, 80, 800, 600)).toEqual({ x: 536, y: 496 });
  const position = tooltipTarget({ x: 5, y: 5 }, 260, 90, 280, 120);
  expect(position.x).toBeGreaterThanOrEqual(8);
  expect(position.y).toBeGreaterThanOrEqual(8);
  expect(position.x + 260).toBeLessThanOrEqual(272);
});
