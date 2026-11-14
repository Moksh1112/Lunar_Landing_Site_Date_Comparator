import { scaleLinear } from "d3-scale";
import type { ScenarioResult } from "../../api/types";
import type { TimelineLanesProps } from "./contracts";
import { symmetricDifference, windowToRange } from "./chartMath";
import styles from "./charts.module.css";

const W = 720;
const LANE_H = 22;
const GAP = 6;
const M = { top: 8, right: 16, bottom: 28, left: 88 };
const DAY = 86400;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

type Lane = { key: string; label: string; ranges: [number, number][]; cls: string };

const fmtH = (h: number) => `${h.toFixed(1)} h`;

function calendarTicks(d0: number, d1: number): { v: number; label: string }[] {
  const span = d1 - d0;
  const step = span <= 2 * DAY ? 6 * 3600 : DAY * Math.max(1, Math.ceil(span / DAY / 8));
  const out: { v: number; label: string }[] = [];
  for (let v = Math.ceil(d0 / step) * step; v <= d1; v += step) {
    const d = new Date(v * 1000);
    const hh = String(d.getUTCHours()).padStart(2, "0");
    out.push({
      v,
      label: step < DAY && d.getUTCHours() !== 0 ? `${hh}:00` : `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`,
    });
  }
  return out;
}

export function TimelineLanes({ data, alignBy, scrubT, onScrub }: TimelineLanesProps) {
  const [A, B] = data.scenarios;
  const t0 = (s: ScenarioResult) => s.series.t_unix[0] ?? 0;
  const tEnd = (s: ScenarioResult) => s.series.t_unix[s.series.t_unix.length - 1] ?? 0;
  const cal = alignBy === "calendar";

  const dMin = cal ? Math.min(t0(A), t0(B)) : 0;
  const dMax = cal ? Math.max(tEnd(A), tEnd(B)) : Math.max(tEnd(A) - t0(A), tEnd(B) - t0(B));
  const hasData = A.series.t_unix.length > 0 || B.series.t_unix.length > 0;

  const ranges = (s: ScenarioResult, k: "sun" | "earth" | "both") =>
    s.windows[k].map((w) => windowToRange(w, t0(s), alignBy));

  const bothA = ranges(A, "both");
  const bothB = ranges(B, "both");
  const lanes: Lane[] = [
    { key: "as", label: "A Sun", ranges: ranges(A, "sun"), cls: styles.barA },
    { key: "ae", label: "A Earth", ranges: ranges(A, "earth"), cls: styles.barA },
    { key: "ab", label: "A Both", ranges: bothA, cls: styles.barA },
    { key: "bs", label: "B Sun", ranges: ranges(B, "sun"), cls: styles.barB },
    { key: "be", label: "B Earth", ranges: ranges(B, "earth"), cls: styles.barB },
    { key: "bb", label: "B Both", ranges: bothB, cls: styles.barB },
    { key: "d", label: "Difference", ranges: symmetricDifference(bothA, bothB), cls: styles.barDiff },
  ];

  const H = M.top + lanes.length * (LANE_H + GAP) + M.bottom;
  const x = scaleLinear()
    .domain([dMin, dMax || dMin + 1])
    .range([M.left, W - M.right]);
  const ticks = cal
    ? calendarTicks(dMin, dMax)
    : Array.from({ length: Math.floor(dMax / DAY) + 1 }, (_, k) => ({ v: k * DAY, label: `day ${k + 1}` }));

  const value = scrubT === null ? dMin : Math.min(Math.max(scrubT, dMin), dMax);
  const summary = [A, B]
    .map(
      (s) =>
        `${s.id}: Sun ${fmtH(s.metrics.sun_hours)}, Earth ${fmtH(s.metrics.earth_hours)}, both ${fmtH(s.metrics.both_hours)}`,
    )
    .join("; ");
  const scrubText = cal
    ? `${new Date(value * 1000).toISOString().replace("T", " ").slice(0, 16)} UTC`
    : `day ${Math.floor(value / DAY) + 1}, +${(value / 3600).toFixed(1)} h`;

  if (!hasData) return <p className={styles.caption}>No timeline data available.</p>;

  return (
    <figure className={styles.figure}>
      <h3 className={styles.title}>Timeline — {cal ? "calendar (UTC)" : "mission day"}</h3>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className={styles.svg}
        role="img"
        aria-label={`Sun, Earth and both-visible windows for A and B, with a difference lane. ${summary}.`}
      >
        {ticks.map((t) => (
          <g key={t.v}>
            <line x1={x(t.v)} x2={x(t.v)} y1={M.top} y2={H - M.bottom} className={styles.grid} />
            <text x={x(t.v)} y={H - 10} textAnchor="middle" className={styles.tick}>{t.label}</text>
          </g>
        ))}
        {lanes.map((l, i) => {
          const y0 = M.top + i * (LANE_H + GAP);
          return (
            <g key={l.key}>
              <text x={M.left - 8} y={y0 + LANE_H / 2} textAnchor="end" dominantBaseline="middle" className={styles.laneLabel}>
                {l.label}
              </text>
              <line x1={M.left} x2={W - M.right} y1={y0 + LANE_H} y2={y0 + LANE_H} className={styles.axis} />
              {l.ranges.map(([s, e], j) => (
                <rect key={j} x={x(s)} y={y0} width={Math.max(1, x(e) - x(s))} height={LANE_H} className={l.cls} />
              ))}
            </g>
          );
        })}
        {scrubT !== null && (
          <line x1={x(value)} x2={x(value)} y1={M.top} y2={H - M.bottom} className={styles.scrubLine} />
        )}
      </svg>
      <label className={styles.scrubLabel}>
        <span>Time: {scrubText}</span>
        <input
          type="range"
          className={styles.scrubber}
          min={dMin}
          max={dMax}
          step={60}
          value={value}
          aria-valuetext={scrubText}
          onChange={(e) => onScrub(Number(e.target.value))}
        />
      </label>
      <figcaption className={styles.caption}>{summary}.</figcaption>
    </figure>
  );
}
