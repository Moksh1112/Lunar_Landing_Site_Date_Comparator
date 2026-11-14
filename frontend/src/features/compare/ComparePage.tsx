import { useMemo, useState } from "react";
import { ApiError } from "../../api/errors";
import type { CompareRequest } from "../../api/types";
import { EmptyState } from "../../components/EmptyState";
import { ErrorState } from "../../components/ErrorState";
import { Skeleton } from "../../components/Skeleton";
import { SyntheticBadge } from "../../components/SyntheticBadge";
import { useStore } from "../../store";
import { buildRequest, sharedYRange, validate, type CompareForm, type FieldErrors } from "./compareForm";
import { HorizonPanorama } from "./HorizonPanorama";
import { ModePresets } from "./ModePresets";
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

  const compare = useCompare();
  const [clientErrors, setClientErrors] = useState<FieldErrors>({});
  const [lastRequest, setLastRequest] = useState<CompareRequest | null>(null);

  const serverErrors: FieldErrors = {};
  if (compare.error instanceof ApiError) for (const d of compare.error.details) serverErrors[d.field] = d.reason;
  const errors = { ...serverErrors, ...clientErrors };

  const submit = () => {
    if (compare.isPending) return;
    const form: CompareForm = { mode, scenarios: [scenarios.A, scenarios.B], thresholds };
    const found = validate(form);
    setClientErrors(found);
    if (Object.keys(found).length > 0) return;
    const req = buildRequest(form);
    setLastRequest(req);
    setScrubT(null);
    compare.mutate(req);
  };

  const data = compare.data;
  const range = useMemo(() => (data ? sharedYRange(data.scenarios) : null), [data]);
  const synthetic = data?.scenarios.some((s) => s.meta.data_label !== "REAL") ?? false;

  return (
    <main className={styles.page}>
      <h1>Compare</h1>
      <div className={styles.layout}>
        <form
          className={styles.inputs}
          aria-label="Compare inputs"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <ModePresets mode={mode} onChange={setMode} />
          <ScenarioCard id="A" errors={errors} />
          <ScenarioCard id="B" errors={errors} />
          <ThresholdsPanel value={thresholds} onChange={setThresholds} />
          {errors["request"] && (
            <p className={styles.fieldError} role="alert">
              {errors["request"]}
            </p>
          )}
          <button type="submit" className={styles.primary} disabled={compare.isPending}>
            {compare.isPending ? "Comparing..." : "Compare"}
          </button>
        </form>

        <section className={styles.results} aria-label="Results" aria-live="polite">
          {compare.isPending ? (
            <div className={styles.skeletons}>
              <Skeleton height="4rem" label="Loading summary" />
              <Skeleton height="10rem" label="Loading horizon" />
              <Skeleton height="10rem" label="Loading timeline" />
            </div>
          ) : compare.isError ? (
            <ErrorState error={compare.error} onRetry={lastRequest ? () => compare.mutate(lastRequest) : undefined} />
          ) : data && range ? (
            <>
              <div className={styles.resultsHead}>
                {synthetic && <SyntheticBadge />}
                <div role="group" aria-label="Align timeline by" className={styles.presets}>
                  <button type="button" aria-pressed={alignBy === "calendar"} onClick={() => setAlignBy("calendar")}>
                    Calendar date
                  </button>
                  <button type="button" aria-pressed={alignBy === "mission_day"} onClick={() => setAlignBy("mission_day")}>
                    Mission day
                  </button>
                </div>
              </div>
              <ResultsSummary data={data} expert={expert} />
              <div className={styles.panoramas}>
                {data.scenarios.map((s) => (
                  <HorizonPanorama key={s.id} scenario={s} scrubT={scrubT} yMinDeg={range.yMin} yMaxDeg={range.yMax} />
                ))}
              </div>
              <TimelineLanes data={data} alignBy={alignBy} scrubT={scrubT} onScrub={setScrubT} />
            </>
          ) : (
            <EmptyState title="Choose two plans and press Compare">
              <p>A starter example (two south-pole points, same date) is loaded.</p>
            </EmptyState>
          )}
        </section>
      </div>
    </main>
  );
}
