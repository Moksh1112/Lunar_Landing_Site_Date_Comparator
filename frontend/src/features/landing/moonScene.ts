// Landing-page 3D illustration (three.js). It is an explanatory model, NOT terrain data:
// the Moon/Earth use NASA visualization textures, the skyline ring is schematic, and nothing here is computed
// from DEMs or ephemerides. Site markers sit at the library coordinates of two verified sites.
import * as THREE from "three";
import moonTextureUrl from "./assets/moon_lroc_color_4k.jpg";
import moonHeightUrl from "./assets/moon_lola_height_1k.jpg";
import earthTextureUrl from "./assets/earth_blue_marble_2k.jpg";
import earthCloudsUrl from "./assets/earth_clouds_2k.jpg";

export type Readout = { site: "A" | "B"; sunElDeg: number; earthElDeg: number; sunUp: boolean; earthUp: boolean };
export type MoonScene = {
  setProgress: (p: number) => void;
  resize: () => void;
  dispose: () => void;
  render: () => void;
  /** Interactive mode: hours into the lunar day (0..708) sweep the Sun around the Moon's sky. */
  setSunHours: (h: number) => Readout;
  /** Interactive mode: fly the lander to site A or B and frame it. */
  landAt: (site: "A" | "B") => Readout;
};

const SITE_A = { lat: -84.7906, lon: 29.1957 }; // IM-2 Athena (library site, verified)
const SITE_B = { lat: -80.13, lon: 1.44 }; // IM-1 Odysseus (library site, verified)
const COLORS = { moon: 0xd6d2c8, a: 0x2fd0b9, b: 0xff8a5c, sun: 0xf4b740, earth: 0x3f7fe8, line: 0xc9d3ea };

const D2R = Math.PI / 180;
/** Planetocentric lat/lon (deg, east-positive) to a point on a sphere of radius r (y = north). */
export function toXYZ(latDeg: number, lonDeg: number, r = 1): THREE.Vector3 {
  const la = latDeg * D2R;
  const lo = lonDeg * D2R;
  return new THREE.Vector3(r * Math.cos(la) * Math.cos(lo), r * Math.sin(la), -r * Math.cos(la) * Math.sin(lo));
}

/** Smooth step between chapters. */
const smooth = (t: number) => t * t * (3 - 2 * t);
export function chapterBlend(p: number, n: number): { i: number; t: number } {
  const x = Math.min(Math.max(p, 0), 1) * (n - 1);
  const i = Math.min(Math.floor(x), n - 2);
  return { i, t: smooth(x - i) };
}

/**
 * Moon mesh textured with NASA's CGI Moon Kit LROC colour mosaic (public domain, visualization only).
 * Equirectangular map: texture centre = 0 deg E, which three's sphere UVs place at +x, matching toXYZ().
 * LOLA's visualization height preview supplies subtle relief, separate from surface colour.
 */
export function realMoonMesh(renderer: THREE.WebGLRenderer, radius = 1, onLoad?: () => void): THREE.Mesh {
  const tex = new THREE.TextureLoader().load(moonTextureUrl, () => onLoad?.());
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const height = new THREE.TextureLoader().load(moonHeightUrl, () => onLoad?.());
  height.anisotropy = tex.anisotropy;
  const mat = new THREE.MeshStandardMaterial({ map: tex, bumpMap: height, bumpScale: radius * 0.008, roughness: 1, metalness: 0 });
  return new THREE.Mesh(new THREE.SphereGeometry(radius, 192, 128), mat);
}

