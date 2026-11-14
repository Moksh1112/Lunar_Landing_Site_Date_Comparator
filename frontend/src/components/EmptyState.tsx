import type { ReactNode } from "react";
import styles from "./states.module.css";

type Props = { title: string; children?: ReactNode };

export function EmptyState({ title, children }: Props) {
  return (
    <div className={styles.box}>
      <p className={styles.title}>{title}</p>
      {children}
    </div>
  );
}
