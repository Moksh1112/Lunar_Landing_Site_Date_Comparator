// Mission Planning Simulator: 3D control room (three.js). Illustration only: the room, console,
// lander and skyline ring are not data; the Moon uses NASA's LROC visualization texture.
import * as THREE from "three";
import { gsap } from "gsap";
import { realMoonMesh, siteDiagram, toXYZ } from "../landing/moonScene";
import { SIM_SITES, dayToDate, type Console, type Control, type Level } from "./levels";

export type View = "boot" | "console" | "briefing" | "window" | "moon";
export type World = {
  setView: (v: View, instant?: boolean) => void;
  setConsole: (c: Console, glow: Control | null, done: Partial<Record<Control, boolean>>) => void;
  setLevel: (l: Level) => void;
  look: (dx: number, dy: number) => void;
  onPick: (cb: (c: Control, shift: boolean) => void) => void;
  /** CSS-pixel position of a physical control on the canvas (for verification and focus hints). */
  screenPoint: (c: Control) => { x: number; y: number } | null;
  resize: () => void;
  dispose: () => void;
};

const MOON_POS = new THREE.Vector3(0, 1.4, -26);
const MOON_R = 7;

function label(text: string, w = 0.32, h = 0.07, size = 46, color = "#c9cfd8"): THREE.Mesh {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = Math.round((512 * h) / w);
  const g = c.getContext("2d")!;
  g.fillStyle = color;
  g.font = `600 ${size}px "Schibsted Grotesk", system-ui, sans-serif`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(text, c.width / 2, c.height / 2);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, transparent: true }));
}

function briefingTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 600;
  const g = c.getContext("2d")!;
  g.fillStyle = "#0d1118";
  g.fillRect(0, 0, 1024, 600);
  g.fillStyle = "#e9edf2";
  g.font = '700 44px "Schibsted Grotesk", system-ui, sans-serif';
  g.fillText("MISSION BRIEFING", 56, 92);
  g.fillStyle = "#a4aebd";
  g.font = '500 30px "Schibsted Grotesk", system-ui, sans-serif';
  const lines = [
    "At the lunar south pole the Sun skims the horizon.",
    "Terrain can block it; Earth can dip behind the skyline.",
    "A two-week date shift can turn day into night.",
  ];
  lines.forEach((l, i) => g.fillText(l, 56, 180 + i * 56));
  g.fillStyle = "#f2b544";
  g.font = '700 32px "Schibsted Grotesk", system-ui, sans-serif';
  g.fillText("GOAL: keep the Sun and Earth in view.", 56, 420);
  g.fillStyle = "#6b7685";
  g.font = '500 22px "Schibsted Grotesk", system-ui, sans-serif';
  g.fillText("Illustration. Real numbers come from the comparator.", 56, 540);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function createWorld(canvas: HTMLCanvasElement): World {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x07090d);
  const camera = new THREE.PerspectiveCamera(55, 1, 0.02, 200);
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Camera moves are wall-clock timed: on a slow GPU they still arrive on time instead of crawling.
  gsap.ticker.lagSmoothing(0);

  // ---------- room: matte painted metal, warm panel light ----------
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x1d222b, roughness: 0.92, metalness: 0.15 });
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x14171d, roughness: 0.95 });
  const room = new THREE.Group();
  const box = (w: number, h: number, d: number, m: THREE.Material, x: number, y: number, z: number) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    b.position.set(x, y, z);
    room.add(b);
    return b;
  };
  box(8, 0.1, 8, floorMat, 0, -0.05, 0); // floor
  box(8, 0.1, 8, wallMat, 0, 3.05, 0); // ceiling
  box(0.1, 3, 8, wallMat, -4, 1.5, 0); // left
  box(0.1, 3, 8, wallMat, 4, 1.5, 0); // right
  box(8, 3, 0.1, wallMat, 0, 1.5, 4); // back
  // front wall with a large window opening (x -3.3..3.3, y 0.5..2.9): the Moon fills most of the wall
  box(0.7, 3, 0.1, wallMat, -3.65, 1.5, -4);
  box(0.7, 3, 0.1, wallMat, 3.65, 1.5, -4);
  box(6.6, 0.5, 0.1, wallMat, 0, 0.25, -4);
  box(6.6, 0.1, 0.1, wallMat, 0, 2.95, -4);
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x3a414d, roughness: 0.6, metalness: 0.5 });
  box(6.7, 0.06, 0.16, frameMat, 0, 0.5, -3.95);
  box(6.7, 0.06, 0.16, frameMat, 0, 2.9, -3.95);
  box(0.06, 2.46, 0.16, frameMat, -3.32, 1.7, -3.95);
  box(0.06, 2.46, 0.16, frameMat, 3.32, 1.7, -3.95);
  // ceiling light strips (emissive geometry; the actual light comes from point lights)
  const stripMat = new THREE.MeshStandardMaterial({ color: 0xfff1d6, emissive: 0xfff1d6, emissiveIntensity: 1.2 });
  for (const x of [-1.5, 1.5]) box(0.12, 0.03, 5, stripMat, x, 2.98, 0.5);
  scene.add(room);
  scene.add(new THREE.AmbientLight(0x9aa6b8, 0.25));
  for (const x of [-1.5, 1.5]) {
    const p = new THREE.PointLight(0xffe9c7, 7, 9, 1.6);
    p.position.set(x, 2.8, 0.6);
    scene.add(p);
  }

  // briefing screen on the left wall
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.29), new THREE.MeshBasicMaterial({ map: briefingTexture() }));
  screen.position.set(-3.93, 1.65, -0.6);
  screen.rotation.y = Math.PI / 2;
  const bezel = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.4, 2.32), frameMat);
  bezel.position.set(-3.96, 1.65, -0.6);
  scene.add(bezel, screen);

  // ---------- outside: stars, Sun, textured Moon, Earth ----------
  {
    let seed = 5;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const pts = new Float32Array(3000 * 3);
    for (let i = 0; i < 3000; i++) {
      const v = new THREE.Vector3(rnd() * 2 - 1, rnd() * 2 - 1, -Math.abs(rnd() * 2 - 1) - 0.2).normalize().multiplyScalar(90 + rnd() * 20);
      pts.set([v.x, v.y, v.z], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pts, 3));
    scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xdfe6ff, size: 0.18, sizeAttenuation: true })));
  }
  const moonGroup = new THREE.Group();
  moonGroup.position.copy(MOON_POS);
  const moon = realMoonMesh(renderer, MOON_R);
  moonGroup.add(moon);
  scene.add(moonGroup);
  const sunLight = new THREE.DirectionalLight(0xfff4e0, 3.2);
  sunLight.target = moonGroup;
  scene.add(sunLight);
  const setSunAngle = (ang: number) => {
    // Sun near the Moon's equatorial plane: it grazes the poles
    sunLight.position.copy(MOON_POS).add(new THREE.Vector3(Math.cos(ang) * 40, 0.8, Math.sin(ang) * 40));
  };
  setSunAngle(0.5);
  const earth = new THREE.Mesh(
    new THREE.SphereGeometry(1.6, 48, 32),
    new THREE.MeshStandardMaterial({ color: 0x3f7fe8, roughness: 0.6, emissive: 0x0d2a5c, emissiveIntensity: 0.4 }),
  );
  earth.position.set(-22, 3, -58);
  scene.add(earth);

  // south-pole site with schematic skyline ring + sun path (demonstration)
  const site = SIM_SITES[1];
  const siteLocal = toXYZ(site.lat, site.lon, 1);
  const diag = siteDiagram(siteLocal);
  diag.group.scale.setScalar(MOON_R);
  moonGroup.add(diag.group);
  const setDiag = (o: number) => {
    (diag.mats[0] as THREE.LineBasicMaterial).opacity = o;
    (diag.mats[1] as THREE.LineDashedMaterial).opacity = o;
    (diag.mats[2] as THREE.MeshBasicMaterial).opacity = o * 0.25;
  };
  setDiag(0);

  // ---------- console: desk, sloped panel, physical controls ----------
  const consoleGroup = new THREE.Group();
  consoleGroup.position.set(0, 0, -1.6);
  scene.add(consoleGroup);
  const deskMat = new THREE.MeshStandardMaterial({ color: 0x262c36, roughness: 0.75, metalness: 0.3 });
  const panelMat = new THREE.MeshStandardMaterial({ color: 0x313845, roughness: 0.65, metalness: 0.35 });
  const desk = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.9, 0.9), deskMat);
  desk.position.set(0, 0.45, 0);
  const panel = new THREE.Group();
  panel.position.set(0, 1.13, 0.02); // above the desk top so the front strip stays visible
  panel.rotation.x = 0.75; // sloped toward the operator (+z): the face is readable from the chair
  const panelPlate = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.04, 0.8), panelMat);
  panel.add(panelPlate);
  consoleGroup.add(desk, panel);

  const pickables: { obj: THREE.Object3D; control: Control }[] = [];
  const glowRings = new Map<Control, THREE.Mesh>();
  const lamps = new Map<Control, THREE.MeshStandardMaterial>();
  const ringMat = () => new THREE.MeshBasicMaterial({ color: 0xfff1d6, transparent: true, opacity: 0 });
  const metal = new THREE.MeshStandardMaterial({ color: 0xc9ced6, roughness: 0.35, metalness: 0.8 });

  const mount = (control: Control, x: number, obj: THREE.Object3D, name: string) => {
    obj.position.x = x;
    panel.add(obj);
    pickables.push({ obj, control });
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.16, 0.19, 48), ringMat());
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(x, 0.025, 0.02);
    panel.add(ring);
    glowRings.set(control, ring);
    const lampMat = new THREE.MeshStandardMaterial({ color: 0x2a2f38, emissive: 0x000000 });
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.018, 16, 8), lampMat);
    lamp.position.set(x + 0.17, 0.03, 0.12);
    panel.add(lamp);
    lamps.set(control, lampMat);
    const l = label(name);
    l.rotation.x = -Math.PI / 2;
    l.position.set(x, 0.04, 0.2); // clear of the panel face (no depth fighting)
    panel.add(l);
  };

  // SITE knob
  const knob = new THREE.Group();
  const knobBody = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.12, 0.07, 32), metal);
  const knobTick = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.012, 0.09), new THREE.MeshStandardMaterial({ color: 0xf2b544 }));
  knobTick.position.set(0, 0.04, -0.05);
  knob.add(knobBody, knobTick);
  knob.position.y = 0.05;
  mount("site", -0.95, knob, "SITE");
  // DATE dial (wider, knurled feel via segments)
  const dial = new THREE.Group();
  dial.add(new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.05, 24), metal));
  const dialTick = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.01, 0.11), new THREE.MeshStandardMaterial({ color: 0xe9edf2 }));
  dialTick.position.set(0, 0.03, -0.06);
  dial.add(dialTick);
  dial.position.y = 0.04;
  mount("date", -0.47, dial, "DATE");
  // MISSION lever (pivoting handle with travel)
  const lever = new THREE.Group();
  const slot = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.01, 0.26), new THREE.MeshStandardMaterial({ color: 0x0b0d11 }));
  const arm = new THREE.Group();
  const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.18, 12), metal);
  stick.position.y = 0.09;
  const grip = new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 12), new THREE.MeshStandardMaterial({ color: 0xa44828, roughness: 0.5 }));
  grip.position.y = 0.19;
  arm.add(stick, grip);
  lever.add(slot, arm);
  lever.position.y = 0.02;
  mount("mission", 0.02, lever, "MISSION");
  // PLAN toggle
  const toggle = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.03, 0.1), new THREE.MeshStandardMaterial({ color: 0x1a1e25 }));
  const bat = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.02, 0.1, 12), metal);
  bat.position.y = 0.06;
  toggle.add(base, bat);
  toggle.position.y = 0.02;
  mount("plan", 0.5, toggle, "PLAN A/B");
  // COMPARE push button
  const btn = new THREE.Group();
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.03, 32), new THREE.MeshStandardMaterial({ color: 0x1a1e25 }));
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.05, 32), new THREE.MeshStandardMaterial({ color: 0x244bb3, roughness: 0.4 }));
  cap.position.y = 0.035;
  btn.add(collar, cap);
  btn.position.y = 0.02;
  mount("compare", 1.0, btn, "COMPARE");

  // read-out strip above the controls (site / dates / hours)
  const readCanvas = document.createElement("canvas");
  readCanvas.width = 1024;
  readCanvas.height = 96;
  const readTex = new THREE.CanvasTexture(readCanvas);
  readTex.colorSpace = THREE.SRGBColorSpace;
  const readout = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 0.215), new THREE.MeshBasicMaterial({ map: readTex }));
  readout.rotation.x = -Math.PI / 2;
  readout.position.set(0, 0.022, -0.29);
  panel.add(readout);
  const drawReadout = (c: Console) => {
    const g = readCanvas.getContext("2d")!;
    g.fillStyle = "#0b0e14";
    g.fillRect(0, 0, 1024, 96);
    g.font = '600 30px "Schibsted Grotesk", system-ui, sans-serif';
    g.textBaseline = "middle";
    g.fillStyle = "#e9edf2";
    g.fillText(SIM_SITES[c.site].name, 24, 48);
    g.fillStyle = c.plan === "A" ? "#2fd0b9" : "#7d8794";
    g.fillText(`A ${dayToDate(c.dayA)}`, 330, 48);
    g.fillStyle = c.plan === "B" ? "#ff8a5c" : "#7d8794";
    g.fillText(`B ${dayToDate(c.dayB)}`, 580, 48);
    g.fillStyle = "#f2b544";
    g.fillText(`${c.hours} h`, 860, 48);
    readTex.needsUpdate = true;
  };

  // lander parked beside the window (illustration)
  // ---------- camera views ----------
  const views: Record<View, { pos: THREE.Vector3; look: THREE.Vector3 }> = {
    boot: { pos: new THREE.Vector3(0, 1.75, 3.2), look: new THREE.Vector3(0, 1.6, -4) },
    console: { pos: new THREE.Vector3(0, 2.5, 1.4), look: new THREE.Vector3(0, 0.98, -1.62) },
    briefing: { pos: new THREE.Vector3(-1.2, 1.65, -0.6), look: new THREE.Vector3(-3.9, 1.65, -0.6) },
    window: { pos: new THREE.Vector3(0, 1.8, -2.6), look: MOON_POS.clone() },
    moon: {
      pos: MOON_POS.clone().add(siteLocal.clone().multiplyScalar(MOON_R * 1.9)).add(new THREE.Vector3(4, -1, 5)),
      look: MOON_POS.clone().add(siteLocal.clone().multiplyScalar(MOON_R)),
    },
  };
  const cur = { px: 0, py: 0, pz: 0, lx: 0, ly: 0, lz: 0 };
  let yaw = 0;
  let pitch = 0;
  const applyCamera = () => {
    camera.position.set(cur.px, cur.py, cur.pz);
    const look = new THREE.Vector3(cur.lx, cur.ly, cur.lz);
    const dir = look.clone().sub(camera.position);
    dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
    const right = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0)).normalize();
    dir.applyAxisAngle(right, pitch);
    camera.lookAt(camera.position.clone().add(dir));
  };
  let tween: gsap.core.Tween | null = null;
  const setView = (v: View, instant = false) => {
    const t = views[v];
    tween?.kill();
    yaw = 0;
    pitch = 0;
    const to = { px: t.pos.x, py: t.pos.y, pz: t.pos.z, lx: t.look.x, ly: t.look.y, lz: t.look.z };
    if (instant || reduce) {
      Object.assign(cur, to);
      applyCamera();
      return;
    }
    tween = gsap.to(cur, { ...to, duration: v === "moon" || v === "window" ? 2 : 1.3, ease: "power3.out", onUpdate: applyCamera });
  };

  let level: Level = "boot";
  let sunTween: gsap.core.Tween | null = null;
  const setLevel = (l: Level) => {
    level = l;
    sunTween?.kill();
    setDiag(l === "demo" ? 1 : 0);
    if (l === "demo" && !reduce) {
      const s = { a: -0.6 };
      sunTween = gsap.to(s, { a: Math.PI * 2 - 0.6, duration: 9, ease: "none", repeat: -1, onUpdate: () => setSunAngle(s.a) });
    } else setSunAngle(0.5);
  };

  const setConsole = (c: Console, glow: Control | null, done: Partial<Record<Control, boolean>>) => {
    knob.rotation.y = -c.site * 1.2;
    dial.rotation.y = -(c.plan === "A" ? c.dayA : c.dayB) * 0.21;
    arm.rotation.x = [-0.55, 0, 0.55][[240, 480, 708].indexOf(c.hours)] ?? 0;
    bat.rotation.z = c.plan === "A" ? 0.45 : -0.45;
    glowRings.forEach((r, k) => ((r.material as THREE.MeshBasicMaterial).opacity = k === glow ? 0.95 : 0));
    lamps.forEach((m, k) => {
      const on = done[k];
      m.color.set(on ? 0x4fd88a : 0x2a2f38);
      m.emissive.set(on ? 0x2a8c55 : 0x000000);
    });
    drawReadout(c);
  };

  // picking
  const ray = new THREE.Raycaster();
  let pickCb: ((c: Control, shift: boolean) => void) | null = null;
  let downAt: { x: number; y: number } | null = null;
  const onDown = (e: PointerEvent) => (downAt = { x: e.clientX, y: e.clientY });
  const onUp = (e: PointerEvent) => {
    const start = downAt;
    downAt = null;
    if (!start || Math.hypot(e.clientX - start.x, e.clientY - start.y) > 6) return; // a drag, not a click
    const r = canvas.getBoundingClientRect();
    ray.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), camera);
    const hit = ray.intersectObjects(pickables.map((p) => p.obj), true)[0];
    if (!hit) return;
    const p = pickables.find((q) => q.obj === hit.object || q.obj.getObjectById(hit.object.id));
    if (p) {
      if (p.control === "compare" && !reduce) gsap.fromTo(cap.position, { y: 0.015 }, { y: 0.035, duration: 0.18, ease: "power2.out" });
      pickCb?.(p.control, e.shiftKey);
    }
  };
  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointerup", onUp);

  const look = (dx: number, dy: number) => {
    yaw = Math.max(-0.9, Math.min(0.9, yaw - dx));
    pitch = Math.max(-0.5, Math.min(0.5, pitch - dy));
    applyCamera();
  };

  let raf = 0;
  const loop = () => {
    moon.rotation.y += level === "demo" ? 0 : 0.0003;
    renderer.render(scene, camera);
    raf = requestAnimationFrame(loop);
  };
  const resize = () => {
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w / h < 0.8 ? 72 : 55; // portrait phones see the whole console
    camera.updateProjectionMatrix();
  };
  resize();
  setView("boot", true);
  loop();

  return {
    setView,
    setConsole,
    setLevel,
    look,
    onPick: (cb) => { pickCb = cb; },
    screenPoint: (c) => {
      const p = pickables.find((q) => q.control === c);
      if (!p) return null;
      const v = new THREE.Vector3();
      p.obj.getWorldPosition(v);
      v.project(camera);
      const r = canvas.getBoundingClientRect();
      return { x: r.left + ((v.x + 1) / 2) * r.width, y: r.top + ((1 - v.y) / 2) * r.height };
    },
    resize,
    dispose: () => {
      cancelAnimationFrame(raf);
      tween?.kill();
      sunTween?.kill();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointerup", onUp);
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose();
        const mat = m.material as THREE.Material | THREE.Material[] | undefined;
        (Array.isArray(mat) ? mat : mat ? [mat] : []).forEach((x) => {
          (x as THREE.MeshBasicMaterial).map?.dispose();
          x.dispose();
        });
      });
      renderer.dispose();
    },
  };
}