/** NASA Blue Marble composite, not current weather or an ephemeris-driven Earth orientation. */
export function realEarthMesh(renderer: THREE.WebGLRenderer, radius: number, onLoad?: () => void): THREE.Group {
  const loader = new THREE.TextureLoader();
  const surface = loader.load(earthTextureUrl, () => onLoad?.());
  surface.colorSpace = THREE.SRGBColorSpace;
  surface.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const clouds = loader.load(earthCloudsUrl, () => onLoad?.());
  clouds.anisotropy = surface.anisotropy;
  const earth = new THREE.Group();
  // A soft illustrative fill keeps continents readable on small displays.
  earth.add(new THREE.Mesh(new THREE.SphereGeometry(radius, 96, 64), new THREE.MeshStandardMaterial({ map: surface, emissiveMap: surface, emissive: 0xffffff, emissiveIntensity: 0.18, roughness: 0.8 })));
  earth.add(new THREE.Mesh(new THREE.SphereGeometry(radius * 1.006, 96, 64), new THREE.MeshStandardMaterial({ color: 0xffffff, alphaMap: clouds, transparent: true, opacity: 0.85, depthWrite: false, roughness: 1 })));
  earth.add(new THREE.Mesh(new THREE.SphereGeometry(radius * 1.025, 64, 48), new THREE.MeshBasicMaterial({ color: 0x7ebaff, transparent: true, opacity: 0.06, side: THREE.BackSide, depthWrite: false })));
  earth.rotation.y = -1.3;
  return earth;
}

/** Release maps as well as materials; route changes must not retain GPU resources. */
export function disposeScene(scene: THREE.Object3D) {
  const textures = new Set<THREE.Texture>();
  scene.traverse(o => {
    const m = o as THREE.Mesh;
    m.geometry?.dispose();
    const material = m.material as THREE.Material | THREE.Material[] | undefined;
    (Array.isArray(material) ? material : material ? [material] : []).forEach(mat => {
      for (const value of Object.values(mat)) if (value instanceof THREE.Texture) textures.add(value);
      mat.dispose();
    });
  });
  textures.forEach(texture => texture.dispose());
}

export function moonGeometry(): THREE.SphereGeometry {
  const g = new THREE.SphereGeometry(1, 160, 120);
  const pos = g.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  // deterministic pseudo-random crater field (illustrative relief only)
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const craters = Array.from({ length: 70 }, () => ({
    c: new THREE.Vector3(rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1).normalize(),
    r: 0.04 + rnd() * 0.16,
    d: 0.006 + rnd() * 0.014,
  }));
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).normalize();
    let h = 0.004 * Math.sin(9 * v.x + 3 * v.y) * Math.cos(7 * v.z - 2 * v.x);
    for (const k of craters) {
      const d = v.angleTo(k.c) / k.r;
      if (d < 1.25) h += d < 1 ? -k.d * (1 - d * d) : k.d * 0.6 * (1.25 - d) * 4 * (d - 1);
    }
    pos.setXYZ(i, v.x * (1 + h), v.y * (1 + h), v.z * (1 + h));
  }
  g.computeVertexNormals();
  return g;
}

/** Schematic skyline ring + Sun path around a site, in the site's local tangent frame. */
export function siteDiagram(site: THREE.Vector3): { group: THREE.Group; mats: THREE.Material[] } {
  const group = new THREE.Group();
  const up = site.clone().normalize();
  const east = new THREE.Vector3(0, 1, 0).cross(up).normalize();
  const north = up.clone().cross(east).normalize();
  const R = 0.2;
  const ring: THREE.Vector3[] = [];
  const sunPath: THREE.Vector3[] = [];
  for (let k = 0; k <= 180; k++) {
    const az = (k / 180) * Math.PI * 2;
    const dir = north.clone().multiplyScalar(Math.cos(az)).add(east.clone().multiplyScalar(Math.sin(az)));
    const sky = 0.018 + 0.016 * Math.sin(3 * az + 0.6) + 0.01 * Math.sin(7 * az); // schematic skyline height
    ring.push(site.clone().add(dir.clone().multiplyScalar(R)).add(up.clone().multiplyScalar(sky)));
    const sunEl = 0.026 * Math.sin(az - 0.9); // Sun skims the horizon: a few degrees up or down
    sunPath.push(site.clone().add(dir.clone().multiplyScalar(R * 1.25)).add(up.clone().multiplyScalar(sunEl)));
  }
  const mRing = new THREE.LineBasicMaterial({ color: COLORS.line, transparent: true, opacity: 0 });
  const mSun = new THREE.LineDashedMaterial({ color: COLORS.sun, dashSize: 0.012, gapSize: 0.008, transparent: true, opacity: 0 });
  const mPlane = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false });
  const ringLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(ring), mRing);
  const sunLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(sunPath), mSun);
  sunLine.computeLineDistances();
  const plane = new THREE.Mesh(new THREE.CircleGeometry(R * 1.3, 64), mPlane);
  plane.position.copy(site.clone().add(up.clone().multiplyScalar(0.004)));
  plane.lookAt(site.clone().add(up));
  group.add(plane, ringLine, sunLine);
  return { group, mats: [mRing, mSun, mPlane] };
}

