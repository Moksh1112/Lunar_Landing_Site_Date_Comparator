import { useState } from "react";
import { Link } from "react-router";
import { briefingFileName, buildBriefingHtml } from "../briefing/briefing";
import type { CompareRequest, CompareResponse } from "../../api/types";
import { buildCsv, buildJson, downloadText, exportFileName } from "./exportData";
import styles from "./export.module.css";

type Props = { response: CompareResponse; request: CompareRequest | null; className?: string; withReport?: boolean };

/** One secondary Export control: CSV/JSON (built in the browser with provenance, F25) and the printable report. */
export function ExportButtons({ response, request, className, withReport = false }: Props) {
  const [briefError, setBriefError] = useState<string | null>(null);
  const briefing = () => {
    setBriefError(null);
    try {
      downloadText(buildBriefingHtml(response, request), briefingFileName(response), "text/html;charset=utf-8");
    } catch (e) {
      setBriefError(`The briefing could not be created (${e instanceof Error ? e.message : "unknown error"}). Your result is unchanged; try again or use JSON.`);
    }
  };
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
        <button type="button" onClick={briefing}>
          Download offline briefing (HTML)
        </button>
        {briefError && <p role="alert" className={styles.error}>{briefError}</p>}
        {withReport && (
          <Link to="/report" className="btn">
            Open printable report
          </Link>
        )}
      </div>
    </details>
  );
}
