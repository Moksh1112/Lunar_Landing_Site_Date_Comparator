import styles from "./badges.module.css";

export function SyntheticBadge() {
  return (
    <span className={styles.synthetic} title="Synthetic fixture data, not a real result">
      SYNTHETIC
    </span>
  );
}
