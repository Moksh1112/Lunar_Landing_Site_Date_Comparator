import { useId, useState, type PointerEvent } from "react";
import { scaleLinear } from "d3-scale";
import type { ScenarioResult } from "../../api/types";
import type { TimelineLanesProps } from "./contracts";
import { symmetricDifference, visibilityAt, windowToRange } from "./chartMath";
import { sampleTime } from "./SampleInspector";
import { ChartTooltip } from "./ChartTooltip";
import type { TooltipPoint } from "./tooltipMath";
import { visibilityGaps } from "../gap/gap";
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

export function TimelineLanes({ data, alignBy, scrubT, onScrub, highlight = null }: TimelineLanesProps) {
  const [anchor, setAnchor] = useState<TooltipPoint | null>(null);
  const tooltipId = useId();
  const [inspectT, setInspectT] = useState<number | null>(null);
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
  const dayStep = Math.max(1, Math.ceil(dMax / DAY / 8));
  const ticks = cal
    ? calendarTicks(dMin, dMax)
    : Array.from({ length: Math.floor(dMax / DAY / dayStep) + 1 }, (_, k) => ({ v: k * dayStep * DAY, label: `day ${k * dayStep + 1}` }));

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
  const inspected = Math.min(Math.max(inspectT ?? value, dMin), dMax);
  const pointTime = (e: PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return Math.min(Math.max(x.invert((e.clientX - rect.left) / rect.width * W), dMin), dMax);
  };
  const describe = (v: number) => cal ? sampleTime(v) : `Mission day ${Math.floor(v / DAY) + 1}, +${(v / 3600).toFixed(1)} h`;

  if (!hasData) return <p className={styles.caption}>No timeline data available.</p>;

  return (
    <figure className={styles.figure} >
      <h3 className={styles.title}>Timeline — {cal ? "calendar (UTC)" : "mission day"}</h3>
      <div className={styles.chartCanvas}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className={styles.svg}
        role="img"
        aria-label={`Sun, Earth and both-visible windows for A and B, with a difference lane. ${summary}.`}
        onPointerMove={e => { setInspectT(pointTime(e)); setAnchor({ x: e.clientX, y: e.clientY }); }}
        onPointerLeave={() => { setInspectT(null); setAnchor(null); }}
        onPointerDown={e => { const time = pointTime(e); setInspectT(time); onScrub(time); setAnchor({ x: e.clientX, y: e.clientY }); }}
        tabIndex={0} aria-describedby={anchor ? tooltipId : undefined}
        onBlur={() => { setInspectT(null); setAnchor(null); }}
        onFocus={e => { const r = e.currentTarget.getBoundingClientRect(); setAnchor({ x: r.x + r.width / 2, y: r.y + r.height / 2 }); }}
        onKeyDown={e => {
          if (e.key === "Escape") { setAnchor(null); return; }
          if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
            e.preventDefault(); const next = Math.min(Math.max(inspected + (e.key === "ArrowRight" ? 600 : -600), dMin), dMax); setInspectT(next); onScrub(next);
            const r = e.currentTarget.getBoundingClientRect(); setAnchor({ x: r.x + r.width / 2, y: r.y + r.height / 2 });
          }
        }}
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
                <rect key={j} x={x(s)} y={y0} width={Math.max(1, x(e) - x(s))} height={LANE_H} className={l.cls}>
                  <title>{l.label}: {describe(s)} to {describe(e)} ({((e - s) / 3600).toFixed(1)} h)</title>
                </rect>
              ))}
            </g>
          );
        })}
        {(() => {
          // Outline the focused plan's longest gap across its three lanes.
          const s = highlight ? data.scenarios.find((x) => x.id === highlight) : undefined;
          const r = s ? visibilityGaps(s) : null;
          if (!s || !r || r.state !== "gaps") return null;
          const off = cal ? 0 : t0(s);
          const first = s.id === "A" ? 0 : 3;
          const y0 = M.top + first * (LANE_H + GAP) - 3;
          const x0 = x(r.longest.startUnix - off);
          return (
            <rect
              x={x0}
              y={y0}
              width={Math.max(2, x(r.longest.endUnix - off) - x0)}
              height={3 * (LANE_H + GAP)}
              className={styles.gapBand}
            >
              <title>{`Plan ${s.id} longest visibility gap`}</title>
            </rect>
          );
        })()}
        <line x1={x(inspected)} x2={x(inspected)} y1={M.top} y2={H - M.bottom} className={styles.scrubLine} />
      </svg>
      <ChartTooltip anchor={anchor} id={tooltipId}>
        <div className={styles.tooltipContent}><strong>{describe(inspected)}</strong>{[A, B].map(s => <span key={s.id}><b>Plan {s.id}</b>: {visibilityAt(s, cal ? inspected : t0(s) + inspected)}</span>)}</div>
      </ChartTooltip>
      </div>
      <p className={styles.caption}>Filled bars mean visible; gaps mean hidden. Both means Sun and Earth together. Difference marks times when only one plan has both. Hover to inspect, tap to move the shared time, or use the time slider.</p>
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
          onChange={(e) => { setInspectT(null); setAnchor(null); onScrub(Number(e.target.value)); }}
        />
      </label>
      <figcaption className={styles.caption}>{summary}.</figcaption>
    </figure>
  );
}
