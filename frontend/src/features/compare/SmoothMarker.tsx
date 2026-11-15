import { useLayoutEffect, useRef } from "react";
import { followCursor, type TooltipPoint } from "./tooltipMath";

/** Ease only the drawn position; the inspector always reports the exact selected sample. */
export function SmoothMarker({ x, y, r, className, wrapWidth }: { x: number; y: number; r: number; className: string; wrapWidth?: number }) {
  const node = useRef<SVGCircleElement>(null);
  const position = useRef<TooltipPoint | null>(null);
  useLayoutEffect(() => {
    let frame = 0;
    const target = { x, y };
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // An unrolled panorama has a seam at north. Never sweep through unrelated azimuths.
    if (!position.current || reduced || (wrapWidth && Math.abs(position.current.x - x) > wrapWidth / 2)) position.current = target;
    const draw = () => {
      const current = position.current!;
      const done = Math.hypot(current.x - x, current.y - y) < 0.05;
      position.current = done ? target : followCursor(current, target);
      node.current?.setAttribute("cx", String(position.current.x));
      node.current?.setAttribute("cy", String(position.current.y));
      if (!done) frame = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(frame);
  }, [x, y, wrapWidth]);
  return <circle ref={node} r={r} className={className} />;
}
