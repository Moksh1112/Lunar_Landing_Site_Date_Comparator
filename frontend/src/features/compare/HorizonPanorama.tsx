import { useState, type PointerEvent } from "react";
import { scaleLinear } from "d3-scale";
import { area, line } from "d3-shape";
import type { HorizonPanoramaProps } from "./contracts";
import { countVisible, nearestIndex, splitAtWrap } from "./chartMath";
import { skylineAt } from "./skyline";
import styles from "./charts.module.css";

const W = 720;
const H = 260;
const M = { top: 12, right: 16, bottom: 28, left: 40 };
const COMPASS: [number, string][] = [[0, "N"], [90, "E"], [180, "S"], [270, "W"], [360, "N"]];

export function HorizonPanorama({ scenario, scrubT, yMinDeg, yMaxDeg, expert = false }: HorizonPanoramaProps) {
  const { skyline, series, label } = scenario;
  const [hoverAz, setHoverAz] = useState<number | null>(null);
  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const vx = ((e.clientX - r.left) / r.width) * W;
    const az = ((vx - M.left) / (W - M.left - M.right)) * 360;
    setHoverAz(az >= 0 && az <= 360 ? az : null);
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
    <figure className={styles.figure}>
      <h3 className={styles.title}>{title}</h3>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className={styles.svg}
        role="img"
        aria-label={`${title}. ${summary}`}
        onPointerMove={expert ? onMove : undefined}
        onPointerLeave={expert ? () => setHoverAz(null) : undefined}
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
        {idx >= 0 && (
          <>
            <circle cx={x(series.earth_az[idx])} cy={y(series.earth_el[idx])} r={5} className={`${styles.marker} ${styles.earth}`} />
            <circle cx={x(series.sun_az[idx])} cy={y(series.sun_el[idx])} r={5} className={`${styles.marker} ${styles.sun}`} />
          </>
        )}
      </svg>
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
