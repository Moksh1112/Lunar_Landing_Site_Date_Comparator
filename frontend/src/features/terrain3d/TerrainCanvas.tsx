import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { TerrainTileResponse } from "../../api/types";
import { bodyDirection, decodeHeights } from "./math";

type Props = { tile: TerrainTileResponse; sunAz: number; sunEl: number; earthAz: number; earthEl: number;
  exaggeration: number; onReady: () => void };
function Scene({ tile, sunAz, sunEl, earthAz, earthEl, exaggeration, onReady }: Props) {
  const ready = useRef(false);
  const { camera, gl, invalidate } = useThree();
  useEffect(() => {
    const controls = new OrbitControls(camera, gl.domElement);
    const changed = () => invalidate();
    controls.addEventListener("change", changed);
    controls.minDistance = 0.5;
    controls.maxDistance = 8;
    controls.maxPolarAngle = Math.PI / 2;
    controls.update();
    return () => { controls.removeEventListener("change", changed); controls.dispose(); };
  }, [camera, gl, invalidate]);
  useFrame(() => { if (!ready.current) { ready.current = true; requestAnimationFrame(onReady); } });
  const geometry = useMemo(() => {
    const heights = decodeHeights(tile.heights_m_b64, tile.width, tile.height);
    const g = new THREE.PlaneGeometry(2, 2, tile.width - 1, tile.height - 1);
    const p = g.attributes.position;
    for (let i = 0; i < heights.length; i++) p.setZ(i, (heights[i] - tile.min_m) / (tile.size_km * 1000) * 2 * exaggeration);
    g.computeVertexNormals();
    return g;
  }, [tile, exaggeration]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const sun = bodyDirection(sunAz, sunEl, tile.grid_bearing_offset_deg ?? tile.site.lon_east_deg).map((v) => v * 3) as [number, number, number];
  const observerX = (tile.site_px[0] / (tile.width - 1) - 0.5) * 2;
  const observerY = useMemo(() => {
    const h = decodeHeights(tile.heights_m_b64, tile.width, tile.height);
    const index = Math.round(tile.site_px[1]) * tile.width + Math.round(tile.site_px[0]);
    return (h[index] - tile.min_m) / (tile.size_km * 1000) * 2 * exaggeration + 0.006;
  }, [tile, exaggeration]);
  const observerZ = (tile.site_px[1] / (tile.height - 1) - 0.5) * 2;
  const earth = bodyDirection(earthAz, earthEl, tile.grid_bearing_offset_deg ?? tile.site.lon_east_deg).map((v) => v * 2.5) as [number, number, number];
  return <>
    <ambientLight intensity={0.5} />
    <directionalLight position={sun} intensity={sunEl > 0 ? 2 : 0} />
    <mesh rotation={[-Math.PI / 2, 0, 0]} geometry={geometry}><meshStandardMaterial color="#b8b5ac" side={THREE.DoubleSide} /></mesh>
    <mesh position={sun}><sphereGeometry args={[0.07, 16, 12]} /><meshBasicMaterial color="#956000" /></mesh>
    <mesh position={earth}><sphereGeometry args={[0.065, 16, 12]} /><meshBasicMaterial color="#245bb5" /></mesh>
    <mesh position={[observerX, observerY, observerZ]}><sphereGeometry args={[0.025, 12, 8]} /><meshBasicMaterial color="#244bb3" /></mesh>
    <axesHelper args={[0.5]} />
  </>;
}
export default function TerrainCanvas(props: Props) {
  return <Canvas camera={{ position: [2, 2, 2], fov: 45, near: 0.01, far: 30 }} frameloop="demand"
    aria-label="Interactive terrain diagram. Drag to orbit; numeric values and the accessible 2D views remain below.">
    <Scene {...props} />
  </Canvas>;
}
