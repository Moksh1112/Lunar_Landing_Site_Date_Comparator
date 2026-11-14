import type { CompareRequest, CompareResponse } from "../../api/types";
import { buildCsv, buildJson, downloadText, exportFileName } from "./exportData";

type Props = { response: CompareResponse; request: CompareRequest | null; className?: string };

/** CSV/JSON download, built in the browser with a provenance block (F25). */
export function ExportButtons({ response, request, className }: Props) {
  return (
    <div className={`${className ?? ""} no-print`} role="group" aria-label="Export">
      <button
        type="button"
        onClick={() => downloadText(buildCsv(response, request), exportFileName(response, "csv"), "text/csv;charset=utf-8")}
      >
        Download CSV
      </button>
      <button
        type="button"
        onClick={() => downloadText(buildJson(response, request), exportFileName(response, "json"), "application/json")}
      >
        Download JSON
      </button>
    </div>
  );
}
