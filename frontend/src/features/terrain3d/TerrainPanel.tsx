import { Component, Suspense, lazy, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { getTerrainTile } from "../../api/client";
import type { CompareResponse } from "../../api/types";
import { useStore } from "../../store";
import { absoluteTime, momentAt } from "../compare/moment";

const TerrainCanvas = lazy(() => import("./TerrainCanvas"));
class ViewerBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <p role="status">3D could not start. Use the panorama and timeline.</p> : this.props.children; }
}
function LoadedViewer({ data, started }: { data: CompareResponse; started: number }) {
  const [plan, setPlan] = useState(0);
  const [exaggeration, setExaggeration] = useState(1);
  const [renderMs, setRenderMs] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const scrubT = useStore((s) => s.scrubT);
  const setScrubT = useStore((s) => s.setScrubT);
  const alignBy = useStore((s) => s.alignBy);
  const scenario = data.scenarios[plan];
  const tile = useQuery({ queryKey: ["terrain3d", scenario.site.lat_deg, scenario.site.lon_east_deg],
    queryFn: () => getTerrainTile({ lat_deg: scenario.site.lat_deg, lon_east_deg: scenario.site.lon_east_deg, size_km: 20 }), retry: false });
  const readyOnce = useRef(false);
  const ready = useCallback(() => { if (!readyOnce.current) { readyOnce.current = true; setRenderMs(performance.now() - started); } }, [started]);
  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => {
      const start = alignBy === "mission_day" ? 0 : scenario.series.t_unix[0];
      const end = alignBy === "mission_day" ? scenario.series.t_unix.at(-1)! - scenario.series.t_unix[0] : scenario.series.t_unix.at(-1)!;
      const next = (scrubT ?? start) + 3600;
      if (next > end) setPlaying(false); else setScrubT(next);
    }, 250);
    return () => clearInterval(timer);
  }, [playing, scrubT, alignBy, scenario, setScrubT]);
  const t = absoluteTime(scenario, scrubT, alignBy);
  const m = t === null ? null : momentAt(scenario, t);
  return <section aria-label="Terrain 3D">
    <h3>Terrain 3D</h3>
    <p>{tile.data?.data_label ?? scenario.meta.data_label} · {scenario.meta.horizon_mode === "geometric" ? "geometric horizon only" : scenario.meta.horizon_mode}.
      Terrain geometry; Sun/Earth marker distances are schematic. Brightness is illustrative, not a shadow or power simulation.</p>
    <label>Plan <select value={plan} onChange={(e) => setPlan(Number(e.target.value))}><option value={0}>A</option><option value={1}>B</option></select></label>{" "}
    <label>Vertical exaggeration <select value={exaggeration} onChange={(e) => setExaggeration(Number(e.target.value))}>{[1, 2, 5].map((v) => <option key={v} value={v}>{v}×</option>)}</select></label>{" "}
    <button type="button" onClick={() => setPlaying(!playing)}>{playing ? "Pause mission" : "Play mission"}</button>
    {tile.isPending ? <p role="status">Loading terrain…</p> : tile.isError ? <p role="status">Terrain unavailable. The 2D views remain available.</p> : renderMs !== null && renderMs > 3000 ? <p role="status">3D exceeded the 3-second gate ({Math.round(renderMs)} ms). Use the 2D views.</p> : m && <div style={{ height: "24rem", maxWidth: "100%" }}>
      <ViewerBoundary><Suspense fallback={<p>Preparing 3D…</p>}><TerrainCanvas tile={tile.data} sunAz={m.sunAz} sunEl={m.sunEl} earthAz={m.earthAz} earthEl={m.earthEl} exaggeration={exaggeration} onReady={ready} /></Suspense></ViewerBoundary>
    </div>}
    {renderMs !== null && <p>First frame: {Math.round(renderMs)} ms (includes request and lazy loading). Vertical exaggeration {exaggeration}×.</p>}
    {m && <p>Sun {m.sunAz.toFixed(1)}° azimuth / {m.sunEl.toFixed(1)}° elevation; Earth {m.earthAz.toFixed(1)}° / {m.earthEl.toFixed(1)}°. Scrubber controls these markers.</p>}
  </section>;
}
export function TerrainPanel({ data }: { data: CompareResponse }) {
  const [started, setStarted] = useState<number | null>(null);
  return started === null ? <button type="button" onClick={() => setStarted(performance.now())}>Open terrain 3D</button> : <LoadedViewer data={data} started={started} />;
}
