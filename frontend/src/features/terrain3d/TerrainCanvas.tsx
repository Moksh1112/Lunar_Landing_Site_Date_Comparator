import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { TerrainTileResponse } from "../../api/types";
import { bodyDirection, decodeHeights, terrainCameraDistance } from "./math";
import { useTheme } from "../../theme/theme";

type Props = { tile: TerrainTileResponse; sunAz: number; sunEl: number; earthAz: number; earthEl: number;
  exaggeration: number; resetView: number; onReady: () => void };
function Scene({ tile, sunAz, sunEl, earthAz, earthEl, exaggeration, resetView, onReady, onContextLost }: Props & { onContextLost: () => void }) {
  const ready = useRef(false);
  const { camera, gl, invalidate, size } = useThree();
  const theme = useTheme(s => s.theme);
  const relief = (tile.max_m - tile.min_m) / (tile.size_km * 1000) * 2 * exaggeration;
  const middle = (tile.min_m + tile.max_m) / 2;
  const base = -relief / 2 - 0.025;
  useEffect(() => {
    const lost = (event: Event) => { event.preventDefault(); onContextLost(); };
    gl.domElement.addEventListener("webglcontextlost", lost);
    return () => gl.domElement.removeEventListener("webglcontextlost", lost);
  }, [gl, onContextLost]);
  useEffect(() => {
    const controls = new OrbitControls(camera, gl.domElement);
    const changed = () => invalidate();
    controls.addEventListener("change", changed);
    const distance = terrainCameraDistance(relief, 45, size.width / Math.max(1, size.height));
    camera.position.copy(new THREE.Vector3(1, 1.35, 1.1).normalize().multiplyScalar(distance));
    camera.lookAt(0, 0, 0);
    controls.target.set(0, 0, 0);
    controls.minDistance = 0.7;
    controls.maxDistance = distance * 3;
    controls.maxPolarAngle = Math.PI / 2;
    controls.update();
    invalidate();
    return () => { controls.removeEventListener("change", changed); controls.dispose(); };
  }, [camera, gl, invalidate, relief, tile, resetView, size.width, size.height]);
  useFrame(() => { if (!ready.current) { ready.current = true; requestAnimationFrame(onReady); } });
  const { geometry, skirt } = useMemo(() => {
    const heights = decodeHeights(tile.heights_m_b64, tile.width, tile.height);
    const g = new THREE.PlaneGeometry(2, 2, tile.width - 1, tile.height - 1);
    const p = g.attributes.position;
    for (let i = 0; i < heights.length; i++) p.setZ(i, (heights[i] - middle) / (tile.size_km * 1000) * 2 * exaggeration);
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
      const ab = [av[0], av[1], base], bb = [bv[0], bv[1], base];
      vertices.push(...av, ...bv, ...bb, ...av, ...bb, ...ab);
    }
    const sides = new THREE.BufferGeometry();
    sides.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    sides.computeVertexNormals();
    return { geometry: g, skirt: sides };
  }, [tile, exaggeration, middle, base]);
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
    <color attach="background" args={[theme === "dark" ? "#12161c" : "#e7ebef"]} />
    <hemisphereLight args={["#ffffff", "#44484e", 0.85]} />
    <directionalLight position={[-3, 5, 4]} intensity={2} />
    <directionalLight position={sun} intensity={sunEl > 0 ? 1 : 0} />
    <group rotation={[-Math.PI / 2, 0, 0]}>
      <mesh geometry={geometry}><meshStandardMaterial color="#b8b8b2" roughness={1} side={THREE.DoubleSide} /></mesh>
      <mesh geometry={skirt}><meshStandardMaterial color="#585e66" roughness={1} side={THREE.DoubleSide} /></mesh>
    </group>
    <mesh position={[0, base - 0.025, 0]}><boxGeometry args={[2.01, 0.05, 2.01]} /><meshStandardMaterial color="#454b53" roughness={1} /></mesh>
    <lineSegments><bufferGeometry><bufferAttribute attach="attributes-position" args={[new Float32Array([...observer, ...sun, ...observer, ...earth]), 3]} /></bufferGeometry><lineBasicMaterial color="#8793a3" transparent opacity={0.45} /></lineSegments>
    <mesh position={sun}><sphereGeometry args={[0.045, 24, 16]} /><meshBasicMaterial color="#f4b740" toneMapped={false} /></mesh>
    <mesh position={earth}><sphereGeometry args={[0.045, 24, 16]} /><meshBasicMaterial color="#6fa8ff" toneMapped={false} /></mesh>
    <mesh position={observer}><sphereGeometry args={[0.022, 16, 12]} /><meshBasicMaterial color="#ffffff" toneMapped={false} /></mesh>
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
