import { describe, expect, it } from "vitest";
import {
  PRACTICE_STEPS,
  START_CONSOLE,
  currentStep,
  dayToDate,
  hintFor,
  operate,
  qualification,
  requestFor,
  score,
  type Console,
} from "../levels";

const T = { sun_pct_min: 50, earth_pct_min: 50, dark_gap_h_max: 48, blackout_h_max: 72 };

function runPractice(): Console {
  let c = START_CONSOLE;
  c = operate(c, "site"); // Odysseus -> Athena
  for (let i = 0; i < 3; i++) c = operate(c, "date", -1); // day 3 -> 0
  c = operate(c, "mission");
  c = operate(c, "mission"); // 240 -> 480 -> 708
  c = operate(c, "plan");
  for (let i = 0; i < 11; i++) c = operate(c, "date", +1); // B: 3 -> 14
  return c;
}

describe("practice state machine", () => {
  it("starts at the first step and advances in order", () => {
    expect(currentStep(START_CONSOLE)).toBe(0);
    const c = runPractice();
    expect(PRACTICE_STEPS[currentStep(c)].id).toBe("compare");
  });
  it("date dial follows the selected plan and clamps to 0..30", () => {
    let c = operate(START_CONSOLE, "date", -10);
    expect(c.dayA).toBe(0);
    c = operate(operate(c, "plan"), "date", +40);
    expect([c.dayA, c.dayB]).toEqual([0, 30]);
  });
  it("wrong control gives a hint, right control gives none", () => {
    expect(hintFor(START_CONSOLE, "site")).toBeNull();
    expect(hintFor(START_CONSOLE, "compare")).toBe("Not yet: Turn SITE to IM-2 Athena.");
  });
});

describe("request handoff", () => {
  it("builds a date-shift request at the chosen library site", () => {
    const r = requestFor(runPractice(), T);
    expect(r.mode).toBe("date_shift");
    expect(r.scenarios.map((s) => [s.site.site_id, s.start_utc, s.mission_hours])).toEqual([
      ["im2-athena", "2027-03-01T00:00:00Z", 708],
      ["im2-athena", "2027-03-15T00:00:00Z", 708],
    ]);
    expect(dayToDate(14)).toBe("2027-03-15");
  });
});

describe("qualification and score", () => {
  it("passes only on a non-synthetic GREEN Plan B", () => {
    expect(qualification([{ dayB: 5, verdictB: "green", synthetic: true }]).passed).toBe(false);
    expect(qualification([{ dayB: 5, verdictB: "green", synthetic: false }])).toEqual({ done: true, passed: true, left: 2 });
  });
  it("ends after three attempts", () => {
    const a = { dayB: 1, verdictB: "red" as const, synthetic: false };
    expect(qualification([a, a, a])).toEqual({ done: true, passed: false, left: 0 });
  });
  it("scores fewer attempts and less time higher; a fail scores 0", () => {
    const g = { dayB: 1, verdictB: "green" as const, synthetic: false };
    const r = { ...g, verdictB: "red" as const };
    expect(score([g], 10)).toBeGreaterThan(score([r, g], 10));
    expect(score([r, r, r], 10)).toBe(0);
  });
});
