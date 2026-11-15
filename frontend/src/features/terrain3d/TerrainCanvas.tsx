import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { Series, TerrainTileResponse } from "../../api/types";
import { bodyDirection, decodeHeights, heightFraction, terrainCameraDistance } from "./math";
import { useTheme } from "../../theme/theme";
import { disposeScene, realEarthMesh } from "../landing/moonScene";

type Position = [number, number, number];
type Props = { tile: TerrainTileResponse; series: Series; sunAz: number; sunEl: number; earthAz: number; earthEl: number;
  exaggeration: number; resetView: number; showPaths: boolean; onReady: () => void };

function TrackedBodies({ sun, earth, observer }: { sun: Position; earth: Position; observer: Position }) {
  const { gl, invalidate } = useThree();
  const sunMesh = useRef<THREE.Mesh>(null);
  const rayMesh = useRef<THREE.LineSegments>(null);
  const targetSun = useRef(new THREE.Vector3(...sun));
  const targetEarth = useRef(new THREE.Vector3(...earth));
  const reduce = useMemo(() => matchMedia("(prefers-reduced-motion: reduce)"), []);
  const globe = useMemo(() => realEarthMesh(gl, 0.085, invalidate), [gl, invalidate]);
  const ray = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(12), 3));
    return g;
  }, []);
  useLayoutEffect(() => {
    globe.position.copy(targetEarth.current);
    sunMesh.current?.position.copy(targetSun.current);
  }, [globe]);
  useEffect(() => {
    targetSun.current.set(...sun);
    targetEarth.current.set(...earth);
    invalidate();
  }, [sun, earth, invalidate]);
  useEffect(() => () => { disposeScene(globe); ray.dispose(); }, [globe, ray]);
  useFrame((_, dt) => {
    if (!sunMesh.current) return;
    const alpha = reduce.matches ? 1 : 1 - Math.exp(-Math.min(dt, 0.05) * 18);
    sunMesh.current.position.lerp(targetSun.current, alpha);
    globe.position.lerp(targetEarth.current, alpha);
    const p = rayMesh.current?.geometry.attributes.position;
    if (p) {
      p.setXYZ(0, ...observer); p.setXYZ(1, ...sunMesh.current.position.toArray() as Position);
      p.setXYZ(2, ...observer); p.setXYZ(3, ...globe.position.toArray() as Position);
      p.needsUpdate = true;
    }
    if (sunMesh.current.position.distanceToSquared(targetSun.current) + globe.position.distanceToSquared(targetEarth.current) > 1e-9) invalidate();
  });
  return <>
    <lineSegments ref={rayMesh} geometry={ray} frustumCulled={false}><lineBasicMaterial color="#a7bdcc" transparent opacity={0.4} /></lineSegments>
    <mesh ref={sunMesh} name="sun-marker"><sphereGeometry args={[0.052, 24, 16]} /><meshBasicMaterial color="#ffcc58" toneMapped={false} /></mesh>
    <primitive object={globe} name="earth-marker" />
  </>;
}

function MotionPaths({ series, observer, bearing }: { series: Series; observer: Position; bearing: number }) {
  const [x, y, z] = observer;
  const paths = useMemo(() => (["sun", "earth"] as const).map(body => {
    const points = series[`${body}_az`].map((az, i) => bodyDirection(az, series[`${body}_el`][i], bearing).map((v, axis) => [x, y, z][axis] + v * 1.35) as Position);
    const vertices = new Float32Array(Math.max(0, points.length - 1) * 6);
    for (let i = 1; i < points.length; i++) vertices.set([...points[i - 1], ...points[i]], (i - 1) * 6);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
    return { body, geometry };
  }), [series, x, y, z, bearing]);
  useEffect(() => () => paths.forEach(p => p.geometry.dispose()), [paths]);
  return <>{paths.map(({ body, geometry }) => <lineSegments key={body} name={`${body}-path`} geometry={geometry}><lineBasicMaterial color={body === "earth" ? "#7fbcff" : "#e2aa46"} transparent opacity={body === "earth" ? 0.75 : 0.22} /></lineSegments>)}</>;
}

