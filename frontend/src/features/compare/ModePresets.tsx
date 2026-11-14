import type { CompareMode } from "../../api/types";
import styles from "./compare.module.css";

const MODES: { mode: CompareMode; label: string; hint: string }[] = [
  { mode: "site_vs_site", label: "Site vs site", hint: "Same start date, different places" },
  { mode: "date_shift", label: "Date shift", hint: "Same place, different dates" },
  { mode: "free", label: "Free", hint: "Change anything" },
];

export function ModePresets({ mode, onChange }: { mode: CompareMode; onChange: (m: CompareMode) => void }) {
  return (
    <div role="group" aria-label="Comparison preset" className={styles.presets}>
      {MODES.map((m) => (
        <button key={m.mode} type="button" aria-pressed={mode === m.mode} title={m.hint} onClick={() => onChange(m.mode)}>
          {m.label}
        </button>
      ))}
    </div>
  );
}
