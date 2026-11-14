import { useState } from "react";
import type { CompareResponse } from "../../api/types";
import styles from "./results.module.css";

export const RAW_ROW_LIMIT = 500;

const utc = (t: number): string => new Date(t * 1000).toISOString().replace(".000Z", "Z");

/**
 * Expert mode (PRD 6.3): raw time series and skyline as tables. Rendered only when opened;
 * long series show the first RAW_ROW_LIMIT rows here and the full series in CSV/JSON.
 */
export function RawData({ data }: { data: CompareResponse }) {
  const [open, setOpen] = useState(false);
  const [id, setId] = useState<"A" | "B">("A");
  const [view, setView] = useState<"series" | "skyline">("series");
  const s = data.scenarios.find((x) => x.id === id) ?? data.scenarios[0];
  const n = view === "series" ? s.series.t_unix.length : s.skyline.elev_deg.length;
  const shown = Math.min(n, RAW_ROW_LIMIT);

  return (
    <details className={styles.panel} onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary className={styles.rawSummary}>Raw data (Expert)</summary>
      {open && (
        <div className={styles.rawBody}>
          <div className={styles.rawControls}>
            <div role="group" aria-label="Plan" className="segmented">
              {data.scenarios.map((x) => (
                <button key={x.id} type="button" aria-pressed={id === x.id} onClick={() => setId(x.id)}>
                  Plan {x.id}
                </button>
              ))}
            </div>
            <div role="group" aria-label="Table" className="segmented">
              <button type="button" aria-pressed={view === "series"} onClick={() => setView("series")}>
                Time series
              </button>
              <button type="button" aria-pressed={view === "skyline"} onClick={() => setView("skyline")}>
                Skyline
              </button>
            </div>
            <span className={styles.muted}>
              {shown < n ? `First ${shown} of ${n} rows; download CSV or JSON for all.` : `${n} rows.`}
              {view === "series" ? ` Step ${s.meta.step_minutes} min.` : ` Azimuth step ${s.skyline.az_step_deg}°.`}
            </span>
          </div>
          <div className={`${styles.tableWrap} ${styles.rawWrap}`} tabIndex={0} role="region" aria-label={`Plan ${s.id} ${view === "series" ? "time series" : "skyline"} table`}>
            {view === "series" ? (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">UTC</th>
                    <th scope="col">Sun az (°)</th>
                    <th scope="col">Sun el (°)</th>
                    <th scope="col">Earth az (°)</th>
                    <th scope="col">Earth el (°)</th>
                    <th scope="col">Sun visible</th>
                    <th scope="col">Earth visible</th>
                  </tr>
                </thead>
                <tbody>
                  {s.series.t_unix.slice(0, shown).map((t, i) => (
                    <tr key={t}>
                      <th scope="row">{utc(t)}</th>
                      <td>{s.series.sun_az[i].toFixed(2)}</td>
                      <td>{s.series.sun_el[i].toFixed(2)}</td>
                      <td>{s.series.earth_az[i].toFixed(2)}</td>
                      <td>{s.series.earth_el[i].toFixed(2)}</td>
                      <td>{s.series.sun_vis[i] ? "yes" : "no"}</td>
                      <td>{s.series.earth_vis[i] ? "yes" : "no"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">Azimuth (°)</th>
                    <th scope="col">Skyline elevation (°)</th>
                    <th scope="col">Blocking distance (km)</th>
                  </tr>
                </thead>
                <tbody>
                  {s.skyline.elev_deg.slice(0, shown).map((e, i) => (
                    <tr key={i}>
                      <th scope="row">{(i * s.skyline.az_step_deg).toFixed(1)}</th>
                      <td>{e.toFixed(2)}</td>
                      <td>{s.skyline.block_dist_km ? s.skyline.block_dist_km[i].toFixed(2) : "n/a (geometric)"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </details>
  );
}
