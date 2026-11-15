import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import moonTex from "../landing/assets/moon_lroc_color_4k.jpg";
import styles from "./home.module.css";

/** Decorative 3D Moon (NASA LROC texture) with a schematic satellite in orbit. Image fallback without WebGL. */
export function HomeMoon() {
  const host = useRef<HTMLDivElement>(null);
  const [gl] = useState(() => { try { return !!document.createElement("canvas").getContext("webgl2"); } catch { return false; } });

  useEffect(() => {
    const el = host.current;
    if (!el || !gl) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      return;
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.setAttribute("aria-hidden", "true");
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    camera.position.set(0, 0.5, 8.6);
    camera.lookAt(0, 0, 0);
    scene.add(new THREE.AmbientLight(0xffffff, 0.22));
    const sun = new THREE.DirectionalLight(0xffffff, 2.4);
    sun.position.set(-4, 1.5, 3);
    scene.add(sun);

    let disposed = false;
    const tex = new THREE.TextureLoader().load(moonTex, () => {
      if (!disposed) renderer.render(scene, camera);
    });
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const moon = new THREE.Mesh(new THREE.SphereGeometry(1.5, 96, 64), new THREE.MeshStandardMaterial({ map: tex, roughness: 1, metalness: 0 }));
    moon.rotation.x = 0.12;
    scene.add(moon);

    // Satellite: gold bus, two solar wings, a dish; orbits on a tilted plane.
    const sat = new THREE.Group();
    const bus = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.22), new THREE.MeshStandardMaterial({ color: 0xc9a227, metalness: 0.7, roughness: 0.35 }));
    const wingMat = new THREE.MeshStandardMaterial({ color: 0x1d2c4d, metalness: 0.4, roughness: 0.5, emissive: 0x0a1020 });
    for (const x of [-0.28, 0.28]) {
      const w = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.012, 0.14), wingMat);
      w.position.x = x;
      sat.add(w);
    }
    const dish = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.05, 20, 1, true), new THREE.MeshStandardMaterial({ color: 0xdddddd, side: THREE.DoubleSide }));
    dish.position.z = 0.14;
    dish.rotation.x = -Math.PI / 2;
    sat.add(bus, dish);
    const orbit = new THREE.Group();
    orbit.rotation.set(0.35, 0, -0.25);
    sat.position.x = 2.25;
    orbit.add(sat);
    scene.add(orbit);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.25, 0.004, 6, 160), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.14 }));
    ring.rotation.x = Math.PI / 2;
    orbit.add(ring);

    const resize = () => {
      const s = el.clientWidth;
      renderer.setSize(s, s, false);
      camera.aspect = 1;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    let raf = 0;
    let last = performance.now();
    let visible = true;
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
    io.observe(el);
    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (visible && !document.hidden) {
        moon.rotation.y += dt * 0.08;
        orbit.rotation.y += dt * 0.45;
        sat.rotation.y += dt * 0.6;
        renderer.render(scene, camera);
      }
      raf = requestAnimationFrame(frame);
    };
    if (reduce) {
      orbit.rotation.y = 0.9;
      renderer.render(scene, camera);
    } else raf = requestAnimationFrame(frame);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose());
        }
      });
      tex.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [gl]);

  return (
    <div ref={host} className={styles.moon3d}>
      {!gl && <img className={styles.moon} src={moonTex} alt="" width="1200" height="1200" decoding="async" />}
    </div>
  );
}
