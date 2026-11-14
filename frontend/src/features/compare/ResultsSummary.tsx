import { Link } from "react-router";
import { HorizonModeLabel } from "../../components/HorizonModeLabel";
import { SiteSource } from "../../components/SiteSource";
import { SyntheticBadge } from "../../components/SyntheticBadge";
import { Term } from "../../components/Term";
import type { CompareResponse, Meta, MetricKey, ScenarioResult, Thresholds, Verdict } from "../../api/types";
import { bRelativeToA, type ResultsSummaryProps } from "./contracts";
import {
  METRIC_KEYS,
  NA,
  failedThresholdText,
  formatDeltaMetric,
  formatMetric,
  formatSigned,
  metricLabel,
} from "./format";
import { computeVerdict, sameThresholds } from "./verdict";
import styles from "./results.module.css";

/** Delta strip metrics; `higherIsBetter` gives the plain-word direction for B relative to A. */
const PRIMARY: { key: MetricKey; label: string; higherIsBetter: boolean }[] = [
  { key: "sun_hours", label: "sunlight", higherIsBetter: true },
  { key: "earth_hours", label: "Earth", higherIsBetter: true },
  { key: "both_hours", label: "both", higherIsBetter: true },
  { key: "longest_dark_h", label: "longest dark gap", higherIsBetter: false },
  { key: "longest_blackout_h", label: "longest blackout", higherIsBetter: false },
];

const META_ROWS: [string, (m: Meta) => string][] = [
  ["Ephemeris", (m) => m.ephemeris],
  ["Kernels", (m) => (m.kernels.length ? m.kernels.join(", ") : NA)],
  ["Step (min)", (m) => String(m.step_minutes)],
  ["Observer height (m)", (m) => String(m.observer_height_m)],
  ["Computed at", (m) => m.computed_at],
  ["Contract version", (m) => m.contract_version],
];

const coords = (s: ScenarioResult): string =>
  `${s.site.lat_deg.toFixed(2)}°, ${s.site.lon_east_deg.toFixed(2)}° E`;

function VerdictCard({ s, verdict, recomputed, thresholds }: { s: ScenarioResult; verdict: Verdict; recomputed: boolean; thresholds?: Thresholds }) {
  return (
    <li className={`${styles.verdictCard} ${styles[`tone${s.id}`]}`}>
      <div className={styles.verdictHead}>
        <span className={styles.tag} aria-hidden="true">{s.id}</span>
        <div className={styles.verdictName}>
          <strong>{s.label}</strong>
          <span className={styles.muted}>{s.site.name ?? "Custom point"} · {coords(s)}</span>
        </div>
        <span className={`${styles.chip} ${styles[verdict.level]}`}>
          <span className="visually-hidden">{s.label}: </span>
          <span className={styles.word}>{verdict.level}</span>
        </span>
      </div>
      {verdict.failed.length > 0 ? (
        <ul className={styles.failed}>
          {verdict.failed.map((f) => (
            <li key={f}>{failedThresholdText(f, thresholds)}</li>
          ))}
        </ul>
      ) : (
        <p className={styles.passed}>Meets every threshold.</p>
      )}
      {recomputed && (
        <p className={styles.note}>
          Recomputed in your browser for the edited thresholds. Server verdict for the thresholds sent: {s.verdict.level}.
        </p>
      )}
    </li>
  );
}

function DeltaStrip({ data }: { data: CompareResponse }) {
  const text = PRIMARY.map((p) => `${formatSigned(bRelativeToA(data.deltas[p.key]), "h")} ${p.label}`).join(", ");
  return (
    <section aria-labelledby="delta-h" className={styles.panel}>
      <div className={styles.panelHead}>
        <h3 id="delta-h">B compared with A</h3>
        <span className={styles.muted}>Hours over the mission. Derived for display as −(A − B).</span>
      </div>
      <ul className={styles.deltas}>
        {PRIMARY.map((p) => {
          const v = bRelativeToA(data.deltas[p.key]);
          const zero = v === null || Number(Math.abs(v).toFixed(1)) === 0;
          const better = v !== null && !zero && (v > 0) === p.higherIsBetter;
          const dir = v === null ? "none" : zero ? "same" : better ? "better" : "worse";
          return (
            <li key={p.key} className={`${styles.delta} ${styles[dir]}`}>
              <span className={styles.deltaLabel}>{metricLabel(p.key)}</span>
              <span className={styles.deltaValue}>{formatSigned(v, "h")}</span>
              <span className={styles.deltaWord}>{dir === "none" ? NA : dir === "same" ? "no change" : `${dir} for B`}</span>
            </li>
          );
        })}
      </ul>
      <p className="visually-hidden">B vs A: {text}</p>
    </section>
  );
}

