import styles from "./states.module.css";

/** Fixture/mock responses are fixed files: they are not computed from the submitted inputs. */
export function SyntheticResultNote() {
  return (
    <p className={styles.synthNote} role="note">
      <strong>SYNTHETIC result.</strong> This is a fixed test response. It does not reflect the coordinates or dates you
      entered and is not a computed result.
    </p>
  );
}
