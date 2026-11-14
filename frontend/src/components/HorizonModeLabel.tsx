import type { HorizonMode } from "../api/types";
import styles from "./badges.module.css";

export const HORIZON_LABELS: Record<HorizonMode, string> = {
  terrain: "terrain",
  terrain_coarse: "terrain (coarse)",
  geometric: "geometric horizon only",
};

export function HorizonModeLabel({ mode }: { mode: HorizonMode }) {
  return <span className={mode === "geometric" ? styles.geometric : styles.horizon}>{HORIZON_LABELS[mode]}</span>;
}
