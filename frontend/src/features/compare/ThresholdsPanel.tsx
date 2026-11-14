import type { Thresholds } from "../../api/types";
import styles from "./compare.module.css";

const FIELDS: { key: keyof Thresholds; label: string; unit: string; max?: number }[] = [
  { key: "sun_pct_min", label: "Minimum sunlight", unit: "%", max: 100 },
  { key: "earth_pct_min", label: "Minimum Earth visibility", unit: "%", max: 100 },
  { key: "dark_gap_h_max", label: "Longest dark gap allowed", unit: "h" },
  { key: "blackout_h_max", label: "Longest Earth blackout allowed", unit: "h" },
];

export function ThresholdsPanel({ value, onChange }: { value: Thresholds; onChange: (p: Partial<Thresholds>) => void }) {
  return (
    <details className={styles.thresholds}>
      <summary>Verdict thresholds</summary>
      <div className={styles.fieldGrid}>
        {FIELDS.map((f) => (
          <label key={f.key} className={styles.field}>
            <span>
              {f.label} ({f.unit})
            </span>
            <input
              type="number"
              min={0}
              max={f.max}
              step="any"
              value={value[f.key]}
              onChange={(e) => {
                const n = e.target.valueAsNumber;
                if (Number.isFinite(n)) onChange({ [f.key]: n });
              }}
            />
          </label>
        ))}
      </div>
    </details>
  );
}
