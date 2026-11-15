import { useId, useState, type PointerEvent } from "react";
import { scaleLinear } from "d3-scale";
import { area, line } from "d3-shape";
import type { HorizonPanoramaProps } from "./contracts";
import { countVisible, nearestIndex, nearestTrackSample, splitAtWrap } from "./chartMath";
import { SampleInspector } from "./SampleInspector";
import { ChartTooltip } from "./ChartTooltip";
import { SmoothMarker } from "./SmoothMarker";
import type { TooltipPoint } from "./tooltipMath";
import styles from "./charts.module.css";

const W = 720;
const H = 260;
const M = { top: 12, right: 16, bottom: 28, left: 40 };
const COMPASS: [number, string][] = [[0, "N"], [90, "E"], [180, "S"], [270, "W"], [360, "N"]];

export function HorizonPanorama({ scenario, scrubT, yMinDeg, yMaxDeg }: HorizonPanoramaProps) {
  const { skyline, series, label } = scenario;
  const [anchor, setAnchor] = useState<TooltipPoint | null>(null);
  const tooltipId = useId();
  const [inspected, setInspected] = useState<number | null>(null);
  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const vx = ((e.clientX - r.left) / r.width) * W;
    const az = ((vx - M.left) / (W - M.left - M.right)) * 360;
    if (az < 0 || az > 360) { setAnchor(null); return; }
    setAnchor({ x: e.clientX, y: e.clientY });
    const vy = ((e.clientY - r.top) / r.height) * H;
    const closest = nearestTrackSample(series, (a, el) => ({ x: x(a), y: y(el) }), { x: vx, y: vy });
    if (closest) setInspected(closest.index);
  };
  const x = scaleLinear().domain([0, 360]).range([M.left, W - M.right]);
  const y = scaleLinear().domain([yMinDeg, yMaxDeg]).range([H - M.bottom, M.top]);

  const skyPoints = skyline.elev_deg.map((e, i) => ({ az: i * skyline.az_step_deg, el: e }));
  const skyPath =
    area<{ az: number; el: number }>()
      .x((d) => x(d.az))
      .y0(y(yMinDeg))
      .y1((d) => y(Math.min(Math.max(d.el, yMinDeg), yMaxDeg)))(skyPoints) ?? "";

  const pathD = line<{ x: number; y: number }>()
    .x((p) => x(p.x))
    .y((p) => y(p.y));
  const sunSegs = splitAtWrap(series.sun_az, series.sun_el, series.sun_vis);
  const earthSegs = splitAtWrap(series.earth_az, series.earth_el, series.earth_vis);

  const idx = scrubT === null ? -1 : nearestIndex(series.t_unix, scrubT);
  const readIndex = Math.min(Math.max(inspected ?? (idx >= 0 ? idx : 0), 0), series.t_unix.length - 1);
  const yTicks = y.ticks(5);

  const skyMin = skyline.elev_deg.length ? Math.min(...skyline.elev_deg) : 0;
  const skyMax = skyline.elev_deg.length ? Math.max(...skyline.elev_deg) : 0;
  const n = series.t_unix.length;
  const summary = `Skyline from ${skyMin.toFixed(1)}° to ${skyMax.toFixed(1)}°; Sun visible in ${countVisible(series.sun_vis)} of ${n} samples; Earth in ${countVisible(series.earth_vis)}.`;
  const title = `${label} — horizon`;

  const renderSegs = (segs: ReturnType<typeof splitAtWrap>, cls: string, key: string) =>
    segs.map((s, i) => {
      const d = pathD(s.points);
      if (!d) return null;
      return <path key={`${key}${i}`} d={d} className={`${styles.path} ${cls} ${s.visible ? "" : styles.dotted}`} />;
    });

  return (
    <figure className={styles.figure} >
      <h3 className={styles.title}>{title}</h3>
      <div className={styles.chartCanvas}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className={styles.svg}
        role="img"
        aria-label={`${title}. ${summary}`}
        onPointerMove={onMove}
        onPointerDown={onMove}
        tabIndex={0}
        aria-describedby={anchor ? tooltipId : undefined}
        onPointerLeave={() => { setAnchor(null); setInspected(null); }}
        onBlur={() => { setAnchor(null); setInspected(null); }}
        onFocus={e => { const r = e.currentTarget.getBoundingClientRect(); setAnchor({ x: r.x + r.width / 2, y: r.y + r.height / 2 }); }}
        onKeyDown={e => {
          if (e.key === "Escape") { setAnchor(null); return; }
          if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
            e.preventDefault(); setInspected(Math.min(Math.max(readIndex + (e.key === "ArrowRight" ? 1 : -1), 0), n - 1));
            const r = e.currentTarget.getBoundingClientRect(); setAnchor({ x: r.x + r.width / 2, y: r.y + r.height / 2 });
          }
        }}
      >
        {yTicks.map((t) => (
          <g key={t}>
            <line x1={M.left} x2={W - M.right} y1={y(t)} y2={y(t)} className={styles.grid} />
            <text x={M.left - 6} y={y(t)} textAnchor="end" dominantBaseline="middle" className={styles.tick}>{t}°</text>
          </g>
        ))}
        {COMPASS.map(([a, l]) => (
          <g key={a}>
            <line x1={x(a)} x2={x(a)} y1={M.top} y2={H - M.bottom} className={styles.grid} />
            <text x={x(a)} y={H - 10} textAnchor="middle" className={styles.tick}>{l}</text>
          </g>
        ))}
        <path d={skyPath} className={styles.skyline} />
        {renderSegs(earthSegs, styles.earth, "e")}
        {renderSegs(sunSegs, styles.sun, "s")}
        {series.t_unix.length > 0 && (
          <>
            <SmoothMarker x={x(series.earth_az[readIndex])} y={y(series.earth_el[readIndex])} r={5} wrapWidth={W - M.left - M.right} className={`${styles.marker} ${styles.earth}`} />
            <SmoothMarker x={x(series.sun_az[readIndex])} y={y(series.sun_el[readIndex])} r={5} wrapWidth={W - M.left - M.right} className={`${styles.marker} ${styles.sun}`} />
          </>
        )}
      </svg>
      <ChartTooltip anchor={n > 0 ? anchor : null} id={tooltipId}><SampleInspector scenario={scenario} index={readIndex} /></ChartTooltip>
      </div>
      <p className={styles.caption}>Look around the site: N → E → S → W → N. Height is degrees above the local horizontal; shaded terrain blocks the view. Solid paths are visible, dotted paths are hidden. Hover a path to inspect a sample; focus the chart and use arrow keys for keyboard inspection.</p>
      <ul className={styles.legend} aria-hidden="true">
        <li><span className={`${styles.swatch} ${styles.sun}`} />Sun (visible)</li>
        <li><span className={`${styles.swatch} ${styles.swatchDotted} ${styles.sun}`} />Sun (below horizon)</li>
        <li><span className={`${styles.swatch} ${styles.earth}`} />Earth (visible)</li>
        <li><span className={`${styles.swatch} ${styles.swatchDotted} ${styles.earth}`} />Earth (below horizon)</li>
      </ul>
      <figcaption className={styles.caption}>{summary}</figcaption>
    </figure>
  );
}
