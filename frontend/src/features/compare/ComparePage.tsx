import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { ApiError } from "../../api/errors";
import type { CompareRequest, ScenarioResult } from "../../api/types";
import { ErrorState } from "../../components/ErrorState";
import { Skeleton } from "../../components/Skeleton";
import { SyntheticResultNote } from "../../components/SyntheticResultNote";
import { Term } from "../../components/Term";
import { useStore } from "../../store";
import { focusFirstInvalid } from "../../components/focus";
import { ExportButtons } from "../export/ExportButtons";
import { buildRequest, matchesComputedPlans, sharedYRange, validate, type CompareForm, type FieldErrors } from "./compareForm";
import { HorizonPanorama } from "./HorizonPanorama";
import { ModePresets } from "./ModePresets";
import { RawData } from "./RawData";
import { MomentReadout } from "./MomentReadout";
import { absoluteTime } from "./moment";
import { ResultsSummary } from "./ResultsSummary";
import { conclusion } from "./conclusion";
import { SkyRing } from "./SkyRing";
import { ScenarioCard } from "./ScenarioCard";
import { ThresholdsPanel } from "./ThresholdsPanel";
import { TimelineLanes } from "./TimelineLanes";
import { GapPanel } from "../gap/GapPanel";
import { TerrainPanel } from "../terrain3d/TerrainPanel";
import { useCompare } from "./useCompare";
import { createSingleFlight } from "../../lib/singleFlight";
import styles from "./compare.module.css";

const SiteMap = lazy(() => import("../map/SiteMap"));

// PRD 6.2: the starter example is computed once on first visit so the page is never empty.
let starterRan = false;

/** F3 map, loaded only when opened so the first page load stays small. */
function MapPicker() {
  const [open, setOpen] = useState(false);
  return (
    <details className={styles.disclosure} onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary>Pick on map</summary>
      {open && (
        <Suspense fallback={<Skeleton height="16rem" label="Loading map" />}>
          <SiteMap />
        </Suspense>
      )}
    </details>
  );
}

const fmtStart = (v: string): string => (v ? v.replace("T", " ") + " UTC" : "not set");

/** Compact A/B summary with the two primary controls; the full editor opens inline below. */
function PlansBar({ editorOpen, onEdit, onCompare, pending }: { editorOpen: boolean; onEdit: () => void; onCompare: () => void; pending: boolean }) {
  const scenarios = useStore((s) => s.scenarios);
  const mode = useStore((s) => s.mode);
  const MODE_TEXT = { site_vs_site: "Site vs site", date_shift: "Date shift", free: "Free" } as const;
  return (
    <div className={styles.plansBar}>
      <ul className={styles.planList} aria-label="Plans">
        {(["A", "B"] as const).map((id) => {
          const p = scenarios[id];
          return (
            <li key={id} className={styles.planSummary}>
              <span className={styles.cardTag} data-id={id} aria-hidden="true">{id}</span>
              <span className={styles.planText}>
                <strong>{p.label || `Plan ${id}`}</strong>
                <span>{p.siteName ?? `${p.lat}°, ${p.lon}° E`}</span>
                <span>{fmtStart(p.startUtc)}, {p.missionHours} h</span>
              </span>
            </li>
          );
        })}
      </ul>
      <div className={styles.barActions}>
        <span className={styles.modeChip}>{MODE_TEXT[mode]}</span>
        <button type="button" aria-expanded={editorOpen} aria-controls="plan-editor" onClick={onEdit}>
          {editorOpen ? "Close editor" : "Edit plans"}
        </button>
        <button type="button" className={`btn-primary ${styles.barCompare}`} onClick={onCompare} disabled={pending}>
          {pending ? "Comparing…" : "Compare"}
        </button>
      </div>
    </div>
  );
}

