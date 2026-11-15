import { useState, type PointerEvent } from "react";
import { scaleLinear } from "d3-scale";
import { area, line } from "d3-shape";
import type { HorizonPanoramaProps } from "./contracts";
import { countVisible, nearestIndex, nearestTrackSample, splitAtWrap } from "./chartMath";
import { SampleInspector, sampleTime } from "./SampleInspector";
import { skylineAt } from "./skyline";
import styles from "./charts.module.css";

const W = 720;
const H = 260;
const M = { top: 12, right: 16, bottom: 28, left: 40 };
const COMPASS: [number, string][] = [[0, "N"], [90, "E"], [180, "S"], [270, "W"], [360, "N"]];

export function HorizonPanorama({ scenario, scrubT, yMinDeg, yMaxDeg, expert = false }: HorizonPanoramaProps) {
  const { skyline, series, label } = scenario;
  const [hoverAz, setHoverAz] = useState<number | null>(null);
  const [inspected, setInspected] = useState<number | null>(null);
  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const vx = ((e.clientX - r.left) / r.width) * W;
    const az = ((vx - M.left) / (W - M.left - M.right)) * 360;
    setHoverAz(az >= 0 && az <= 360 ? az : null);
    const vy = ((e.clientY - r.top) / r.height) * H;
    const closest = nearestTrackSample(series, (a, el) => ({ x: x(a), y: y(el) }), { x: vx, y: vy });
    if (closest) setInspected(closest.index);
  };
  const hover = expert && hoverAz !== null ? skylineAt(skyline, hoverAz) : null;
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
    <figure className={styles.figure} onKeyDown={e => { if (e.key === "Escape") setHoverAz(null); }}>
      <h3 className={styles.title}>{title}</h3>
      <div className={styles.chartCanvas}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className={styles.svg}
        role="img"
        aria-label={`${title}. ${summary}`}
        onPointerMove={onMove}
        onPointerDown={onMove}
        onPointerLeave={e => { if (e.pointerType === "mouse") setHoverAz(null); }}
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
        {hover && <line x1={x(hover.az)} x2={x(hover.az)} y1={M.top} y2={H - M.bottom} className={styles.scrubLine} opacity={0.5} />}
        {series.t_unix.length > 0 && (
          <>
            <circle cx={x(series.earth_az[readIndex])} cy={y(series.earth_el[readIndex])} r={5} className={`${styles.marker} ${styles.earth}`} />
            <circle cx={x(series.sun_az[readIndex])} cy={y(series.sun_el[readIndex])} r={5} className={`${styles.marker} ${styles.sun}`} />
          </>
        )}
      </svg>
      {hoverAz !== null && series.t_unix.length > 0 && <div className={styles.chartTooltip} role="tooltip" aria-hidden="true"><SampleInspector scenario={scenario} index={readIndex} /></div>}
      </div>
      <p className={styles.caption}>Look around the site: N → E → S → W → N. Height is degrees above the local horizontal; shaded terrain blocks the view. Solid paths are visible, dotted paths are hidden. Hover or tap a path to inspect the nearest sample.</p>
      {series.t_unix.length > 0 && <>
        <label className={styles.scrubLabel}>
          <span>Inspect {label}: {sampleTime(series.t_unix[readIndex])}</span>
          <input type="range" min={0} max={series.t_unix.length - 1} step={1} value={readIndex} className={styles.scrubber} aria-label={`Inspect ${label} horizon sample`} aria-valuetext={sampleTime(series.t_unix[readIndex])} onChange={e => setInspected(Number(e.target.value))} />
        </label>
        <SampleInspector scenario={scenario} index={readIndex} />
        {inspected !== null && <button type="button" className={styles.resetInspection} onClick={() => { setInspected(null); setHoverAz(null); }}>Follow shared timeline</button>}
      </>}
      {expert && (
        <p className={styles.hoverRead} aria-hidden="true">
          {hover
            ? `Azimuth ${hover.az.toFixed(1)}°: skyline ${hover.elev.toFixed(2)}°${hover.distKm !== null ? `, blocked at ${hover.distKm.toFixed(2)} km` : ""}`
            : "Point at the chart to read skyline values (also in Raw data below)."}
        </p>
      )}
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
