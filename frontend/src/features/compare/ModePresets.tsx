import type { CompareMode } from "../../api/types";
import styles from "./compare.module.css";

const MODES: { mode: CompareMode; label: string; hint: string }[] = [
  { mode: "site_vs_site", label: "Site vs site", hint: "Same start date, different places. Plan B's date follows Plan A." },
  { mode: "date_shift", label: "Date shift", hint: "Same place, different dates. Plan B's site follows Plan A." },
  { mode: "free", label: "Free", hint: "Change anything in either plan." },
];

export function ModePresets({ mode, onChange }: { mode: CompareMode; onChange: (m: CompareMode) => void }) {
  const active = MODES.find((m) => m.mode === mode);
  return (
    <>
      <div role="group" aria-labelledby="preset-label" aria-describedby="preset-hint" className={styles.presets}>
        {MODES.map((m) => (
          <button key={m.mode} type="button" aria-pressed={mode === m.mode} onClick={() => onChange(m.mode)}>
            {m.label}
          </button>
        ))}
      </div>
      <p id="preset-hint" className={styles.presetHint}>
        {active?.hint}
      </p>
    </>
  );
}
