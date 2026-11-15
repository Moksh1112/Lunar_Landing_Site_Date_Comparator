export type TooltipPoint = { x: number; y: number };

export function tooltipTarget(point: TooltipPoint, width: number, height: number, viewportWidth: number, viewportHeight: number): TooltipPoint {
  const x = point.x + width + 16 <= viewportWidth ? point.x + 14 : point.x - width - 14;
  const y = point.y + height + 16 <= viewportHeight ? point.y + 14 : point.y - height - 14;
  return { x: Math.max(8, Math.min(x, viewportWidth - width - 8)), y: Math.max(8, Math.min(y, viewportHeight - height - 8)) };
}

/** Move a quarter of the remaining distance per animation frame. */
export function followCursor(current: TooltipPoint, target: TooltipPoint): TooltipPoint {
  return { x: current.x + (target.x - current.x) * 0.25, y: current.y + (target.y - current.y) * 0.25 };
}
