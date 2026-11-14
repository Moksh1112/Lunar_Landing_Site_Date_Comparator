import { useId, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getSites } from "../../api/client";
import { SiteSource } from "../../components/SiteSource";
import { useStore } from "../../store";
import { fieldKey, lonNote, type FieldErrors } from "./compareForm";
import styles from "./compare.module.css";

type Props = { id: "A" | "B"; errors: FieldErrors };
type F = "lat" | "lon" | "start" | "hours";

/** One segment of the plan slip: Site, Point, Landing and Mission rows for plan A or B. */
export function ScenarioCard({ id, errors }: Props) {
  const uid = useId();
  const idx = id === "A" ? 0 : 1;
  const sc = useStore((s) => s.scenarios[id]);
  const mode = useStore((s) => s.mode);
  const setScenario = useStore((s) => s.setScenario);
  const [showUnverified, setShowUnverified] = useState(false);
  const sites = useQuery({ queryKey: ["sites"], queryFn: getSites });

  const linkedSite = id === "B" && mode === "date_shift";
  const linkedDate = id === "B" && mode === "site_vs_site";
  const list = (sites.data?.sites ?? []).filter((s) => showUnverified || s.verified);
  const note = lonNote(sc.lon);

  const err = (f: F) => {
    const msg = errors[fieldKey(idx, f)];
    return msg ? (
      <span id={`${uid}-${f}-err`} className={styles.fieldError} role="alert">
        {msg}
      </span>
    ) : null;
  };
  const aria = (f: F) =>
    errors[fieldKey(idx, f)] ? { "aria-invalid": true as const, "aria-describedby": `${uid}-${f}-err` } : {};

  return (
    <fieldset className={styles.segment} data-id={id}>
      <legend className="visually-hidden">Plan {id}</legend>
      <div className={styles.segHead}>
        <span className={styles.cardTag} data-id={id} aria-hidden="true">{id}</span>
        <label className={styles.nameField}>
          <span className="visually-hidden">Plan {id} name</span>
          <input type="text" value={sc.label} maxLength={40} onChange={(e) => setScenario(id, { label: e.target.value })} />
        </label>
      </div>

      <div className={styles.row}>
        <label className={styles.rowLabel} htmlFor={`${uid}-site`}>Site</label>
        <div className={styles.rowBody}>
          <select
            id={`${uid}-site`}
            value={sc.siteId ?? ""}
            disabled={linkedSite || sites.isPending}
            onChange={(e) => {
              const site = sites.data?.sites.find((s) => s.site_id === e.target.value);
              if (site)
                setScenario(id, { siteId: site.site_id, siteName: site.name, lat: String(site.lat_deg), lon: String(site.lon_east_deg) });
              else setScenario(id, { siteId: null, siteName: null });
            }}
          >
            <option value="">Custom coordinates</option>
            {sc.siteId && !list.some((s) => s.site_id === sc.siteId) && <option value={sc.siteId}>{sc.siteName ?? sc.siteId}</option>}
            {list.map((s) => (
              <option key={s.site_id} value={s.site_id}>
                {s.name}
                {s.verified ? "" : " (SYNTHETIC, unverified)"}
              </option>
            ))}
          </select>
          {sites.isError && <span className={styles.fieldError}>Could not load the site list; enter coordinates instead.</span>}
          {linkedSite && <span className={styles.hint}>Follows Plan A (Date shift preset).</span>}
          <SiteSource siteId={sc.siteId} />
          <label className={styles.check}>
            <input type="checkbox" checked={showUnverified} onChange={(e) => setShowUnverified(e.target.checked)} />
            <span>Show unverified (SYNTHETIC) sites</span>
          </label>
        </div>
      </div>

      <div className={styles.row}>
        <span className={styles.rowLabel} id={`${uid}-pt`}>Point</span>
        <div className={`${styles.rowBody} ${styles.pair}`} role="group" aria-labelledby={`${uid}-pt`}>
          <label className={styles.mini}>
            <span>Latitude °, south −</span>
            <input type="text" inputMode="decimal" value={sc.lat} disabled={linkedSite} {...aria("lat")}
              onChange={(e) => setScenario(id, { lat: e.target.value, siteId: null, siteName: null })} />
            {err("lat")}
          </label>
          <label className={styles.mini}>
            <span>Longitude ° east</span>
            <input type="text" inputMode="decimal" value={sc.lon} disabled={linkedSite} {...aria("lon")}
              onChange={(e) => setScenario(id, { lon: e.target.value, siteId: null, siteName: null })} />
            {note && <span className={styles.hint}>{note}</span>}
            {err("lon")}
          </label>
        </div>
      </div>

      <div className={styles.row}>
        <label className={styles.rowLabel} htmlFor={`${uid}-start`}>Landing (UTC)</label>
        <div className={styles.rowBody}>
          <input id={`${uid}-start`} type="datetime-local" value={sc.startUtc} disabled={linkedDate} {...aria("start")}
            onChange={(e) => setScenario(id, { startUtc: e.target.value })} />
          {linkedDate && <span className={styles.hint}>Follows Plan A (Site vs site preset).</span>}
          {err("start")}
        </div>
      </div>

      <div className={styles.row}>
        <label className={styles.rowLabel} htmlFor={`${uid}-hours`}>Mission</label>
        <div className={styles.rowBody}>
          <span className={styles.suffixed}>
            <input id={`${uid}-hours`} type="number" min={1} max={8760} step="any" value={sc.missionHours} {...aria("hours")}
              onChange={(e) => setScenario(id, { missionHours: e.target.value })} />
            <span aria-hidden="true">h</span>
          </span>
          <span className={styles.hint}>Hours; 708 h is one lunar day.</span>
          {err("hours")}
        </div>
      </div>
    </fieldset>
  );
}