function marker(site: THREE.Vector3, color: number): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.045, 20), new THREE.MeshStandardMaterial({ color, roughness: 0.5 }));
  const up = site.clone().normalize();
  m.position.copy(site.clone().add(up.clone().multiplyScalar(0.025)));
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), up.clone().negate());
  return m;
}

/** Procedural lander (illustration): octagonal body, foil top, four legs with pads, solar panel, antenna. */
export function lander(): THREE.Group {
  const g = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({ color: 0xe9e6dc, roughness: 0.45, metalness: 0.35 });
  const foil = new THREE.MeshStandardMaterial({ color: 0xc9a227, roughness: 0.35, metalness: 0.7 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x1c3d93, roughness: 0.4, metalness: 0.3 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.55, 8), metal);
  body.position.y = 0.75;
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 0.16, 8), foil);
  top.position.y = 1.1;
  const panel = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.04, 0.5), dark);
  panel.position.set(0, 1.25, 0);
  panel.rotation.z = 0.25;
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.4, 8), metal);
  mast.position.set(-0.25, 1.35, 0.1);
  const dish = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2.6), metal);
  dish.position.set(-0.25, 1.56, 0.1);
  dish.rotation.x = Math.PI;
  const nozzle = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.22, 16, 1, true), dark);
  nozzle.position.y = 0.38;
  g.add(body, top, panel, mast, dish, nozzle);
  for (let k = 0; k < 4; k++) {
    const ang = (k / 4) * Math.PI * 2 + Math.PI / 4;
    const dx = Math.cos(ang);
    const dz = Math.sin(ang);
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.85, 8), metal);
    leg.position.set(dx * 0.62, 0.38, dz * 0.62);
    leg.rotation.set(dz * 0.55, 0, -dx * 0.55);
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.04, 16), metal);
    pad.position.set(dx * 0.85, 0.02, dz * 0.85);
    g.add(leg, pad);
  }
  g.scale.setScalar(0.035);
  return g;
}

