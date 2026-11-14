import type { ScenarioResult } from "../../api/types";
import { countVisible, nearestIndex, splitAtWrap } from "./chartMath";
import { ringPoint, ringRadius } from "./skyRingMath";
import styles from "./skyRing.module.css";

const S = 360;
const C = S / 2;
const R_OUT = 168; // horizon-band outer edge = lowest elevation on the shared scale
const R_IN = 64; // inner edge = highest elevation on the shared scale

type Props = { scenario: ScenarioResult; scrubT: number | null; yMinDeg: number; yMaxDeg: number };

/**
 * Sky ring: the horizon seen from the landing site, unrolled around a circle.
 * Azimuth runs clockwise from north at the top; elevation on the shared y scale runs inward.
 * Drawn only from the compare response (skyline + series); it is a chart, not terrain imagery.
 */
export function SkyRing({ scenario, scrubT, yMinDeg, yMaxDeg }: Props) {
  const { skyline, series, label, id } = scenario;
  const r = (el: number) => ringRadius(el, yMinDeg, yMaxDeg, R_OUT, R_IN);
  const pt = (az: number, el: number) => ringPoint(C, C, az, r(el));

  // Terrain band: from the outer edge (lowest elevation) up to the skyline at each azimuth.
  const n = skyline.elev_deg.length;
  let terrain = "";
  if (n > 0) {
    const outer = Array.from({ length: n + 1 }, (_, i) => ringPoint(C, C, (i % n) * skyline.az_step_deg, R_OUT));
    const inner = Array.from({ length: n + 1 }, (_, i) => pt((i % n) * skyline.az_step_deg, skyline.elev_deg[i % n]));
    terrain =
      `M${outer.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join("L")}Z ` +
      `M${inner.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join("L")}Z`;
  }

  const track = (az: number[], el: number[], vis: number[]) =>
    splitAtWrap(az, el, vis).map((seg) => ({
      visible: seg.visible,
      d: "M" + seg.points.map((p) => { const q = pt(p.x, p.y); return `${q.x.toFixed(1)},${q.y.toFixed(1)}`; }).join("L"),
    }));
  const sun = track(series.sun_az, series.sun_el, series.sun_vis);
  const earth = track(series.earth_az, series.earth_el, series.earth_vis);
  const t = scrubT ?? series.t_unix[0];
  const idx = series.t_unix.length ? nearestIndex(series.t_unix, t) : -1;
  const zero = yMinDeg < 0 && yMaxDeg > 0 ? r(0) : null;
  const summary = `Sun visible in ${countVisible(series.sun_vis)} of ${series.t_unix.length} samples, Earth in ${countVisible(series.earth_vis)}. Azimuth clockwise from north; elevation ${yMinDeg.toFixed(0)}° at the rim to ${yMaxDeg.toFixed(0)}° inside.`;

  return (
    <figure className={styles.figure} data-plan={id}>
      <div className={styles.tilt}>
        <svg viewBox={`0 0 ${S} ${S}`} className={styles.svg} role="img" aria-label={`Sky ring for plan ${id}, ${label}. ${summary}`}>
          <circle cx={C} cy={C} r={R_OUT} className={styles.sky} />
          <path d={terrain} className={styles.terrain} fillRule="evenodd" />
          {zero !== null && <circle cx={C} cy={C} r={zero} className={styles.zero} />}
          <circle cx={C} cy={C} r={R_IN} className={styles.inner} />
          {[0, 90, 180, 270].map((az) => {
            const a = ringPoint(C, C, az, R_OUT);
            const b = ringPoint(C, C, az, R_IN);
            return <line key={az} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className={styles.spoke} />;
          })}
          {earth.map((s, i) => <path key={`e${i}`} d={s.d} className={`${styles.track} ${styles.earth} ${s.visible ? "" : styles.hidden}`} />)}
          {sun.map((s, i) => <path key={`s${i}`} d={s.d} className={`${styles.track} ${styles.sun} ${s.visible ? "" : styles.hidden}`} />)}
          {idx >= 0 && (
            <>
              <circle {...xy(pt(series.earth_az[idx], series.earth_el[idx]))} r={6.5} className={`${styles.marker} ${styles.earthFill}`} />
              <circle {...xy(pt(series.sun_az[idx], series.sun_el[idx]))} r={7.5} className={`${styles.marker} ${styles.sunFill}`} />
            </>
          )}
          {(["N", "E", "S", "W"] as const).map((l, i) => {
            const p = ringPoint(C, C, i * 90, R_OUT + 11);
            return <text key={l} x={p.x} y={p.y} className={styles.compass} textAnchor="middle" dominantBaseline="central">{l}</text>;
          })}
          <text x={C} y={C - 6} className={styles.planId} textAnchor="middle">{id}</text>
          <text x={C} y={C + 16} className={styles.planSub} textAnchor="middle">{yMaxDeg.toFixed(0)}° elev.</text>
        </svg>
      </div>
      <figcaption className={styles.caption}>
        <strong className={styles.capTitle}>{label}</strong> {summary}
      </figcaption>
    </figure>
  );
}

const xy = (p: { x: number; y: number }) => ({ cx: p.x, cy: p.y });
