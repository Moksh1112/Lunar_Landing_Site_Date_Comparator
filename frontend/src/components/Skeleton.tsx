import styles from "./states.module.css";

type Props = { width?: string; height?: string; label?: string };

/** Placeholder block shown while data loads. Decorative; the label is for screen readers. */
export function Skeleton({ width = "100%", height = "1rem", label = "Loading" }: Props) {
  return <div className={styles.skeleton} style={{ width, height }} role="status" aria-label={label} />;
}
