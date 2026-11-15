import { Component, Suspense, lazy, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { getTerrainTile } from "../../api/client";
import type { CompareResponse } from "../../api/types";
import { useStore } from "../../store";
import { absoluteTime, momentAt } from "../compare/moment";
import { viewerErrorHint } from "./viewerError";
import styles from "./terrain.module.css";

const TerrainCanvas = lazy(() => import("./TerrainCanvas"));
class ViewerBoundary extends Component<{ children: ReactNode; onRetry?: () => void; views: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() { return this.state.error ? <div className={styles.recovery} data-viewer-error role="status">
    <strong>Terrain 3D could not start.</strong>
    <p>{viewerErrorHint(this.state.error.message)}</p>
    <details><summary>Graphics details</summary><p>{this.state.error.message.slice(0, 240)}</p></details>
    {this.props.onRetry ? <button type="button" onClick={this.props.onRetry}>Retry terrain 3D</button> : <p>Two attempts failed. Continue with the sky/horizon graphs and timeline; they do not require 3D.</p>}
    {this.props.views}
  </div> : this.props.children; }
}
function LoadedViewer({ data, started, views }: { data: CompareResponse; started: number; views: ReactNode }) {
  const [plan, setPlan] = useState(0);
  const [exaggeration, setExaggeration] = useState(1);
  const [renderMs, setRenderMs] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [attempt, setAttempt] = useState(1);
  const [resetView, setResetView] = useState(0);
  const attemptStarted = useRef(started);
  const scrubT = useStore((s) => s.scrubT);
  const setScrubT = useStore((s) => s.setScrubT);
  const alignBy = useStore((s) => s.alignBy);
  const scenario = data.scenarios[plan];
  const tile = useQuery({ queryKey: ["terrain3d", scenario.site.lat_deg, scenario.site.lon_east_deg],
    queryFn: () => getTerrainTile({ lat_deg: scenario.site.lat_deg, lon_east_deg: scenario.site.lon_east_deg, size_km: 20 }), retry: false });
  const readyOnce = useRef(false);
  const ready = useCallback(() => { if (!readyOnce.current) { readyOnce.current = true; setRenderMs(performance.now() - attemptStarted.current); } }, []);
  const retry = () => { readyOnce.current = false; attemptStarted.current = performance.now(); setRenderMs(null); setPlaying(false); setAttempt(a => a + 1); };
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
  return <section className={styles.panel} aria-label="Terrain 3D">
    <h2>{scenario.label} — terrain</h2>
    <p>{scenario.site.name ?? `${scenario.site.lat_deg}°, ${scenario.site.lon_east_deg}° E`} · {new Date(scenario.series.t_unix[0] * 1000).toISOString().slice(0, 16).replace("T", " ")} UTC</p>
    <p>{tile.data?.data_label ?? scenario.meta.data_label} · {scenario.meta.horizon_mode === "geometric" ? "geometric horizon only" : scenario.meta.horizon_mode}</p>
    <div className={styles.toolbar} role="group" aria-label="Terrain controls">
      <div className={styles.field}><span>Plan</span><div className="segmented" role="group" aria-label="Terrain plan">{[0, 1].map(p => <button key={p} type="button" aria-pressed={plan === p} onClick={() => setPlan(p)}>Plan {p === 0 ? "A" : "B"}</button>)}</div></div>
      <div className={styles.field}><span>Height scale</span><div className="segmented" role="group" aria-label="Vertical exaggeration">{[1, 2, 5].map(v => <button key={v} type="button" aria-pressed={exaggeration === v} onClick={() => setExaggeration(v)}>{v}×</button>)}</div></div>
      <div className={styles.viewActions}>
        <button type="button" onClick={() => setResetView(v => v + 1)}>↺ Reset view</button>
        <button type="button" className="btn-primary" onClick={() => setPlaying(!playing)}><span aria-hidden="true">{playing ? "Ⅱ" : "▶"}</span> {playing ? "Pause mission" : "Play mission"}</button>
      </div>
    </div>
    {tile.isPending ? <p role="status">Loading terrain…</p> : tile.isError ? <div className={styles.recovery}><p role="status">Terrain unavailable. The comparison's 2D graphs remain available.</p>{views}</div> : renderMs !== null && renderMs > 3000 ? <div className={styles.recovery}><p role="status">3D exceeded the 3-second gate ({Math.round(renderMs)} ms). Continue with the 2D graphs.</p>{views}</div> : m &&
      <ViewerBoundary key={attempt} onRetry={attempt < 2 ? retry : undefined} views={views}><div className={styles.viewport}><Suspense fallback={<p>Preparing 3D…</p>}><TerrainCanvas tile={tile.data} sunAz={m.sunAz} sunEl={m.sunEl} earthAz={m.earthAz} earthEl={m.earthEl} exaggeration={exaggeration} resetView={resetView} onReady={ready} /></Suspense><div className={styles.viewerHint}>Drag to orbit · Scroll to zoom</div></div></ViewerBoundary>}
    <div className={styles.legend}><span><i className={styles.siteDot} />Landing point</span><span><i className={styles.sunDot} />Sun</span><span><i className={styles.earthDot} />Earth</span><span>{tile.data?.size_km ?? 20} km tile · {exaggeration}× height</span></div>
    {renderMs !== null && <p>First frame: {Math.round(renderMs)} ms (includes request and lazy loading). Vertical exaggeration {exaggeration}×.</p>}
    {m && <p>Sun {m.sunAz.toFixed(1)}° azimuth / {m.sunEl.toFixed(1)}° elevation; Earth {m.earthAz.toFixed(1)}° / {m.earthEl.toFixed(1)}°. Scrubber controls these markers.</p>}
  </section>;
}
export function TerrainPanel({ data, onShow2D }: { data: CompareResponse; onShow2D: (view: "horizon" | "timeline") => void }) {
  const [started] = useState(() => performance.now());
  const views = <div className={styles.controls}><button type="button" onClick={() => onShow2D("horizon")}>Open 2D sky and horizon graphs</button><button type="button" onClick={() => onShow2D("timeline")}>Open 2D timeline</button></div>;
  return <LoadedViewer data={data} started={started} views={views} />;
}
