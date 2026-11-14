import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { ApiError } from "../../api/errors";
import type { CompareRequest, ScenarioResult } from "../../api/types";
import { ErrorState } from "../../components/ErrorState";
import { Skeleton } from "../../components/Skeleton";
import { SyntheticBadge } from "../../components/SyntheticBadge";
import { SyntheticResultNote } from "../../components/SyntheticResultNote";
import { Term } from "../../components/Term";
import { useStore } from "../../store";
import { focusFirstInvalid } from "../../components/focus";
import { ExportButtons } from "../export/ExportButtons";
import { buildRequest, sharedYRange, validate, type CompareForm, type FieldErrors } from "./compareForm";
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
import { useCompare } from "./useCompare";
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
  const setLastCompare = useStore((s) => s.setLastCompare);

  const compare = useCompare();
  const [clientErrors, setClientErrors] = useState<FieldErrors>({});
  const [lastRequest, setLastRequest] = useState<CompareRequest | null>(null);

  const serverErrors: FieldErrors = {};
  if (compare.error instanceof ApiError) for (const d of compare.error.details) serverErrors[d.field] = d.reason;
  const errors = { ...serverErrors, ...clientErrors };

  const run = (req: CompareRequest) =>
    compare.mutate(req, { onSuccess: (response) => setLastCompare({ request: req, response }) });

  const submit = () => {
    if (compare.isPending) return;
    const form: CompareForm = { mode, scenarios: [scenarios.A, scenarios.B], thresholds };
    const found = validate(form);
    setClientErrors(found);
    if (Object.keys(found).length > 0) {
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
      <div className={styles.spread}>
        <form
          className={styles.slip}
          aria-labelledby="compare-title"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <header className={styles.slipHead}>
            <h1 id="compare-title">Compare two landing plans</h1>
            <p className={styles.lede}>Which plan keeps the Sun and Earth in view longer, and when?</p>
          </header>
          <div className={styles.presetBlock}>
            <span className={styles.groupLabel} id="preset-label">Compare by</span>
            <ModePresets mode={mode} onChange={setMode} />
          </div>
          <ScenarioCard id="A" errors={errors} />
          <div className={styles.perforation} aria-hidden="true" />
          <ScenarioCard id="B" errors={errors} />
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
                  {synthetic && <SyntheticBadge />}
                  <ExportButtons response={data} request={shown?.request ?? lastRequest} className={styles.actions} />
                  <Link to="/report" className="btn no-print">Open report</Link>
                </div>
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
                        <TimelineLanes data={data} alignBy={alignBy} scrubT={scrubT} onScrub={setScrubT} />
                      </div>
                      <MomentReadout data={data} scrubT={scrubT} alignBy={alignBy} expert={expert} />
                    </section>
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
                  </>
                }
              />
              {expert && <RawData data={data} />}
            </div>
          ) : (
            <p className={styles.progress}>Press Compare A and B to see the difference.</p>
          )}
        </section>
      </div>
    </main>
  );
}
