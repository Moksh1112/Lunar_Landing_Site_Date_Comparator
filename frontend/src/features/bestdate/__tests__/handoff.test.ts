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