function Scene({ tile, series, sunAz, sunEl, earthAz, earthEl, exaggeration, resetView, showPaths, onReady, onContextLost }: Props & { onContextLost: () => void }) {
  const ready = useRef(false);
  const orbit = useRef<OrbitControls | null>(null);
  const framed = useRef<{ tile: TerrainTileResponse; resetView: number; distance: number; aspect: number } | null>(null);
  const { camera, gl, invalidate, size } = useThree();
  const theme = useTheme(s => s.theme);
  const relief = (tile.max_m - tile.min_m) / (tile.size_km * 1000) * 2 * exaggeration;
  const middle = (tile.min_m + tile.max_m) / 2;
  const baseHeight = -(tile.max_m - tile.min_m) / (tile.size_km * 1000) - 0.025;
  const base = baseHeight * exaggeration;
  useEffect(() => {
    const lost = (event: Event) => { event.preventDefault(); onContextLost(); };
    gl.domElement.addEventListener("webglcontextlost", lost);
    return () => gl.domElement.removeEventListener("webglcontextlost", lost);
  }, [gl, onContextLost]);
  useEffect(() => {
    const controls = new OrbitControls(camera, gl.domElement);
    orbit.current = controls;
    const changed = () => invalidate();
    controls.addEventListener("change", changed);
    controls.minDistance = 0.7;
    controls.maxPolarAngle = Math.PI / 2;
    return () => { controls.removeEventListener("change", changed); controls.dispose(); orbit.current = null; };
  }, [camera, gl, invalidate]);
  // eslint-disable-next-line react-hooks/immutability -- R3F cameras are mutable Three.js objects, updated imperatively.
  useEffect(() => {
    const controls = orbit.current;
    if (!controls || size.width <= 0 || size.height <= 0) return;
    const aspect = size.width / size.height;
    const distance = terrainCameraDistance(relief, 45, aspect);
    if (!framed.current || framed.current.tile !== tile || framed.current.resetView !== resetView) {
      camera.position.copy(new THREE.Vector3(1, 1.35, 1.1).normalize().multiplyScalar(distance));
      camera.lookAt(0, 0, 0);
      controls.target.set(0, 0, 0);
      controls.update();
      framed.current = { tile, resetView, distance, aspect };
    } else if (framed.current.aspect !== aspect) {
      // Resize along the user's view direction; height changes alone leave the camera untouched.
      camera.position.sub(controls.target).multiplyScalar(distance / framed.current.distance).add(controls.target);
      controls.update();
      framed.current = { tile, resetView, distance, aspect };
    }
    controls.maxDistance = Math.max(distance * 3, camera.position.distanceTo(controls.target));
    // Include the terrain and markers even at maximum zoom-out, including a panned target.
    // eslint-disable-next-line react-hooks/immutability -- Update the owned Three.js camera, not React state.
    camera.far = controls.maxDistance + controls.target.length() + Math.hypot(1, 1, relief / 2) * 2 + 3;
    camera.updateProjectionMatrix();
    invalidate();
  }, [camera, invalidate, relief, tile, resetView, size.width, size.height]);
  useFrame(() => { if (!ready.current) { ready.current = true; requestAnimationFrame(onReady); } });
  const { geometry, skirt } = useMemo(() => {
    const heights = decodeHeights(tile.heights_m_b64, tile.width, tile.height);
    const g = new THREE.PlaneGeometry(2, 2, tile.width - 1, tile.height - 1);
    const p = g.attributes.position;
    const colours = new Float32Array(heights.length * 3);
    const low = new THREE.Color("#454545"), mid = new THREE.Color("#9c9c9c"), high = new THREE.Color("#e3e3e3"), colour = new THREE.Color();
    for (let i = 0; i < heights.length; i++) {
      p.setZ(i, (heights[i] - middle) / (tile.size_km * 1000) * 2);
      const h = heightFraction(heights[i], tile.min_m, tile.max_m);
      colour.copy(h < 0.5 ? low : mid).lerp(h < 0.5 ? mid : high, h < 0.5 ? h * 2 : (h - 0.5) * 2);
      colour.toArray(colours, i * 3);
    }
    g.setAttribute("color", new THREE.BufferAttribute(colours, 3));
    g.computeVertexNormals();
    // Display-only sides frame the finite tile; the measured surface vertices stay unchanged.
    const edge: number[] = [];
    for (let x = 0; x < tile.width; x++) edge.push(x);
    for (let y = 1; y < tile.height; y++) edge.push(y * tile.width + tile.width - 1);
    for (let x = tile.width - 2; x >= 0; x--) edge.push((tile.height - 1) * tile.width + x);
    for (let y = tile.height - 2; y > 0; y--) edge.push(y * tile.width);
    const vertices: number[] = [];
    for (let i = 0; i < edge.length; i++) {
      const a = edge[i], b = edge[(i + 1) % edge.length];
      const av = [p.getX(a), p.getY(a), p.getZ(a)], bv = [p.getX(b), p.getY(b), p.getZ(b)];
      const ab = [av[0], av[1], baseHeight], bb = [bv[0], bv[1], baseHeight];
      vertices.push(...av, ...bv, ...bb, ...av, ...bb, ...ab);
    }
    const sides = new THREE.BufferGeometry();
    sides.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    sides.computeVertexNormals();
    return { geometry: g, skirt: sides };
  }, [tile, middle, baseHeight]);
  useEffect(() => () => { geometry.dispose(); skirt.dispose(); }, [geometry, skirt]);
  const observerX = (tile.site_px[0] / (tile.width - 1) - 0.5) * 2;
  const observerY = useMemo(() => {
    const h = decodeHeights(tile.heights_m_b64, tile.width, tile.height);
    const index = Math.round(tile.site_px[1]) * tile.width + Math.round(tile.site_px[0]);
    return (h[index] - middle) / (tile.size_km * 1000) * 2 * exaggeration + 0.025;
  }, [tile, exaggeration, middle]);
  const observerZ = (tile.site_px[1] / (tile.height - 1) - 0.5) * 2;
  const observer: [number, number, number] = [observerX, observerY, observerZ];
  const marker = (az: number, el: number) => bodyDirection(az, el, tile.grid_bearing_offset_deg ?? tile.site.lon_east_deg).map((v, i) => observer[i] + v * 1.35) as [number, number, number];
  const sun = marker(sunAz, sunEl), earth = marker(earthAz, earthEl);
  return <>
    <color attach="background" args={[theme === "dark" ? "#15171b" : "#e9e8e5"]} />
    <hemisphereLight args={["#ffffff", "#26282c", 0.55]} />
    <directionalLight position={[-3, 4, 1]} intensity={2.2} color="#ffffff" />
    <directionalLight position={[4, 2, -3]} intensity={0.35} color="#ffffff" />
    <group name="terrain-height" rotation={[-Math.PI / 2, 0, 0]} scale={[1, 1, exaggeration]}>
      <mesh name="terrain-surface" geometry={geometry}><meshStandardMaterial vertexColors color="#ffffff" roughness={0.95} side={THREE.DoubleSide} /></mesh>
      <mesh geometry={skirt}><meshStandardMaterial color="#45464a" roughness={0.95} side={THREE.DoubleSide} /></mesh>
    </group>
    <mesh position={[0, base - 0.025, 0]}><boxGeometry args={[2.01, 0.05, 2.01]} /><meshStandardMaterial color="#303237" roughness={0.95} /></mesh>
    {showPaths && <MotionPaths series={series} observer={observer} bearing={tile.grid_bearing_offset_deg ?? tile.site.lon_east_deg} />}
    <TrackedBodies sun={sun} earth={earth} observer={observer} />
    <mesh name="landing-marker" position={observer}><sphereGeometry args={[0.022, 16, 12]} /><meshBasicMaterial color="#ffffff" toneMapped={false} /></mesh>
  </>;
}
export default function TerrainCanvas(props: Props) {
  const [contextLost, setContextLost] = useState(false);
  if (contextLost) throw new Error("WebGL graphics context was lost. Retry after closing other graphics-heavy tabs.");
  return <Canvas dpr={[1, 1.5]} camera={{ position: [2, 2, 2], fov: 45, near: 0.01, far: 30 }} frameloop="demand"
    aria-label="Interactive terrain diagram. Drag to orbit; numeric values and the accessible 2D views remain below.">
    <Scene {...props} onContextLost={() => setContextLost(true)} />
  </Canvas>;
}
