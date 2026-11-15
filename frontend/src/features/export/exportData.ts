// F25: CSV and JSON exports built in the browser from the compare response (CONTRACT "Not endpoints").
// Every export carries a provenance block: sources, kernel and DEM versions, settings, app version,
// and the data label. Fields not in contract v1.0 (e.g. a data manifest hash, C08) are reported as
// unavailable rather than invented.
import type { CompareRequest, CompareResponse, ScenarioResult } from "../../api/types";

export type Provenance = {
  generated_by: string;
  exported_at: string;
  contract_version: string;
  data_label: "REAL" | "SYNTHETIC" | "MIXED";
  data_manifest: string;
  request: CompareRequest | null;
  scenarios: {
    id: string;
    label: string;
    site: ScenarioResult["site"];
    ephemeris: string;
    kernels: string[];
    horizon_mode: string;
    dem: string | null;
    step_minutes: number;
    observer_height_m: number;
    app_version: string;
    computed_at: string;
    data_label: string;
  }[];
  limitations: string[];
  disclaimer: string;
};

const DISCLAIMER =
  "Planning and education aid. Not a safety certification, power (watt) prediction or guaranteed radio link.";

export function dataLabelOf(res: CompareResponse): Provenance["data_label"] {
  const labels = new Set(res.scenarios.map((s) => s.meta.data_label));
  if (labels.size > 1) return "MIXED";
  return labels.has("REAL") ? "REAL" : "SYNTHETIC";
}

export function buildProvenance(res: CompareResponse, req: CompareRequest | null, now = new Date()): Provenance {
  return {
    generated_by: "Azelux web app (browser export)",
    exported_at: now.toISOString().replace(/\.\d{3}Z$/, "Z"),
    contract_version: res.contract_version,
    data_label: dataLabelOf(res),
    data_manifest: [...new Set(res.scenarios.map((s) => s.meta.manifest_sha256).filter(Boolean))].join(", ") || "not available in this response",
    request: req,
    scenarios: res.scenarios.map((s) => ({
      id: s.id,
      label: s.label,
      site: s.site,
      ephemeris: s.meta.ephemeris,
      kernels: s.meta.kernels,
      horizon_mode: s.meta.horizon_mode === "geometric" ? "geometric (geometric horizon only)" : s.meta.horizon_mode,
      dem: s.meta.dem,
      step_minutes: s.meta.step_minutes,
      observer_height_m: s.meta.observer_height_m,
      app_version: s.meta.app_version,
      computed_at: s.meta.computed_at,
      data_label: s.meta.data_label,
    })),
    limitations: res.limitations,
    disclaimer: DISCLAIMER,
  };
}

export function buildJson(res: CompareResponse, req: CompareRequest | null, now = new Date()): string {
  return JSON.stringify({ provenance: buildProvenance(res, req, now), result: res }, null, 2);
}

const csvCell = (v: unknown): string => {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const row = (cells: unknown[]): string => cells.map(csvCell).join(",");

/**
 * One CSV file: "#"-prefixed provenance lines, a metrics table, then the per-step time series.
 * Spreadsheet tools show the "#" lines as text, so opening the file shows the provenance block.
 */
export function buildCsv(res: CompareResponse, req: CompareRequest | null, now = new Date()): string {
  const p = buildProvenance(res, req, now);
  const lines: string[] = [];
  lines.push(`# Azelux export - data label: ${p.data_label}`);
  lines.push(`# exported_at: ${p.exported_at}; contract_version: ${p.contract_version}`);
  for (const s of p.scenarios) {
    lines.push(
      `# scenario ${s.id} (${JSON.stringify(s.label)}): lat ${s.site.lat_deg}, lon_east ${s.site.lon_east_deg}; ephemeris ${s.ephemeris}; ` +
        `kernels ${s.kernels.join(" ") || "none listed"}; horizon ${s.horizon_mode}; DEM ${s.dem ?? "none"}; ` +
        `step ${s.step_minutes} min; observer ${s.observer_height_m} m; app ${s.app_version}; computed ${s.computed_at}; label ${s.data_label}`,
    );
  }
  if (req) {
    lines.push(`# thresholds: ${JSON.stringify(req.thresholds)}; mode: ${req.mode}`);
    lines.push(`# request: ${JSON.stringify(req)}`);
  }
  lines.push(`# data manifest: ${p.data_manifest}`);
  lines.push(`# deltas are A minus B`);
  lines.push(`# ${p.disclaimer}`);
  lines.push("");
  const keys = Object.keys(res.deltas) as (keyof CompareResponse["deltas"])[];
  lines.push(row(["metric", "A", "B", "A_minus_B"]));
  for (const k of keys) lines.push(row([k, res.scenarios[0].metrics[k], res.scenarios[1].metrics[k], res.deltas[k]]));
  lines.push(row(["verdict", res.scenarios[0].verdict.level, res.scenarios[1].verdict.level, ""]));
  lines.push("");
  lines.push(row(["scenario", "az_deg", "skyline_el_deg", "blocking_distance_km"]));
  for (const s of res.scenarios) {
    for (let i = 0; i < s.skyline.elev_deg.length; i++) {
      lines.push(row([s.id, i * s.skyline.az_step_deg, s.skyline.elev_deg[i], s.skyline.block_dist_km?.[i] ?? null]));
    }
  }
  lines.push("");
  lines.push(row(["scenario", "t_unix", "utc", "sun_az", "sun_el", "earth_az", "earth_el", "sun_vis", "earth_vis"]));
  for (const s of res.scenarios) {
    const se = s.series;
    for (let i = 0; i < se.t_unix.length; i++) {
      const t = se.t_unix[i];
      lines.push(
        row([s.id, t, new Date(t * 1000).toISOString().replace(".000Z", "Z"), se.sun_az[i], se.sun_el[i], se.earth_az[i], se.earth_el[i], se.sun_vis[i], se.earth_vis[i]]),
      );
    }
  }
  return lines.join("\n") + "\n";
}

export function exportFileName(res: CompareResponse, ext: "csv" | "json", now = new Date()): string {
  const stamp = now.toISOString().slice(0, 16).replace(/[-:T]/g, "");
  return `azelux-compare-${dataLabelOf(res).toLowerCase()}-${stamp}.${ext}`;
}

/** Browser download (no server round trip). */
export function downloadText(text: string, fileName: string, mime: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}