function SourceBadge({ s }: { s: ScenarioResult }) {
  const m = s.meta;
  return (
    <li className={styles.source}>
      <span className={`${styles.tag} ${styles[`tone${s.id}`]}`} aria-hidden="true">{s.id}</span>
      <strong>{s.label}</strong>
      <span className={styles.muted}>{m.ephemeris}</span>
      <HorizonModeLabel mode={m.horizon_mode} />
      <span className={styles.muted}>{m.dem ? `DEM ${m.dem}` : "no DEM"}</span>
      <span className={styles.muted}>step {m.step_minutes} min</span>
      {m.data_label !== "REAL" && <SyntheticBadge />}
      <SiteSource siteId={s.site.site_id} />
    </li>
  );
}

export function ResultsSummary({ data, expert, thresholds, sentThresholds }: ResultsSummaryProps) {
  const [a, b] = data.scenarios;
  const edited = thresholds !== undefined && sentThresholds !== undefined && !sameThresholds(thresholds, sentThresholds);
  const verdictFor = (s: ScenarioResult): Verdict => (edited && thresholds ? computeVerdict(s.metrics, thresholds) : s.verdict);

  return (
    <div className={styles.root}>
      <section aria-labelledby="verdict-h">
        <h3 id="verdict-h" className="visually-hidden">Verdicts</h3>
        <ul className={styles.verdicts}>
          {data.scenarios.map((s) => (
            <VerdictCard key={s.id} s={s} verdict={verdictFor(s)} recomputed={edited} thresholds={thresholds ?? sentThresholds} />
          ))}
        </ul>
      </section>

      <DeltaStrip data={data} />

      <section aria-labelledby="metrics-h" className={styles.panel}>
        <div className={styles.panelHead}>
          <h3 id="metrics-h">Metrics</h3>
          <span className={styles.muted}>
            {expert
              ? `Expert: 0.01° precision. Sample step A ${a.meta.step_minutes} min, B ${b.meta.step_minutes} min.`
              : "Rounded. Switch to Expert for full precision."}
          </span>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <caption className="visually-hidden">
              Metrics for {a.label} (A) and {b.label} (B); last column is A − B
            </caption>
            <thead>
              <tr>
                <th scope="col">Metric</th>
                <th scope="col"><span className={`${styles.tag} ${styles.toneA}`} aria-hidden="true">A</span><span className="visually-hidden">A</span></th>
                <th scope="col"><span className={`${styles.tag} ${styles.toneB}`} aria-hidden="true">B</span><span className="visually-hidden">B</span></th>
                <th scope="col">A − B</th>
              </tr>
            </thead>
            <tbody>
              {METRIC_KEYS.map((k) => (
                <tr key={k}>
                  <th scope="row">
                    {k === "sun_el_max_deg" ? <Term k="solar_elevation">{metricLabel(k)}</Term> : metricLabel(k)}
                  </th>
                  <td>{formatMetric(k, a.metrics[k], expert)}</td>
                  <td>{formatMetric(k, b.metrics[k], expert)}</td>
                  <td>{formatDeltaMetric(k, data.deltas[k], expert)}</td>
                </tr>
              ))}
            </tbody>
            {expert && (
              <tbody>
                <tr>
                  <th scope="rowgroup" colSpan={4} className={styles.groupRow}>Run details</th>
                </tr>
                {META_ROWS.map(([label, f]) => (
                  <tr key={label}>
                    <th scope="row">{label}</th>
                    <td>{f(a.meta)}</td>
                    <td>{f(b.meta)}</td>
                    <td>{NA}</td>
                  </tr>
                ))}
                <tr className={styles.methodRow}>
                  <th scope="row">Frame</th>
                  <td colSpan={3}>MOON_ME body-fixed (method constant, TRD; not reported per response)</td>
                </tr>
                <tr className={styles.methodRow}>
                  <th scope="row">Validation tolerances</th>
                  <td colSpan={3}>Not available until validation results are committed (see Methods)</td>
                </tr>
              </tbody>
            )}
          </table>
        </div>
      </section>

      <section aria-labelledby="source-h" className={styles.panel}>
        <div className={styles.panelHead}>
          <h3 id="source-h">Sources and method</h3>
          <Link to="/methods" className="no-print">How these numbers are computed</Link>
        </div>
        <ul className={styles.sources}>
          {data.scenarios.map((s) => (
            <SourceBadge key={s.id} s={s} />
          ))}
        </ul>
        <h4 className={styles.subhead}>Limits</h4>
        {data.limitations.length === 0 ? (
          <p className={styles.muted}>No limitations reported.</p>
        ) : (
          <ul className={styles.limits}>
            {data.limitations.map((l, i) => (
              <li key={i}>{l}</li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