export function ComparePage() {
  const mode = useStore((s) => s.mode);
  const setMode = useStore((s) => s.setMode);
  const scenarios = useStore((s) => s.scenarios);
  const thresholds = useStore((s) => s.thresholds);
  const setThresholds = useStore((s) => s.setThresholds);
  const expert = useStore((s) => s.expert);
  const scrubT = useStore((s) => s.scrubT);
  const setScrubT = useStore((s) => s.setScrubT);
  const alignBy = useStore((s) => s.alignBy);
  const setAlignBy = useStore((s) => s.setAlignBy);
  const lastCompare = useStore((s) => s.lastCompare);
  const showNewCompare = useStore((s) => s.showNewCompare);
  const gapFocus = useStore((s) => s.gapFocus);

  const compare = useCompare();
  const [clientErrors, setClientErrors] = useState<FieldErrors>({});
  const [lastRequest, setLastRequest] = useState<CompareRequest | null>(null);
  const [editing, setEditing] = useState(false);

  const serverErrors: FieldErrors = {};
  if (compare.error instanceof ApiError) for (const d of compare.error.details) serverErrors[d.field] = d.reason;
  const errors = { ...serverErrors, ...clientErrors };
  const editorOpen = editing || Object.keys(errors).length > 0;

  // One request at a time: isPending is stale between two clicks in the same frame (double submit).
  const [gate] = useState(createSingleFlight);
  const run = (req: CompareRequest) => {
    if (!gate.start()) return;
    compare.mutate(req, {
      onSuccess: (response) => {
        showNewCompare({ request: req, response }); // opens on the longest visibility gap
        setEditing(false); // results take the workspace once a compare succeeds
      },
      onSettled: () => gate.end(),
    });
  };

  const submit = () => {
    if (compare.isPending) return;
    const form: CompareForm = { mode, scenarios: [scenarios.A, scenarios.B], thresholds };
    const found = validate(form);
    setClientErrors(found);
    if (Object.keys(found).length > 0) {
      setEditing(true);
      focusFirstInvalid();
      return;
    }
    const req = buildRequest(form);
    setLastRequest(req);
    setScrubT(null);
    run(req);
  };

  // The last successful compare lives in the store, so results survive navigation to Report and back.
  const shown = lastCompare;
  const data = shown?.response;
  const plansChanged = shown ? !matchesComputedPlans({ mode, scenarios: [scenarios.A, scenarios.B], thresholds }, shown.request) : false;
  const sentThresholds = shown?.request.thresholds;
  const range = useMemo(() => (data ? sharedYRange(data.scenarios) : null), [data]);
  // F17: one scrubber value, mapped to each plan's own absolute time (calendar or mission-day alignment).
  const scrubTimeFor = (s: ScenarioResult): number | null => (scrubT === null ? null : absoluteTime(s, scrubT, alignBy));
  const synthetic = data?.scenarios.some((s) => s.meta.data_label !== "REAL") ?? false;

  useEffect(() => {
    if (starterRan || lastCompare) return;
    const t = setTimeout(() => {
      starterRan = true;
      submit();
    }, 0);
    return () => clearTimeout(t);
    // Run once on first mount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className={styles.page}>
      <header className={styles.top}>
        <div className={styles.titleBlock}>
          <h1 id="compare-title">Compare two landing plans</h1>
          <p className={styles.lede}>Which plan keeps the Sun and Earth in view longer, and when?</p>
        </div>
        <PlansBar
          editorOpen={editorOpen}
          onEdit={() => setEditing((v) => !v)}
          onCompare={submit}
          pending={compare.isPending}
        />
      </header>

      <form
        id="plan-editor"
        className={styles.editor}
        hidden={!editorOpen}
        aria-labelledby="editor-title"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <h2 id="editor-title" className="visually-hidden">Edit plans</h2>
        <div className={styles.presetBlock}>
          <span className={styles.groupLabel} id="preset-label">Compare by</span>
          <ModePresets mode={mode} onChange={setMode} />
        </div>
        <div className={styles.segments}>
          <ScenarioCard id="A" errors={errors} />
          <ScenarioCard id="B" errors={errors} />
        </div>
        <div className={styles.more}>
          <MapPicker />
          <ThresholdsPanel value={thresholds} onChange={setThresholds} />
        </div>
        {errors["request"] && (
          <p className={styles.fieldError} role="alert">
            {errors["request"]}
          </p>
        )}
        <div className={styles.submitBar}>
          <button type="submit" className={`btn-primary ${styles.primary}`} disabled={compare.isPending}>
            {compare.isPending ? "Comparing…" : "Compare A and B"}
          </button>
          <button type="button" onClick={() => setEditing(false)}>Done</button>
          <Link to="/best-date" className={styles.secondaryLink}>Find a better date</Link>
        </div>
      </form>

        <section className={styles.results} aria-label="Results" aria-live="polite" aria-busy={compare.isPending}>
          {compare.isPending ? (
            <div className={styles.skeletons}>
              <p className={styles.progress} role="status">Computing both plans…</p>
              <Skeleton height="3.5rem" label="Loading conclusion" />
              <Skeleton height="16rem" label="Loading visibility diagram" />
              <Skeleton height="10rem" label="Loading sky plates" />
            </div>
          ) : compare.isError ? (
            <ErrorState error={compare.error} onRetry={lastRequest ? () => run(lastRequest) : undefined} />
          ) : data && range ? (
            <div className={styles.reveal} key={shown?.response.scenarios[0].meta.computed_at + String(shown?.request.scenarios[1].start_utc)}>
              <header className={styles.conclusion}>
                <div className={styles.metaRow}>
                  <ExportButtons response={data} request={shown?.request ?? lastRequest} className={styles.actions} withReport />
                </div>
                {plansChanged && <p role="status">Plans changed. Results below are from your previous comparison. Select Compare to update them.</p>}
                <h2 className={styles.answer}>{conclusion(data)}</h2>
                {synthetic && <SyntheticResultNote />}
              </header>
              <ResultsSummary
                data={data}
                expert={expert}
                thresholds={thresholds}
                sentThresholds={sentThresholds}
                middle={
                  <>
                    <section className={styles.diagram} aria-labelledby="when-h">
                      <div className={styles.sectionHead}>
                        <h3 id="when-h">When each plan has Sun, Earth and both</h3>
                        <div role="group" aria-label="Align timeline by" className="segmented">
                          <button type="button" aria-pressed={alignBy === "calendar"} onClick={() => setAlignBy("calendar")}>
                            Calendar date
                          </button>
                          <button type="button" aria-pressed={alignBy === "mission_day"} onClick={() => setAlignBy("mission_day")}>
                            Mission day
                          </button>
                        </div>
                      </div>
                      <div className={styles.plate}>
                        <TimelineLanes data={data} alignBy={alignBy} scrubT={scrubT} onScrub={setScrubT} highlight={gapFocus} />
                      </div>
                      <MomentReadout data={data} scrubT={scrubT} alignBy={alignBy} expert={expert} />
                    </section>
                    <GapPanel data={data} />
                    <details className={styles.secondary} open>
                    <summary>Sky and horizon views</summary>
                    <section className={styles.sky} aria-labelledby="stage-h">
                      <div className={styles.sectionHead}>
                        <h3 id="stage-h">The sky above each site</h3>
                        <p className={styles.hint}>
                          Schematic sky plates on one scale: north at the top, the <Term k="skyline">skyline</Term> shaded,
                          higher elevation toward the centre. Solid tracks are visible; dotted are below the skyline.
                        </p>
                      </div>
                      <div className={styles.rings}>
                        {data.scenarios.map((s) => (
                          <SkyRing key={s.id} scenario={s} scrubT={scrubTimeFor(s)} yMinDeg={range.yMin} yMaxDeg={range.yMax} />
                        ))}
                      </div>
                    </section>
                    <section className={styles.sky} aria-labelledby="where-h">
                      <div className={styles.sectionHead}>
                        <h3 id="where-h">Horizon panoramas</h3>
                        <span className={styles.hint}>Same elevation scale for both plans.</span>
                      </div>
                      <div className={styles.panoramas}>
                        {data.scenarios.map((s) => (
                          <HorizonPanorama key={s.id} scenario={s} scrubT={scrubTimeFor(s)} yMinDeg={range.yMin} yMaxDeg={range.yMax} expert={expert} />
                        ))}
                      </div>
                    </section>
                    </details>
                  </>
                }
              />
              <TerrainPanel key={data.scenarios[0].meta.computed_at} data={data} />
              {expert && <RawData data={data} />}
            </div>
          ) : (
            <p className={styles.progress}>Press Compare A and B to see the difference.</p>
          )}
        </section>
    </main>
  );
}

