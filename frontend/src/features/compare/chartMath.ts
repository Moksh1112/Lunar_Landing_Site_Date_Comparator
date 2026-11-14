// Pure helpers for the Compare charts (no React, no DOM).
import type { Window } from "../../api/types";
import type { AlignBy } from "./contracts";

export type Point = { x: number; y: number };
export type Segment = { visible: boolean; points: Point[] };

/**
 * Split a (azimuth, value) path into runs of constant visibility, breaking
 * wherever azimuth wraps across 360->0 (jump > 180 deg between neighbours).
 * A segment boundary shares no point, so no line is drawn across the wrap.
 */
export function splitAtWrap(az: number[], values: number[], vis: number[]): Segment[] {
  const out: Segment[] = [];
  let cur: Segment | null = null;
  let prevAz = 0;
  for (let i = 0; i < az.length; i++) {
    const v = vis[i] === 1;
    const wrapped = i > 0 && Math.abs(az[i] - prevAz) > 180;
    if (!cur || wrapped || cur.visible !== v) {
      // Same-visibility continuation keeps continuity across a visibility change
      // by repeating the previous point so solid/dotted pieces touch.
      const carry: Point[] = cur && !wrapped && cur.points.length ? [cur.points[cur.points.length - 1]] : [];
      cur = { visible: v, points: carry };
      out.push(cur);
    }
    cur.points.push({ x: az[i], y: values[i] });
    prevAz = az[i];
  }
  return out;
}

/** Index of the sample whose time is nearest t (t_unix ascending). -1 if empty. */
export function nearestIndex(tUnix: number[], t: number): number {
  if (tUnix.length === 0) return -1;
  let lo = 0;
  let hi = tUnix.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (tUnix[mid] <= t) lo = mid;
    else hi = mid;
  }
  return Math.abs(tUnix[lo] - t) <= Math.abs(tUnix[hi] - t) ? lo : hi;
}

/** Window -> [x0, x1] on the chart axis: absolute unix s (calendar) or offset s from t0 (mission_day). */
export function windowToRange(w: Pick<Window, "start" | "end">, t0: number, align: AlignBy): [number, number] {
  const s = Date.parse(w.start) / 1000;
  const e = Date.parse(w.end) / 1000;
  return align === "calendar" ? [s, e] : [s - t0, e - t0];
}

/** Intervals where exactly one of a / b is covered (symmetric difference of sorted interval lists). */
export function symmetricDifference(a: [number, number][], b: [number, number][]): [number, number][] {
  const pts = new Set<number>();
  for (const [s, e] of [...a, ...b]) {
    pts.add(s);
    pts.add(e);
  }
  const edges = [...pts].sort((x, y) => x - y);
  const covers = (list: [number, number][], m: number) => list.some(([s, e]) => m >= s && m < e);
  const out: [number, number][] = [];
  for (let i = 0; i < edges.length - 1; i++) {
    const mid = (edges[i] + edges[i + 1]) / 2;
    if (covers(a, mid) !== covers(b, mid)) {
      const last = out[out.length - 1];
      if (last && last[1] === edges[i]) last[1] = edges[i + 1];
      else out.push([edges[i], edges[i + 1]]);
    }
  }
  return out;
}

export function countVisible(vis: number[]): number {
  return vis.reduce((n, v) => n + (v === 1 ? 1 : 0), 0);
}
