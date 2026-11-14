import { useMemo, useState } from "react";
import { Link } from "react-router";
import { ApiError } from "../../api/errors";
import type { CompareRequest } from "../../api/types";
import { EmptyState } from "../../components/EmptyState";
import { ErrorState } from "../../components/ErrorState";
import { Skeleton } from "../../components/Skeleton";
import { SyntheticBadge } from "../../components/SyntheticBadge";
import { useStore } from "../../store";
import { focusFirstInvalid } from "../../components/focus";
import { ExportButtons } from "../export/ExportButtons";
import { buildRequest, sharedYRange, validate, type CompareForm, type FieldErrors } from "./compareForm";
import { HorizonPanorama } from "./HorizonPanorama";
import { ModePresets } from "./ModePresets";
import { MomentReadout } from "./MomentReadout";
import { ResultsSummary } from "./ResultsSummary";
import { ScenarioCard } from "./ScenarioCard";
import { ThresholdsPanel } from "./ThresholdsPanel";
import { TimelineLanes } from "./TimelineLanes";
import { useCompare } from "./useCompare";
import styles from "./compare.module.css";

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
  const synthetic = data?.scenarios.some((s) => s.meta.data_label !== "REAL") ?? false;

  return (
    <main className={styles.page}>
      <header className={styles.pageHead}>
        <h1>Compare two landing plans</h1>
        <p className={styles.lede}>
          Set Plan A and Plan B, then compare sunlight, Earth visibility and the hours you get both.
        </p>
      </header>
      <div className={styles.layout}>
        <form
          className={styles.inputs}
          aria-label="Compare inputs"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <div className={styles.group}>
            <span className={styles.groupLabel} id="preset-label">Comparison preset</span>
            <ModePresets mode={mode} onChange={setMode} />
          </div>
          <ScenarioCard id="A" errors={errors} />
          <ScenarioCard id="B" errors={errors} />
          <ThresholdsPanel value={thresholds} onChange={setThresholds} />
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
              <Skeleton height="6rem" label="Loading verdicts" />
              <Skeleton height="5rem" label="Loading differences" />
              <Skeleton height="12rem" label="Loading horizon" />
              <Skeleton height="10rem" label="Loading timeline" />
            </div>
          ) : compare.isError ? (
            <ErrorState error={compare.error} onRetry={lastRequest ? () => run(lastRequest) : undefined} />
          ) : data && range ? (
            <>
              <div className={styles.resultsHead}>
                <h2 className={styles.resultsTitle}>Result</h2>
                {synthetic && <SyntheticBadge />}
                <ExportButtons response={data} request={shown?.request ?? lastRequest} className={styles.actions} />
                <Link to="/report" className="btn no-print">Open report</Link>
              </div>
              <ResultsSummary data={data} expert={expert} thresholds={thresholds} sentThresholds={sentThresholds} />
              <section className={styles.chartPanel} aria-labelledby="where-h">
                <div className={styles.chartHead}>
                  <h3 id="where-h">Where the Sun and Earth sit</h3>
                  <span className={styles.hint}>Same elevation scale for both plans.</span>
                </div>
                <div className={styles.panoramas}>
                  {data.scenarios.map((s) => (
                    <HorizonPanorama key={s.id} scenario={s} scrubT={scrubT} yMinDeg={range.yMin} yMaxDeg={range.yMax} />
                  ))}
                </div>
              </section>
              <section className={styles.chartPanel} aria-labelledby="when-h">
                <div className={styles.chartHead}>
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
                <TimelineLanes data={data} alignBy={alignBy} scrubT={scrubT} onScrub={setScrubT} />
                <MomentReadout data={data} scrubT={scrubT} alignBy={alignBy} expert={expert} />
              </section>
            </>
          ) : (
            <EmptyState title="Press Compare to see the difference">
              <p>
                A starter example is loaded: two south-pole points on the same date. Change either plan, or pick a preset,
                then press Compare A and B.
              </p>
            </EmptyState>
          )}
        </section>
      </div>
    </main>
  );
}
