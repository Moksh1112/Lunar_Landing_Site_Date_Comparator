import { expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import fixture from "../../../../../fixtures/compare.ok.json";
import type { CompareResponse } from "../../../api/types";
import { absoluteTime, momentAt } from "../../compare/moment";
import { TimelineLanes } from "../../compare/TimelineLanes";
import { missionTime } from "../math";

it("keeps an hourly terrain tick and the mission-day timeline on the same sample in seconds", () => {
  const data = fixture as CompareResponse;
  const scenario = data.scenarios[0];
  const start = scenario.series.t_unix[0];
  const end = scenario.series.t_unix.at(-1)! - start;
  const time = missionTime(null, 0, end) + 3600;
  const absolute = absoluteTime(scenario, time, "mission_day")!;
  expect(absolute).toBe(start + 3600);
  const index = scenario.series.t_unix.indexOf(absolute);
  expect(index).toBeGreaterThanOrEqual(0);
  expect(momentAt(scenario, absolute)?.earthAz).toBe(scenario.series.earth_az[index]);
  const timeline = renderToStaticMarkup(<TimelineLanes data={data} alignBy="mission_day" scrubT={time} onScrub={() => {}} />);
  expect(timeline).toContain('value="3600"');
  expect(timeline).toContain("Time: day 1, +1.0 h");
});
