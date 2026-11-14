import { EmptyState } from "../../components/EmptyState";
import { safeHref } from "../../components/SiteSource";
import { SyntheticBadge } from "../../components/SyntheticBadge";
import { REVIEW_TEXT, SCOPE_TEXT, type Evidence, type EvidenceFile } from "./validationEvidence";
import styles from "./methods.module.css";

const num = (n: number | null | undefined): string => (n === null || n === undefined ? "n/a" : Number(n.toPrecision(10)).toString());

function EvidenceCard({ e, name }: { e: Evidence; name: string }) {
  return (
    <article className={styles.evidence} aria-labelledby={`ev-${name}`}>
      <header className={styles.evHead}>
        <h3 id={`ev-${name}`}>
          {e.check_id}: {e.title}
        </h3>
        <span className={`${styles.status} ${styles[e.status]}`}>{e.status}</span>
      </header>
      <ul className={styles.badges}>
        <li>{SCOPE_TEXT[e.scope]}</li>
        <li>{REVIEW_TEXT[e.review_status]}</li>
        <li>{e.data_label === "SYNTHETIC" ? <SyntheticBadge /> : "REAL inputs"}</li>
      </ul>
      {e.scope === "spot_check" && <p className={styles.caution}>Spot check only: this is not the full validation for {e.check_id}.</p>}
      {e.data_label === "SYNTHETIC" && <p className={styles.caution}>SYNTHETIC evidence: not a validation of real results.</p>}
      <p className={styles.muted}>{e.coverage}</p>
      <div className={styles.tableWrap} tabIndex={0} role="region" aria-label={`${e.check_id} rows`}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Case</th>
              <th scope="col">Metric</th>
              <th scope="col">Ours</th>
              <th scope="col">Reference</th>
              <th scope="col">|Error|</th>
              <th scope="col">Tolerance</th>
              <th scope="col">Result</th>
            </tr>
          </thead>
          <tbody>
            {e.rows.map((r, i) => (
              <tr key={i}>
                <th scope="row">{r.case}</th>
                <td>{r.metric}</td>
                <td>{num(r.actual)} {r.unit}</td>
                <td>{num(r.reference)} {r.unit}</td>
                <td>{r.abs_error === undefined ? "n/a" : `${num(r.abs_error)} ${r.unit}`}</td>
                <td>{r.tolerance === undefined ? "n/a" : `${num(r.tolerance)} ${r.unit}`}</td>
                <td className={styles[r.status]}>{r.status.replace("_", " ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <dl className={styles.facts}>
        <div>
          <dt>Sources</dt>
          <dd>
            <ul className={styles.plain}>
              {e.sources.map((s, i) => {
                const href = safeHref(s.reference);
                return (
                  <li key={i}>
                    {s.label}: {href ? <a href={href} target="_blank" rel="noopener noreferrer">{s.reference}</a> : <code>{s.reference}</code>}
                    {s.sha256 && <span className={styles.muted}> sha256 {s.sha256.slice(0, 12)}…</span>}
                  </li>
                );
              })}
            </ul>
          </dd>
        </div>
        <div><dt>Produced</dt><dd>{e.generated_at}, commit <code>{e.producer_commit.slice(0, 10)}</code></dd></div>
        <div><dt>Command</dt><dd><code className={styles.cmd}>{e.command}</code></dd></div>
        {e.limitations.length > 0 && (
          <div><dt>Limitations</dt><dd><ul className={styles.plain}>{e.limitations.map((l, i) => <li key={i}>{l}</li>)}</ul></dd></div>
        )}
      </dl>
    </article>
  );
}

export function EvidenceList({ files }: { files: EvidenceFile[] }) {
  if (files.length === 0)
    return (
      <EmptyState title="No validation results yet">
        <p>No files exist in <code>validation/results/</code>. No match with Horizons or PGDA is claimed until they are committed.</p>
      </EmptyState>
    );
  const missing = (["V1", "V2", "V3", "V4", "V5", "V6"] as const).filter(
    (id) => !files.some((f) => f.state === "ok" && f.evidence.check_id === id),
  );
  return (
    <div className={styles.evList}>
      {files.map((f) =>
        f.state === "ok" ? (
          <EvidenceCard key={f.name} e={f.evidence} name={f.name.replace(/\W/g, "-")} />
        ) : (
          <div key={f.name} className={styles.badFile} role="note">
            <strong>{f.state === "unsupported" ? "Unsupported evidence file" : "Invalid evidence file"}:</strong> <code>{f.name}</code>.{" "}
            {f.reason} It is not shown or counted.
          </div>
        ),
      )}
      {missing.length > 0 && <p className={styles.muted}>No evidence yet for {missing.join(", ")}.</p>}
    </div>
  );
}
