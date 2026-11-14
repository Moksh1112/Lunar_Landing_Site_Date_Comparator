/** Elevation -> ring radius on the shared scale: yMin at the outer edge, yMax at the inner edge (clamped). */
export function ringRadius(el: number, yMin: number, yMax: number, rOut: number, rIn: number): number {
  const f = yMax === yMin ? 0 : (Math.min(Math.max(el, yMin), yMax) - yMin) / (yMax - yMin);
  return rOut - f * (rOut - rIn);
}

/** Azimuth (deg, clockwise from north at the top) and radius -> SVG point around (cx, cy). */
export function ringPoint(cx: number, cy: number, azDeg: number, r: number): { x: number; y: number } {
  const a = (azDeg * Math.PI) / 180;
  return { x: cx + r * Math.sin(a), y: cy - r * Math.cos(a) };
}
