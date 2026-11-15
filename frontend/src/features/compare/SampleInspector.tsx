import type { ScenarioResult } from "../../api/types";
import styles from "./charts.module.css";

export const sampleTime = (time: number) => new Date(time * 1000).toISOString().replace("T", " ").slice(0, 19) + " UTC";

/** Text equivalent of an inspected chart sample, reused by sky and horizon views. */
export function SampleInspector({ scenario, index }: { scenario: ScenarioResult; index: number }) {
  const s = scenario.series;
  if (index < 0 || index >= s.t_unix.length) return null;
  return (
    <div className={styles.tooltipContent}>
      <strong>{sampleTime(s.t_unix[index])}</strong>
      {(["sun", "earth"] as const).map(body => {
        const az = s[`${body}_az`][index], el = s[`${body}_el`][index];
        return <span key={body}><b>{body === "sun" ? "Sun" : "Earth"}</b> {el.toFixed(1)}° elev · {az.toFixed(1)}° az · {s[`${body}_vis`][index] === 1 ? "visible" : "hidden"}</span>;
      })}
    </div>
  );
}
