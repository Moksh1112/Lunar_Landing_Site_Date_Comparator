import { Link } from "react-router";
import type { CompareRequest, CompareResponse } from "../../api/types";
import { buildCsv, buildJson, downloadText, exportFileName } from "./exportData";
import styles from "./export.module.css";

type Props = { response: CompareResponse; request: CompareRequest | null; className?: string; withReport?: boolean };

/** One secondary Export control: CSV/JSON (built in the browser with provenance, F25) and the printable report. */
export function ExportButtons({ response, request, className, withReport = false }: Props) {
  return (
    <details className={`${styles.menu} ${className ?? ""} no-print`}>
      <summary>Export</summary>
      <div className={styles.items} role="group" aria-label="Export">
        <button type="button" onClick={() => downloadText(buildCsv(response, request), exportFileName(response, "csv"), "text/csv;charset=utf-8")}>
          Download CSV
        </button>
        <button type="button" onClick={() => downloadText(buildJson(response, request), exportFileName(response, "json"), "application/json")}>
          Download JSON
        </button>
        {withReport && (
          <Link to="/report" className="btn">
            Open printable report
          </Link>
        )}
      </div>
    </details>
  );
}
