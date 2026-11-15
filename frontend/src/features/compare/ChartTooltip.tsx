import { useLayoutEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { followCursor, tooltipTarget, type TooltipPoint } from "./tooltipMath";
import styles from "./charts.module.css";

/** Shared floating chart tooltip; position is independent of chart rerenders. */
export function ChartTooltip({ anchor, id, children }: { anchor: TooltipPoint | null; id: string; children: ReactNode }) {
  const element = useRef<HTMLDivElement>(null);
  const current = useRef<TooltipPoint | null>(null);
  useLayoutEffect(() => {
    if (!anchor || !element.current) { current.current = null; return; }
    const el = element.current;
    const rect = el.getBoundingClientRect();
    const target = tooltipTarget(anchor, rect.width, rect.height, innerWidth, innerHeight);
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    const move = () => {
      const next = !current.current || reduce ? target : followCursor(current.current, target);
      current.current = next;
      el.style.left = `${next.x}px`;
      el.style.top = `${next.y}px`;
      if (Math.abs(next.x - target.x) + Math.abs(next.y - target.y) > 0.2) frame = requestAnimationFrame(move);
    };
    move();
    return () => cancelAnimationFrame(frame);
  }, [anchor]);
  if (!anchor) return null;
  return createPortal(<div ref={element} className={styles.chartTooltip} id={id} role="tooltip">{children}</div>, document.body);
}
