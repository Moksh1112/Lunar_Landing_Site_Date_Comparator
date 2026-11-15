import { afterEach, expect, it } from "vitest";
import fixture from "../../../../../fixtures/compare.ok.json";
import type { CompareResponse } from "../../../api/types";
import { useStore } from "../../../store";
import { buildRequest } from "../../compare/compareForm";

const initial = useStore.getState();
afterEach(() => useStore.setState(initial, true));

it("loads the selected day as a fresh free-mode request without relinking Plan A or retaining stale results", () => {
  const before = useStore.getState();
  const oldRequest = buildRequest({ mode: before.mode, scenarios: [before.scenarios.A, before.scenarios.B], thresholds: before.thresholds });
  useStore.setState({ lastCompare: { request: oldRequest, response: fixture as CompareResponse }, scrubT: 12345 });
  before.loadAsB({ label: "Best date 2027-03-14", startUtc: "2027-03-14T00:00", missionHours: "240", siteId: "im2-athena", lat: "-84.7906", lon: "29.1957" });
  const after = useStore.getState();
  const request = buildRequest({ mode: after.mode, scenarios: [after.scenarios.A, after.scenarios.B], thresholds: after.thresholds });
  expect(after.scenarios.A).toEqual(before.scenarios.A);
  expect(request.mode).toBe("free");
  expect(request.scenarios[1]).toMatchObject({ start_utc: "2027-03-14T00:00:00Z", mission_hours: 240, site: { site_id: "im2-athena" } });
  expect(request.thresholds).toEqual(oldRequest.thresholds);
  expect(after.lastCompare).toBeNull();
  expect(after.scrubT).toBeNull();
});

it("rejects a comparison completing after Load as B, but accepts a new comparison", async () => {
  const before = useStore.getState();
  const request = buildRequest({ mode: before.mode, scenarios: [before.scenarios.A, before.scenarios.B], thresholds: before.thresholds });
  let finish!: (response: CompareResponse) => void;
  const pending = new Promise<CompareResponse>(resolve => { finish = resolve; })
    .then(response => before.setLastCompare({ request, response }, before.planBRevision));
  before.loadAsB({ startUtc: "2027-03-14T00:00" });
  finish(fixture as CompareResponse);
  await pending;
  expect(useStore.getState().lastCompare).toBeNull();
  const after = useStore.getState();
  const currentRequest = buildRequest({ mode: after.mode, scenarios: [after.scenarios.A, after.scenarios.B], thresholds: after.thresholds });
  after.setLastCompare({ request: currentRequest, response: fixture as CompareResponse }, after.planBRevision);
  expect(useStore.getState().lastCompare?.request).toEqual(currentRequest);
});
