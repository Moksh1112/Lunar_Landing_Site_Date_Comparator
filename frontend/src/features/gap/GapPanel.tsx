import type { CompareResponse, ScenarioResult } from "../../api/types";
import { useStore } from "../../store";
import { absoluteTime } from "../compare/moment";
import {
  GAP_DEFINITION,
  compareLongest,
  explainGap,
  fmtH,
  fmtUtc,
  gapPosition,
  partText,
  readingAt,
  scrubValue,
  visibilityGaps,
  type BodyReading,
  type GapResult,
} from "./gap";
import styles from "./gap.module.css";

const deg = (v: number) => `${v.toFixed(2)}°`;
const modeLabel = (s: ScenarioResult) => (s.meta.horizon_mode === "geometric" ? "geometric horizon only" : s.meta.horizon_mode);

function PlanGap({ s, r, focused, onInspect }: { s: ScenarioResult; r: GapResult; focused: boolean; onInspect: () => void }) {
  return (
    <div className={styles.plan} data-plan={s.id}>
      <p className={styles.planHead}>
        <span className={styles.tag} data-plan={s.id} aria-hidden="true">{s.id}</span>
        <span>{s.label}</span>
      </p>
      {r.state === "unavailable" ? (
        <p className={styles.muted}>Gap unavailable: {r.reason}</p>
      ) : r.state === "none" ? (
        <p>No gap: the Sun and Earth remain visible together throughout the sampled mission ({fmtH(r.missionHours)}).</p>
      ) : (
        <>
          <p className={styles.duration}>{fmtH(r.longest.hours)}</p>
          <p className={styles.when}>
            {r.longest.wholeMission ? "The whole sampled mission: " : ""}
            {fmtUtc(r.longest.startUnix)} to {fmtUtc(r.longest.endUnix)}
          </p>
          <p className={styles.muted}>
            {gapPosition(r.longest)}. {r.all.length} gap{r.all.length === 1 ? "" : "s"} in total.
            {r.longest.startCensored && !r.longest.wholeMission ? " Starts at mission start (may have begun earlier)." : ""}
            {r.longest.endCensored && !r.longest.wholeMission ? " Ends at mission end (may continue)." : ""}
          </p>
          <button type="button" aria-pressed={focused} onClick={onInspect}>
            Inspect {s.id} gap
          </button>
        </>
      )}
    </div>
  );
}

function Body({ name, b }: { name: string; b: BodyReading }) {
  return (
    <li>
      <strong>{name}</strong>: azimuth {deg(b.az)}, elevation {deg(b.el)}
      {b.skyline !== null ? `, horizon at that azimuth ${deg(b.skyline)}` : ""} —{" "}
      <span className={b.visible ? styles.up : styles.down}>{b.visible ? "above" : "below"} the computed horizon</span>
    </li>
  );
}

/** "Start with the gap" + "Explain this interval" for the current comparison (comparator and report). */
export function GapPanel({ data, interactive = true }: { data: CompareResponse; interactive?: boolean }) {
  const gapFocus = useStore((s) => s.gapFocus);
  const focusGap = useStore((s) => s.focusGap);
  const scrubT = useStore((s) => s.scrubT);
  const setScrubT = useStore((s) => s.setScrubT);
  const alignBy = useStore((s) => s.alignBy);
  const [A, B] = data.scenarios;
  const results = { A: visibilityGaps(A), B: visibilityGaps(B) };
  const focus = gapFocus ? data.scenarios.find((s) => s.id === gapFocus) : undefined;
  const fr = focus ? results[focus.id] : null;
  const ex = focus && fr?.state === "gaps" ? explainGap(focus, fr.longest) : null;
  const t = focus ? absoluteTime(focus, scrubT, alignBy) : null;
  const reading = focus && t !== null ? readingAt(focus, t) : null;

  return (
    <section className={styles.panel} aria-labelledby="gap-h">
      <div className={styles.head}>
        <h3 id="gap-h">Visibility gap</h3>
        <p className={styles.muted}>{GAP_DEFINITION} Longest gap per plan.</p>
      </div>
      <div className={styles.plans}>
        <PlanGap s={A} r={results.A} focused={gapFocus === "A"} onInspect={() => focusGap("A")} />
        <PlanGap s={B} r={results.B} focused={gapFocus === "B"} onInspect={() => focusGap("B")} />
      </div>
      <p className={styles.compare}>{compareLongest(results.A, results.B)}</p>

      {focus && ex ? (
        <div className={styles.explain} aria-live="polite">
          <h4>Explain this interval: Plan {focus.id}</h4>
          <p>{ex.summary}</p>
          {ex.parts.length > 1 && (
            <ol className={styles.parts}>
              {ex.parts.map((p) => <li key={p.startUnix}>{partText(p, ex.horizon)}</li>)}
            </ol>
          )}
          <p className={styles.prov}>
            {focus.meta.data_label} · horizon: {modeLabel(focus)}
            {focus.meta.dem ? ` · DEM ${focus.meta.dem}` : ""} · {focus.meta.ephemeris} · samples every {focus.meta.step_minutes} min
          </p>
          <ul className={styles.notes}>
            {ex.notes.map((n) => <li key={n}>{n}</li>)}
          </ul>
          <details className={styles.events}>
            <summary>Events in this gap ({ex.events.length})</summary>
            <ol>
              {ex.events.map((e, i) => (
                <li key={`${e.kind}-${e.tUnix}-${i}`}>
                  {interactive ? (
                    <button type="button" onClick={() => setScrubT(scrubValue(e.tUnix, focus.series.t_unix[0], alignBy))}>
                      {fmtUtc(e.tUnix)}
                    </button>
                  ) : (
                    <span>{fmtUtc(e.tUnix)}</span>
                  )}{" "}
                  {e.text}
                </li>
              ))}
            </ol>
          </details>
          {reading && (
            <div className={styles.reading}>
              <p className={styles.readHead}>At the selected time (nearest sample {fmtUtc(reading.sampleUnix)}), Plan {focus.id}:</p>
              <ul>
                <Body name="Sun" b={reading.sun} />
                <Body name="Earth" b={reading.earth} />
              </ul>
            </div>
          )}
        </div>
      ) : (
        results.A.state !== "gaps" &&
        results.B.state !== "gaps" && <p className={styles.muted}>Neither plan has a visibility gap, so the scrubber stays at mission start.</p>
      )}
    </section>
  );
}
