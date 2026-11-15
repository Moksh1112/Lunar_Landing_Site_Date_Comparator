import { useEffect, useRef, useState } from "react";
import moonTex from "../landing/assets/moon_lroc_color_4k.jpg";
import styles from "./home.module.css";

/**
 * Decorative 3D Moon (NASA LROC texture) with a schematic satellite in orbit. Image fallback without WebGL.
 * three.js and the scene are loaded only after the page's first paint (two animation frames), so the
 * headline and navigation render without waiting for the 3D bundle or texture. Pending work is
 * cancelled on unmount; the scene module owns GPU cleanup.
 */
export function HomeMoon() {
  const host = useRef<HTMLDivElement>(null);
  const [gl] = useState(() => {
    try {
      // Probe for WebGL 2, then release the probe context at once so it does not count against the
      // browser's per-page context limit (the scene creates its own).
      const probe = document.createElement("canvas").getContext("webgl2");
      probe?.getExtension("WEBGL_lose_context")?.loseContext();
      return !!probe;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const el = host.current;
    if (!el || !gl) return;
    let cancelled = false;
    let cleanup: (() => void) | null = null;
    // rAF runs before the next paint; a second rAF from inside it runs after that paint has happened.
    let raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(() => {
        void import("./moonScene3d").then(({ mountMoonScene }) => {
          if (!cancelled) cleanup = mountMoonScene(el);
        });
      });
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      cleanup?.();
    };
  }, [gl]);

  return (
    <div ref={host} className={styles.moon3d}>
      {!gl && <img className={styles.moon} src={moonTex} alt="" width="1200" height="1200" decoding="async" />}
    </div>
  );
}
