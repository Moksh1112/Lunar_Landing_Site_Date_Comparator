import { describe, expect, it } from "vitest";
import compareOk from "../../../../../fixtures/compare.ok.json";
import type { CompareResponse } from "../../../api/types";
import { conclusion } from "../conclusion";

const base = compareOk as unknown as CompareResponse;
const withBoth = (v: number | null): CompareResponse => ({ ...base, deltas: { ...base.deltas, both_hours: v } });
const [a, b] = base.scenarios;

describe("conclusion sentence (derived from A − B both_hours only)", () => {
  it("names A when A has more", () => expect(conclusion(withBoth(25))).toBe(`${a.label} gets 25.0 h more with both Sun and Earth in view than ${b.label}.`));
  it("names B when B has more", () => expect(conclusion(withBoth(-3.24))).toBe(`${b.label} gets 3.2 h more with both Sun and Earth in view than ${a.label}.`));
  it("reports a tie under 0.05 h", () => expect(conclusion(withBoth(0.04))).toContain("get the same hours"));
  it("is honest when the delta is missing", () => expect(conclusion(withBoth(null))).toContain("cannot be compared"));
});
