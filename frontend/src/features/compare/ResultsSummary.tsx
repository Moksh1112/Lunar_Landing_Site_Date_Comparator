import { HorizonModeLabel } from "../../components/HorizonModeLabel";
import { SyntheticBadge } from "../../components/SyntheticBadge";
import type { CompareResponse, Meta, MetricKey, ScenarioResult } from "../../api/types";
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
import styles from "./results.module.css";

const PRIMARY: { key: MetricKey; label: string }[] = [
  { key: "sun_hours", label: "sunlight" },
  { key: "earth_hours", label: "Earth" },
  { key: "both_hours", label: "both" },
  { key: "longest_dark_h", label: "longest dark gap" },
  { key: "longest_blackout_h", label: "longest blackout" },
];

const META_ROWS: [string, (m: Meta) => string][] = [
  ["Ephemeris", (m) => m.ephemeris],
  ["Kernels", (m) => (m.kernels.length ? m.kernels.join(", ") : NA)],
  ["Step (min)", (m) => String(m.step_minutes)],
  ["Observer height (m)", (m) => String(m.observer_height_m)],
  ["Computed at", (m) => m.computed_at],
  ["Contract version", (m) => m.contract_version],
];

function VerdictChips({ scenarios }: { scenarios: CompareResponse["scenarios"] }) {
  return (
    <section aria-labelledby="verdict-h">
      <h3 id="verdict-h">Verdicts</h3>
      <ul className={styles.chips}>
        {scenarios.map((s) => (
          <li key={s.id} className={`${styles.chip} ${styles[s.verdict.level]}`}>
            {s.label}: <span className={styles.word}>{s.verdict.level}</span>
            {s.verdict.failed.length > 0 && (
              <ul className={styles.failed}>
                {s.verdict.failed.map((f) => (
                  <li key={f}>{failedThresholdText(f)}</li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function SourceBadge({ s }: { s: ScenarioResult }) {
  const m = s.meta;
  return (
    <li className={styles.source}>
      <strong className={s.id === "A" ? styles.colA : styles.colB}>{s.label}</strong>
      <span className={styles.muted}>{m.ephemeris}</span>
      <HorizonModeLabel mode={m.horizon_mode} />
      <span className={styles.muted}>{m.dem ?? "no DEM"}</span>
      <span className={styles.muted}>step {m.step_minutes} min</span>
      {m.data_label !== "REAL" && <SyntheticBadge />}
    </li>
  );
}

export function ResultsSummary({ data, expert }: ResultsSummaryProps) {
  const [a, b] = data.scenarios;
  const deltaText = PRIMARY.map(
    (p) => `${formatSigned(bRelativeToA(data.deltas[p.key]), "h")} ${p.label}`,
  ).join(", ");

  return (
    <div className={styles.root}>
      <VerdictChips scenarios={data.scenarios} />

      <p className={styles.delta}>
        <strong>B vs A:</strong> {deltaText}
      </p>

      <section aria-labelledby="metrics-h">
        <h3 id="metrics-h">Metrics</h3>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <caption>
              Metrics for {a.label} (A) and {b.label} (B); last column is A − B
            </caption>
            <thead>
              <tr>
                <th scope="col">Metric</th>
                <th scope="col" className={styles.colA}>A</th>
                <th scope="col" className={styles.colB}>B</th>
                <th scope="col">A − B</th>
              </tr>
            </thead>
            <tbody>
              {METRIC_KEYS.map((k) => (
                <tr key={k}>
                  <th scope="row">{metricLabel(k)}</th>
                  <td>{formatMetric(k, a.metrics[k], expert)}</td>
                  <td>{formatMetric(k, b.metrics[k], expert)}</td>
                  <td>{formatDeltaMetric(k, data.deltas[k], expert)}</td>
                </tr>
              ))}
            </tbody>
            {expert && (
              <tbody>
                <tr>
                  <th scope="rowgroup" colSpan={4}>Run details</th>
                </tr>
                {META_ROWS.map(([label, f]) => (
                  <tr key={label}>
                    <th scope="row">{label}</th>
                    <td>{f(a.meta)}</td>
                    <td>{f(b.meta)}</td>
                    <td>{NA}</td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>
        </div>
      </section>

      <section aria-labelledby="source-h">
        <h3 id="source-h">Sources</h3>
        <ul className={styles.sources}>
          {data.scenarios.map((s) => (
            <SourceBadge key={s.id} s={s} />
          ))}
        </ul>
      </section>

      <section aria-labelledby="limits-h">
        <h3 id="limits-h">Limits</h3>
        {data.limitations.length === 0 ? (
          <p className={styles.muted}>No limitations reported.</p>
        ) : (
          <ul>
            {data.limitations.map((l, i) => (
              <li key={i}>{l}</li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