export function createMoonScene(canvas: HTMLCanvasElement, opts: { interactive?: boolean } = {}): MoonScene {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  let disposed = false;
  let landingRaf = 0;
  let removeControlListener = () => {};
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.01, 100);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x707070, 0.75));
  // Starfield (decorative): deterministic points on a far shell.
  {
    let seed = 11;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const pts = new Float32Array(2400 * 3);
    for (let i = 0; i < 2400; i++) {
      const v = new THREE.Vector3(rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1).normalize().multiplyScalar(30 + rnd() * 20);
      pts.set([v.x, v.y, v.z], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pts, 3));
    scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xdfe6ff, size: 0.06, sizeAttenuation: true, transparent: true, opacity: 0.85 })));
  }
  const sunDir = new THREE.Vector3(1, 0.02, 0.35).normalize(); // near the equator plane: grazing at the poles
  const sunLight = new THREE.DirectionalLight(0xffffff, 3.8);
  sunLight.position.copy(sunDir.clone().multiplyScalar(10));
  scene.add(sunLight);

  const moon = realMoonMesh(renderer, 1, () => render());
  scene.add(moon);
  const sun = new THREE.Mesh(new THREE.SphereGeometry(0.16, 32, 16), new THREE.MeshBasicMaterial({ color: 0xf2b544 }));
  sun.position.copy(sunDir.clone().multiplyScalar(7));
  scene.add(sun);
  const earth = realEarthMesh(renderer, 0.3, () => render());
  earth.position.set(1.7, 0.35, -2.6); // illustrative direction and spacing, kept in frame on laptop windows
  scene.add(earth);

  const a = toXYZ(SITE_A.lat, SITE_A.lon, 1.0);
  const b = toXYZ(SITE_B.lat, SITE_B.lon, 1.0);
  scene.add(marker(a, COLORS.a), marker(b, COLORS.b));
  const diag = siteDiagram(a);
  scene.add(diag.group);

  // Lander descends onto site A over the first chapters and touches down for the site diagram.
  const upA = a.clone().normalize();
  const craft = lander();
  craft.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), upA);
  scene.add(craft);
  const descentStart = a.clone().multiplyScalar(1.9).add(new THREE.Vector3(0.9, 0.2, 0.6));
  const descentEnd = a.clone().multiplyScalar(1.006);
  const curve = new THREE.QuadraticBezierCurve3(descentStart, a.clone().multiplyScalar(1.35).add(new THREE.Vector3(0.2, 0, 0.15)), descentEnd);
  const pathMat = new THREE.LineDashedMaterial({ color: 0x8fb0ff, dashSize: 0.03, gapSize: 0.02, transparent: true, opacity: 0.7 });
  const path = new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(80)), pathMat);
  path.computeLineDistances();
  scene.add(path);

  // Line-of-sight beams for the comparison chapter (illustrative directions only)
  const beamMats: THREE.LineBasicMaterial[] = [];
  const beam = (from: THREE.Vector3, to: THREE.Vector3, color: number) => {
    const m = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0 });
    beamMats.push(m);
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([from.clone().multiplyScalar(1.05), to]), m));
  };
  beam(a, earth.position, COLORS.earth);
  beam(b, earth.position, COLORS.earth);
  beam(a, sun.position, COLORS.sun);
  beam(b, sun.position, COLORS.sun);

  // Camera chapters: hero, south pole problem, site diagram, A/B comparison, pull back
  const siteView = a.clone().multiplyScalar(2.05).add(new THREE.Vector3(0.6, -0.1, 0.6));
  const shots: { pos: THREE.Vector3; look: THREE.Vector3 }[] = [
    { pos: new THREE.Vector3(0.4, -0.7, 6.4), look: new THREE.Vector3(-1.55, -0.05, 0) },
    { pos: new THREE.Vector3(1.6, -2.7, 2.0), look: new THREE.Vector3(0, -0.75, 0) },
    { pos: siteView, look: a.clone().add(new THREE.Vector3(-0.12, 0, -0.08)) },
    { pos: new THREE.Vector3(0.9, -2.4, 2.3), look: a.clone().add(b).multiplyScalar(0.5) },
    { pos: new THREE.Vector3(0.3, -0.5, 6.6), look: new THREE.Vector3(-1.5, 0.1, -0.4) },
  ];
  const pos = new THREE.Vector3();
  const look = new THREE.Vector3();

  const setProgress = (p: number) => {
    const { i, t } = chapterBlend(p, shots.length);
    pos.copy(shots[i].pos).lerp(shots[i + 1].pos, t);
    look.copy(shots[i].look).lerp(shots[i + 1].look, t);
    camera.position.copy(pos);
    camera.lookAt(look);
    const x = Math.min(Math.max(p, 0), 1) * (shots.length - 1); // chapter coordinate 0..4
    const ringOn = Math.max(0, 1 - Math.abs(x - 2) * 1.4);
    (diag.mats[0] as THREE.LineBasicMaterial).opacity = ringOn;
    (diag.mats[1] as THREE.LineDashedMaterial).opacity = ringOn;
    (diag.mats[2] as THREE.MeshBasicMaterial).opacity = ringOn * 0.3;
    const land = smooth(Math.min(Math.max(x / 2, 0), 1)); // 0 at hero, 1 = touchdown at the site chapter
    craft.position.copy(curve.getPoint(land));
    pathMat.opacity = 0.7 * (1 - land);
    const beamsOn = Math.max(0, 1 - Math.abs(x - 3) * 1.3);
    beamMats.forEach((m) => (m.opacity = beamsOn * 0.9));
    render();
  };

  const resize = () => {
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Preserve the wide composition on taller windows so Earth remains in frame.
    camera.fov = 2 * Math.atan(Math.tan(35 * D2R / 2) * Math.max(1, 1.9 / camera.aspect)) / D2R;
    camera.updateProjectionMatrix();
    render();
  };
  const render = () => { if (!disposed) renderer.render(scene, camera); };

  // ---- interactive simulation (illustrative geometry, smooth-sphere horizon) ----
  let current: "A" | "B" = "A";
  let sunHours = 0;

  let controls: { update: () => void; dispose: () => void; target: THREE.Vector3 } | null = null;
  const sites = { A: a, B: b };
  const elevation = (site: THREE.Vector3, target: THREE.Vector3) => {
    const up = site.clone().normalize();
    // Sun and Earth are effectively at infinity: use their direction from the Moon's centre (no parallax).
    const to = target.clone().normalize();
    return Math.asin(Math.min(1, Math.max(-1, up.dot(to)))) / D2R;
  };
  const readout = (): Readout => {
    const s = sites[current];
    const sunEl = elevation(s, sun.position);
    const earthEl = elevation(s, earth.position);
    return { site: current, sunElDeg: sunEl, earthElDeg: earthEl, sunUp: sunEl > 0, earthUp: earthEl > 0 };
  };
  const setSunHours = (h: number): Readout => {
    sunHours = h;
    const ang = (h / 708) * Math.PI * 2; // one lunar day = one full turn of the Sun in the Moon's sky
    const d = new THREE.Vector3(Math.cos(ang), 0.03, -Math.sin(ang)).normalize();
    sunLight.position.copy(d.clone().multiplyScalar(10));
    sun.position.copy(d.clone().multiplyScalar(7));
    render();
    return readout();
  };
  const landAt = (site: "A" | "B"): Readout => {
    cancelAnimationFrame(landingRaf);
    current = site;
    const s = sites[site];
    const up = s.clone().normalize();
    const start = s.clone().multiplyScalar(1.6);
    const t0 = performance.now();
    const dur = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 1400;
    craft.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), up);
    pathMat.opacity = 0;
    const step = () => {
      if (disposed) return;
      const k = dur ? Math.min(1, (performance.now() - t0) / dur) : 1;
      const e = 1 - Math.pow(1 - k, 3);
      craft.position.copy(start.clone().lerp(s.clone().multiplyScalar(1.006), e));
      render();
      if (k < 1) landingRaf = requestAnimationFrame(step);
    };
    if (controls) {
      controls.target.copy(s);
      camera.position.copy(s.clone().multiplyScalar(2.3).add(new THREE.Vector3(0.5, -0.2, 0.5)));
      controls.update();
    }
    step();
    return readout();
  };

  if (opts.interactive) {
    void import("three/examples/jsm/controls/OrbitControls.js").then(({ OrbitControls }) => {
      if (disposed) return;
      const c = new OrbitControls(camera, canvas);
      c.enableDamping = false;
      c.minDistance = 1.35;
      c.maxDistance = 9;
      c.enablePan = false;
      c.listenToKeyEvents(canvas);
      c.target.copy(a);
      camera.position.set(1.2, -2.3, 2.4);
      controls = c;
      c.addEventListener("change", render);
      removeControlListener = () => c.removeEventListener("change", render);
      c.update();
      render();
    });
    craft.position.copy(a.clone().multiplyScalar(1.006));
    pathMat.opacity = 0;
  }

  const dispose = () => {
    disposed = true;
    cancelAnimationFrame(landingRaf);
    removeControlListener();
    controls?.dispose();
    disposeScene(scene);
    renderer.dispose();
    renderer.forceContextLoss();
  };

  resize();
  if (!opts.interactive) setProgress(0);
  else setSunHours(sunHours);
  return { setProgress, resize, dispose, render, setSunHours, landAt };
}
