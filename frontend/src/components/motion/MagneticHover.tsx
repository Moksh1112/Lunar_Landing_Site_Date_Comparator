import { useEffect, useRef, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  /** Distance in px around the element within which the pointer pulls it. */
  reach?: number;
  /** Pointer offset is divided by this; larger means a weaker pull. */
  damping?: number;
  /** Largest displacement in px. */
  maxShift?: number;
};

/**
 * Decorative "magnetic" hover: the wrapped control drifts slightly toward a nearby mouse pointer and eases back.
 * Mouse only (touch and pen are ignored), and off entirely under prefers-reduced-motion. Azelux's own implementation.
 */
export function MagneticHover({ children, reach = 40, damping = 6, maxShift = 6 }: Props) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    el.style.transition = "transform 180ms cubic-bezier(0.23, 1, 0.32, 1)";
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const near = Math.abs(dx) <= r.width / 2 + reach && Math.abs(dy) <= r.height / 2 + reach;
      let x = near ? dx / damping : 0;
      let y = near ? dy / damping : 0;
      const len = Math.hypot(x, y);
      if (len > maxShift) {
        x *= maxShift / len;
        y *= maxShift / len;
      }
      el.style.transform = x || y ? `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)` : "";
    };
    const reset = () => {
      el.style.transform = "";
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", reset);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", reset);
      el.style.transform = "";
      el.style.transition = "";
    };
  }, [reach, damping, maxShift]);

  return (
    <span ref={ref} style={{ display: "inline-block" }}>
      {children}
    </span>
  );
}
