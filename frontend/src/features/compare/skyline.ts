import type { Skyline } from "../../api/types";

/** Skyline sample nearest to an azimuth (wraps 360 -> 0). null when the skyline is empty. */
export function skylineAt(s: Skyline, azDeg: number): { az: number; elev: number; distKm: number | null } | null {
  const n = s.elev_deg.length;
  if (n === 0) return null;
  const a = ((azDeg % 360) + 360) % 360;
  const i = Math.round(a / s.az_step_deg) % n;
  return { az: i * s.az_step_deg, elev: s.elev_deg[i], distKm: s.block_dist_km ? s.block_dist_km[i] : null };
}
