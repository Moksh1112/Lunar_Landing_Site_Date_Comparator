import { useMemo } from "react";
import { Link } from "react-router";
import { EmptyState } from "../../components/EmptyState";
import { SyntheticBadge } from "../../components/SyntheticBadge";
import { useStore } from "../../store";
import { sharedYRange } from "../compare/compareForm";
import { HorizonPanorama } from "../compare/HorizonPanorama";
import { ResultsSummary } from "../compare/ResultsSummary";
import { TimelineLanes } from "../compare/TimelineLanes";
import { ExportButtons } from "../export/ExportButtons";
import { buildProvenance } from "../export/exportData";
import styles from "./report.module.css";

const LIMITS = [
  "Planning and education aid only. Not a safety certification.",
  "Sunlight is not power: this is not a wattage prediction.",
  "Earth in view is not a radio link: no link is guaranteed.",
];

export function ReportPage() {
  const last = useStore((s) => s.lastCompare);
  const thresholds = useStore((s) => s.thresholds);
  const range = useMemo(() => (last ? sharedYRange(last.response.scenarios) : null), [last]);

  if (!last || !range) {
    return (
      <main className={styles.page}>
        <h1>Comparison report</h1>
        <EmptyState title="No comparison to report yet">
          <p>
            Run a comparison first. The report then shows verdicts, differences, charts, metrics and provenance, ready to
            print or save as PDF.
          </p>
          <Link to="/" className="btn">Go to Compare</Link>
        </EmptyState>
      </main>
    );
  }

  const { request, response } = last;
  const prov = buildProvenance(response, request);
  return (
    <main className={styles.page}>
      <header className={styles.head}>
        <div className={styles.titleRow}>
          <h1>Comparison report</h1>
          {prov.data_label !== "REAL" && <SyntheticBadge />}
        </div>
        <p className={styles.meta}>
          {response.scenarios[0].label} (A) vs {response.scenarios[1].label} (B) · mode {request.mode.replace(/_/g, " ")} ·
          generated {prov.exported_at}
        </p>
        {prov.data_label !== "REAL" && (
          <p className={styles.synthetic}>
            SYNTHETIC: these numbers come from a fixed test response, not a computation. They do not reflect the plans
            listed below.
          </p>
        )}
        <div className={`${styles.actions} no-print`}>
          <button type="button" className="btn-primary" onClick={() => window.print()}>
            Print or save as PDF
          </button>
          <ExportButtons response={response} request={request} className={styles.actions} />
          <Link to="/" className="btn">Back to Compare</Link>
        </div>
      </header>

      <section className={styles.section} aria-labelledby="plans-h">
        <h2 id="plans-h">Plans</h2>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Plan</th>
                <th scope="col">Site</th>
                <th scope="col">Latitude</th>
                <th scope="col">Longitude (E)</th>
                <th scope="col">Start (UTC)</th>
                <th scope="col">Mission</th>
              </tr>
            </thead>
            <tbody>
              {request.scenarios.map((s) => (
                <tr key={s.id}>
                  <th scope="row">{s.id}: {s.label}</th>
                  <td>{s.site.name ?? s.site.site_id ?? "Custom point"}</td>
                  <td>{s.site.lat_deg}°</td>
                  <td>{s.site.lon_east_deg}°</td>
                  <td>{s.start_utc}</td>
                  <td>{s.mission_hours} h</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={styles.small}>
          Thresholds sent: sunlight ≥ {request.thresholds.sun_pct_min} %, Earth ≥ {request.thresholds.earth_pct_min} %,
          dark gap ≤ {request.thresholds.dark_gap_h_max} h, blackout ≤ {request.thresholds.blackout_h_max} h. Step{" "}
          {request.step_minutes} min, observer height {request.observer_height_m} m.
        </p>
      </section>

      <section className={styles.section} aria-label="Results">
        <ResultsSummary data={response} expert thresholds={thresholds} sentThresholds={request.thresholds} />
      </section>

      <section className={styles.section} aria-labelledby="charts-h">
        <h2 id="charts-h">Horizon and timeline</h2>
        <div className={styles.charts}>
          {response.scenarios.map((s) => (
            <HorizonPanorama key={s.id} scenario={s} scrubT={null} yMinDeg={range.yMin} yMaxDeg={range.yMax} />
          ))}
          <TimelineLanes data={response} alignBy="calendar" scrubT={null} onScrub={() => undefined} />
        </div>
      </section>

      <section className={styles.section} aria-labelledby="prov-h">
        <h2 id="prov-h">Provenance</h2>
        <dl className={styles.prov}>
          <div><dt>Data label</dt><dd>{prov.data_label}</dd></div>
          <div><dt>Contract version</dt><dd>{prov.contract_version}</dd></div>
          <div><dt>Data manifest</dt><dd>{prov.data_manifest}</dd></div>
          {prov.scenarios.map((s) => (
            <div key={s.id}>
              <dt>Plan {s.id}</dt>
              <dd>
                {s.ephemeris}; kernels {s.kernels.join(", ") || "none listed"}; horizon {s.horizon_mode}; DEM {s.dem ?? "none"};
                step {s.step_minutes} min; observer {s.observer_height_m} m; app {s.app_version}; computed {s.computed_at}
              </dd>
            </div>
          ))}
        </dl>
        <h3>Limits</h3>
        <ul className={styles.small}>
          {LIMITS.map((l) => <li key={l}>{l}</li>)}
        </ul>
      </section>
    </main>
  );
}
