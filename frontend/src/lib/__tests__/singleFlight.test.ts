import { describe, expect, it } from "vitest";
import { createSingleFlight } from "../singleFlight";

describe("createSingleFlight", () => {
  it("lets one run through and drops a second synchronous start", () => {
    const gate = createSingleFlight();
    expect(gate.start()).toBe(true);
    expect(gate.start()).toBe(false); // double click in the same frame
    expect(gate.busy).toBe(true);
  });
  it("allows a new run after the previous one settles (success or error)", () => {
    const gate = createSingleFlight();
    gate.start();
    gate.end();
    expect(gate.busy).toBe(false);
    expect(gate.start()).toBe(true);
  });
});
