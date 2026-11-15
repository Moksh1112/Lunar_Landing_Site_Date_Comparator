import { useId, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { getSites, postSweep } from "../../api/client";
import { ApiError } from "../../api/errors";
import type { SweepDay, SweepRequest, SweepResponse } from "../../api/types";
import { EmptyState } from "../../components/EmptyState";
import { ErrorState } from "../../components/ErrorState";
import { HorizonModeLabel } from "../../components/HorizonModeLabel";
import { SiteSource } from "../../components/SiteSource";
import { Skeleton } from "../../components/Skeleton";
import { SyntheticBadge } from "../../components/SyntheticBadge";
import { SyntheticResultNote } from "../../components/SyntheticResultNote";
import { useStore } from "../../store";
import { formatHours, formatPct, failedThresholdText } from "../compare/format";
import { lonNote } from "../compare/compareForm";
import { focusFirstInvalid } from "../../components/focus";
import {
  buildSweepRequest,
  candidateDays,
  parseDate,
  stepLabel,
  validateSweep,
  type SweepErrors,
  type SweepForm,
} from "./sweepForm";
import styles from "./bestdate.module.css";

const addDays = (date: string, n: number): string =>
  new Date(Date.parse(`${date}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);

function initialForm(a: { siteId: string | null; siteName: string | null; lat: string; lon: string; startUtc: string; missionHours: string }): SweepForm {
  const start = /^\d{4}-\d{2}-\d{2}/.test(a.startUtc) ? a.startUtc.slice(0, 10) : "2027-03-01";
  return { siteId: a.siteId, siteName: a.siteName, lat: a.lat, lon: a.lon, rangeStart: start, rangeEnd: addDays(start, 13), missionHours: a.missionHours };
}

export function BestDatePage() {
  const uid = useId();
  const planA = useStore((s) => s.scenarios.A);
  const thresholds = useStore((s) => s.thresholds);
  const loadAsB = useStore((s) => s.loadAsB);
  const navigate = useNavigate();
  const [form, setForm] = useState<SweepForm>(() => initialForm(planA));
  const [clientErrors, setClientErrors] = useState<SweepErrors>({});
  const [lastReq, setLastReq] = useState<SweepRequest | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [showUnverified, setShowUnverified] = useState(false);
  const sites = useQuery({ queryKey: ["sites"], queryFn: getSites });
  const sweep = useMutation<SweepResponse, ApiError, SweepRequest>({ mutationFn: postSweep });

  const serverErrors: SweepErrors = {};
  if (sweep.error instanceof ApiError) for (const d of sweep.error.details) serverErrors[d.field] = d.reason;
  const errors = { ...serverErrors, ...clientErrors };
  const set = (patch: Partial<SweepForm>) => setForm((f) => ({ ...f, ...patch }));

  const s0 = parseDate(form.rangeStart);
  const s1 = parseDate(form.rangeEnd);
  const nDays = s0 !== null && s1 !== null && s1 >= s0 ? candidateDays(s0, s1) : null;

  const submit = () => {
    if (sweep.isPending) return;
    const found = validateSweep(form);
    setClientErrors(found);
    if (Object.keys(found).length) {
      focusFirstInvalid();
      return;
    }
    const req = buildSweepRequest(form, thresholds);
    setLastReq(req);
    setSelected(null);
    sweep.mutate(req, { onSuccess: (r) => setSelected(r.top[0] ?? null) });
  };

  const load = (day: SweepDay, res: SweepResponse) => {
    loadAsB({
      label: `Best date ${day.date}`.slice(0, 40),
      siteId: res.site.site_id,
      siteName: res.site.name,
      lat: String(res.site.lat_deg),
      lon: String(res.site.lon_east_deg),
      startUtc: `${day.date}T00:00`,
      missionHours: lastReq ? String(lastReq.mission_hours) : form.missionHours,
    });
    navigate("/compare", { state: { loadedPlanB: true } });
  };

  const err = (k: string) =>
    errors[k] ? (
      <span id={`${uid}-${k}`} className={styles.fieldError} role="alert">
        {errors[k]}
      </span>
    ) : null;
  const aria = (k: string) => (errors[k] ? { "aria-invalid": true as const, "aria-describedby": `${uid}-${k}` } : {});
  const list = (sites.data?.sites ?? []).filter((s) => showUnverified || s.verified);
  const note = lonNote(form.lon);
  const data = sweep.data;

  return (
    <main>
      <header className={styles.pageHead}>
        <h1>Find the best landing date</h1>
        <p className={styles.lede}>
          Score every landing day in a range for one site, then load the best day into Plan B to compare it with Plan A.
        </p>
      </header>
      <div className={styles.layout}>
        <form
          className={styles.inputs}
          aria-label="Best-date inputs"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <fieldset className={styles.step}>
            <legend><span className={styles.stepNum} aria-hidden="true">1</span>Site</legend>
          <label className={styles.field}>
            <span>Library site</span>
            <select
              value={form.siteId ?? ""}
              disabled={sites.isPending}
              onChange={(e) => {
                const s = sites.data?.sites.find((x) => x.site_id === e.target.value);
                if (s) set({ siteId: s.site_id, siteName: s.name, lat: String(s.lat_deg), lon: String(s.lon_east_deg) });
                else set({ siteId: null, siteName: null });
              }}
            >
              <option value="">Custom coordinates</option>
              {form.siteId && !list.some((s) => s.site_id === form.siteId) && (
                <option value={form.siteId}>{form.siteName ?? form.siteId}</option>
              )}
              {list.map((s) => (
                <option key={s.site_id} value={s.site_id}>
                  {s.name}
                  {s.verified ? "" : " (SYNTHETIC, unverified)"}
                </option>
              ))}
            </select>
            {sites.isError && <span className={styles.fieldError}>Could not load the site list; enter coordinates instead.</span>}
            <SiteSource siteId={form.siteId} />
          </label>
          <label className={styles.check}>
            <input type="checkbox" checked={showUnverified} onChange={(e) => setShowUnverified(e.target.checked)} />
            <span>Show unverified (SYNTHETIC) sites</span>
          </label>
          <div className={styles.pair}>
            <label className={styles.field}>
              <span>Latitude (deg, south negative)</span>
              <input type="text" inputMode="decimal" value={form.lat} {...aria("site.lat_deg")} onChange={(e) => set({ lat: e.target.value, siteId: null, siteName: null })} />
              {err("site.lat_deg")}
            </label>
            <label className={styles.field}>
              <span>Longitude (deg east)</span>
              <input type="text" inputMode="decimal" value={form.lon} {...aria("site.lon_east_deg")} onChange={(e) => set({ lon: e.target.value, siteId: null, siteName: null })} />
              {note && <span className={styles.hint}>{note}</span>}
              {err("site.lon_east_deg")}
            </label>
          </div>
          </fieldset>
          <fieldset className={styles.step}>
            <legend><span className={styles.stepNum} aria-hidden="true">2</span>Landing days</legend>
          <div className={styles.pair}>
            <label className={styles.field}>
              <span>First landing day (UTC)</span>
              <input type="date" value={form.rangeStart} {...aria("range_start")} onChange={(e) => set({ rangeStart: e.target.value })} />
              {err("range_start")}
            </label>
            <label className={styles.field}>
              <span>Last landing day (UTC)</span>
              <input type="date" value={form.rangeEnd} {...aria("range_end")} onChange={(e) => set({ rangeEnd: e.target.value })} />
              {err("range_end")}
            </label>
          </div>
          <p className={styles.hint}>
            {nDays !== null ? `${nDays} candidate day${nDays === 1 ? "" : "s"} (up to 183 days).` : "Up to 183 days."}
          </p>
          </fieldset>
          <fieldset className={styles.step}>
            <legend><span className={styles.stepNum} aria-hidden="true">3</span>Mission</legend>
            <label className={styles.field}>
              <span>Mission length (hours)</span>
              <input type="number" min={1} max={8760} step="any" value={form.missionHours} {...aria("mission_hours")} onChange={(e) => set({ missionHours: e.target.value })} />
              <span className={styles.hint}>708 h is one lunar day.</span>
              {err("mission_hours")}
            </label>
            <p className={styles.hint}>Scored with the verdict thresholds set on Compare.</p>
          </fieldset>
          <div className={styles.go}>
          <button type="submit" className={`btn-primary ${styles.primary}`} disabled={sweep.isPending}>
            {sweep.isPending ? "Scoring days…" : "Find best dates"}
          </button>
          </div>
        </form>

        <section className={styles.results} aria-label="Best-date results" aria-live="polite" aria-busy={sweep.isPending}>
          {sweep.isPending ? (
            <div className={styles.stack}>
              <p className={styles.progress} role="status">
                Scoring {nDays ?? "the"} candidate days. A 60-day range can take up to 15 seconds.
              </p>
              <Skeleton height="5rem" label="Loading calendar" />
              <Skeleton height="14rem" label="Loading ranked list" />
            </div>
          ) : sweep.isError ? (
            <ErrorState error={sweep.error} onRetry={lastReq ? () => sweep.mutate(lastReq) : undefined} />
          ) : data ? (
            data.days.length === 0 ? (
              <EmptyState title="No candidate days were returned">
                <p>Try a different date range or site. No days means nothing was scored; it is not a failed verdict.</p>
                {data.meta.data_label !== "REAL" && <SyntheticBadge />}
              </EmptyState>
            ) : (
              <SweepResults data={data} selected={selected} onSelect={setSelected} onLoad={(d) => load(d, data)} />
            )
          ) : (
            <EmptyState title="Pick a site and a range of landing days">
              <p>The form starts from Plan A's site and start date. Each day is scored with the same thresholds as Compare.</p>
            </EmptyState>
          )}
        </section>
      </div>
    </main>
  );
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const weekday = (date: string): string => WEEKDAYS[new Date(`${date}T00:00:00Z`).getUTCDay()];

function SweepResults({ data, selected, onSelect, onLoad }: { data: SweepResponse; selected: string | null; onSelect: (d: string) => void; onLoad: (d: SweepDay) => void }) {
  const byDate = new Map(data.days.map((d) => [d.date, d]));
  const top = data.top.map((d) => byDate.get(d)).filter((d): d is SweepDay => d !== undefined);
  const sel = selected ? byDate.get(selected) : undefined;
  const counts = { green: 0, amber: 0, red: 0 };
  for (const d of data.days) counts[d.verdict.level]++;
  return (
    <div className={styles.stack}>
      <div className={styles.resultsHead}>
        <h2 className={styles.resultsTitle}>{data.site.name ?? "Custom point"}</h2>
        {data.meta.data_label !== "REAL" && <SyntheticBadge />}
        <HorizonModeLabel mode={data.meta.horizon_mode} />
        <span className={styles.muted}>{data.meta.dem ? `DEM ${data.meta.dem}` : "no DEM"}, {data.meta.ephemeris}</span>
        <SiteSource siteId={data.site.site_id} />
      </div>

      {data.meta.data_label !== "REAL" && <SyntheticResultNote />}
      <section className={styles.panel} aria-labelledby="cal-h">
        <div className={styles.panelHead}>
          <h3 id="cal-h"><span className={styles.stepNum} aria-hidden="true">4</span>Pick a landing day</h3>
          <span className={styles.muted}>Coloured by verdict; letter G / A / R repeats it in text.</span>
        </div>
        <ol className={styles.calendar}>
          {data.days.map((d) => (
            <li key={d.date}>
              <button
                type="button"
                className={`${styles.day} ${styles[d.verdict.level]}`}
                aria-pressed={selected === d.date}
                aria-label={`${d.date}: ${d.verdict.level}, rank ${d.rank}`}
                onClick={() => onSelect(d.date)}
              >
                <span className={styles.dayWk}>{weekday(d.date)}</span>
                <span className={styles.dayNum}>{d.date.slice(8)}</span>
                <span className={styles.dayLetter}>{d.verdict.level[0].toUpperCase()}</span>
              </button>
            </li>
          ))}
        </ol>
        <p className={styles.caption}>
          {data.days.length} days from {data.days[0].date} to {data.days[data.days.length - 1].date}: {counts.green} green, {counts.amber} amber,{" "}
          {counts.red} red. Best day: {data.top[0] ?? "none"}.
        </p>
      </section>

      {sel && (
        <section className={styles.panel} aria-labelledby="sel-h">
          <div className={styles.panelHead}>
            <h3 id="sel-h">
              {sel.date}, rank {sel.rank}
            </h3>
            <button type="button" className="btn-primary" onClick={() => onLoad(sel)}>
              Load as Plan B
            </button>
          </div>
          <DayDetail d={sel} />
        </section>
      )}

      <section className={styles.panel} aria-labelledby="rank-h">
        <div className={styles.panelHead}>
          <h3 id="rank-h">Top {top.length} days</h3>
          <span className={styles.muted}>Ranked by verdict, then hours with both Sun and Earth, then shortest dark gap.</span>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Rank</th>
                <th scope="col">Landing day</th>
                <th scope="col">Verdict</th>
                <th scope="col">Sun and Earth</th>
                <th scope="col">Longest dark</th>
                <th scope="col">Step</th>
                <th scope="col"><span className="visually-hidden">Action</span></th>
              </tr>
            </thead>
            <tbody>
              {top.map((d) => (
                <tr key={d.date}>
                  <td>{d.rank}</td>
                  <th scope="row">{d.date}</th>
                  <td><span className={`${styles.word} ${styles[d.verdict.level]}`}>{d.verdict.level}</span></td>
                  <td>{formatHours(d.metrics.both_hours)}</td>
                  <td>{formatHours(d.metrics.longest_dark_h)}</td>
                  <td className={styles.muted}>{stepLabel(d.refined)}</td>
                  <td>
                    <button type="button" onClick={() => onLoad(d)} aria-label={`Load ${d.date} as Plan B`}>
                      Load as B
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function DayDetail({ d }: { d: SweepDay }) {
  const thresholds = useStore((s) => s.thresholds);
  const m = d.metrics;
  return (
    <>
      <dl className={styles.stats}>
        <div><dt>Verdict</dt><dd className={`${styles.word} ${styles[d.verdict.level]}`}>{d.verdict.level}</dd></div>
        <div><dt>Sunlight</dt><dd>{formatHours(m.sun_hours)} ({formatPct(m.sun_pct)})</dd></div>
        <div><dt>Earth visible</dt><dd>{formatHours(m.earth_hours)} ({formatPct(m.earth_pct)})</dd></div>
        <div><dt>Sun and Earth</dt><dd>{formatHours(m.both_hours)}</dd></div>
        <div><dt>Longest dark gap</dt><dd>{formatHours(m.longest_dark_h)}</dd></div>
        <div><dt>Longest blackout</dt><dd>{formatHours(m.longest_blackout_h)}</dd></div>
      </dl>
      {d.verdict.failed.length > 0 && (
        <ul className={styles.failed}>
          {d.verdict.failed.map((f) => <li key={f}>{failedThresholdText(f, thresholds)}</li>)}
        </ul>
      )}
      <p className={styles.muted}>Computed at a {stepLabel(d.refined)}.</p>
    </>
  );
}
