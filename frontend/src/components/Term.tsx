import { useId, useState, type ReactNode } from "react";
import { GLOSSARY, type GlossaryKey } from "./glossary";
import styles from "./term.module.css";

/**
 * Inline glossary help (PRD 6.4): hover, focus+Enter/Space, or click the help button to show
 * the definition; Escape or moving away hides it. The definition is rendered in flow (never
 * clipped by scrolling tables) and announced through a polite live region.
 */
export function Term({ k, children }: { k: GlossaryKey; children?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const g = GLOSSARY[k];
  return (
    <span className={styles.term} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <span className={styles.word}>{children ?? g.term}</span>
      <button
        type="button"
        className={`${styles.help} no-print`}
        aria-label={`What is ${g.term.toLowerCase()}?`}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
      >
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.3" />
          <path d="M6.2 6.3a1.9 1.9 0 1 1 2.6 1.8c-.5.2-.8.6-.8 1.1v.4" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          <circle cx="8" cy="11.6" r=".8" fill="currentColor" />
        </svg>
      </button>
      <span id={id} role="status" className={styles.tip}>
        {open ? g.definition : ""}
      </span>
    </span>
  );
}
