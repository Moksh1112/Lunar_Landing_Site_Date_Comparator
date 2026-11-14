import type { CompareResponse } from "../../api/types";
import { Term } from "../../components/Term";
import type { AlignBy } from "./contracts";
import { absoluteTime, countdownText, momentAt } from "./moment";
import styles from "./compare.module.css";

const utc = (t: number): string => new Date(t * 1000).toISOString().slice(0, 16).replace("T", " ") + " UTC";

/** F12 countdowns at the scrubber time (F17): the same moment the panorama markers show. */
export function MomentReadout({ data, scrubT, alignBy, expert }: { data: CompareResponse; scrubT: number | null; alignBy: AlignBy; expert: boolean }) {
  const dp = expert ? 2 : 1;
  return (
    <section aria-labelledby="moment-h" className={styles.moment}>
      <h3 id="moment-h">{scrubT === null ? "At mission start" : "At the selected time"}</h3>
      <ul className={styles.momentList}>
        {data.scenarios.map((s) => {
          const t = absoluteTime(s, scrubT, alignBy);
          const m = t === null ? null : momentAt(s, t);
          return (
            <li key={s.id} className={styles.momentItem}>
              <span className={styles.momentTag} data-id={s.id} aria-hidden="true">{s.id}</span>
              <div>
                <p className={styles.momentTime}>
                  <span className="visually-hidden">Plan {s.id}, </span>
                  {m ? utc(m.t) : "No samples"}
                </p>
                {m && (
                  <p className={styles.momentBody}>
                    <span className={styles.sunText}>Sun</span> {m.sunEl.toFixed(dp)}° elev, {countdownText(m.sun, "Sun")}
                    <br />
                    <span className={styles.earthText}>Earth</span> {m.earthEl.toFixed(dp)}° elev, {countdownText(m.earth, "Earth")}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <p className={styles.momentNote}>
        Countdowns run to the next sunset or <Term k="earthset">Earthset</Term>. Earth drifts slightly in the sky with{" "}
        <Term k="libration">libration</Term>. Earth in view is not a guaranteed <Term k="dte">DTE</Term> link.
      </p>
    </section>
  );
}
