import { useRef, type MouseEvent, type PointerEvent, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  color?: string;
  /** How far the rays travel, in px. */
  radius?: number;
  /** Number of rays. */
  rays?: number;
};

const DURATION_MS = 420;

/**
 * Decorative click feedback: short rays burst outward from the press point (or the control's centre for keyboard
 * activation) and fade. Purely visual (aria-hidden, no pointer events) and skipped under prefers-reduced-motion.
 * Azelux's own implementation using the Web Animations API.
 */
export function ClickBurst({ children, color = "#ffffff", radius = 22, rays = 8 }: Props) {
  const host = useRef<HTMLSpanElement>(null);
  const lastPointer = useRef(0);

  const burst = (x: number, y: number) => {
    const el = host.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    for (let i = 0; i < rays; i++) {
      const angle = (i / rays) * 360;
      const ray = document.createElement("span");
      ray.setAttribute("aria-hidden", "true");
      Object.assign(ray.style, {
        position: "absolute",
        left: `${x}px`,
        top: `${y}px`,
        width: "2px",
        height: "9px",
        borderRadius: "1px",
        background: color,
        pointerEvents: "none",
        zIndex: "1",
      });
      el.appendChild(ray);
      const start = `translate(-50%, -50%) rotate(${angle}deg) translateY(-4px)`;
      const end = `translate(-50%, -50%) rotate(${angle}deg) translateY(-${radius}px) scaleY(0.4)`;
      const anim = ray.animate([{ transform: start, opacity: 1 }, { transform: end, opacity: 0 }], {
        duration: DURATION_MS,
        easing: "cubic-bezier(0.23, 1, 0.32, 1)",
      });
      anim.onfinish = () => ray.remove();
      anim.oncancel = () => ray.remove();
    }
  };

  const onPointerDown = (e: PointerEvent<HTMLSpanElement>) => {
    if (e.pointerType !== "mouse" || e.button !== 0 || !host.current) return;
    lastPointer.current = performance.now();
    const r = host.current.getBoundingClientRect();
    burst(e.clientX - r.left, e.clientY - r.top);
  };
  // Keyboard activation (Enter/Space) produces a click with detail 0: burst from the centre.
  const onClick = (e: MouseEvent<HTMLSpanElement>) => {
    if (e.detail !== 0 || !host.current || performance.now() - lastPointer.current < 300) return;
    const r = host.current.getBoundingClientRect();
    burst(r.width / 2, r.height / 2);
  };

  return (
    <span ref={host} style={{ position: "relative", display: "inline-flex" }} onPointerDown={onPointerDown} onClick={onClick}>
      {children}
    </span>
  );
}
