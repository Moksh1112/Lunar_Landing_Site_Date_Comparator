import styles from "./states.module.css";

/** One concise notice near results; the full explanation stays available (and in exports/report). */
export function SyntheticResultNote() {
  return (
    <details className={styles.synthNote}>
      <summary>
        <strong>SYNTHETIC</strong> Fixed synthetic example — results do not reflect the entered plans.
      </summary>
      <p>
        This is a fixed test response from fixtures or a mock server. It is not computed from the coordinates or dates
        you entered and must not be read as a real result.
      </p>
    </details>
  );
}
