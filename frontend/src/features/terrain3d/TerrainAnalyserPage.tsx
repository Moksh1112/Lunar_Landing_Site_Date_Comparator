import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { postCompare } from "../../api/client";
import type { ApiError } from "../../api/errors";
import type { CompareResponse } from "../../api/types";
import { ErrorState } from "../../components/ErrorState";
import { Skeleton } from "../../components/Skeleton";
import { useStore } from "../../store";
import { buildRequest, matchesComputedPlans, sharedYRange, validate, type CompareForm } from "../compare/compareForm";
import { HorizonPanorama } from "../compare/HorizonPanorama";
import { SkyRing } from "../compare/SkyRing";
import { TimelineLanes } from "../compare/TimelineLanes";
import { MomentReadout } from "../compare/MomentReadout";
import { absoluteTime } from "../compare/moment";
import { TerrainPanel } from "./TerrainPanel";
import styles from "./analyser.module.css";

type View = "terrain" | "horizon" | "timeline";
export function TerrainAnalyserPage() {
  const { mode, scenarios, thresholds, lastCompare, setLastCompare, scrubT, setScrubT, alignBy } = useStore();
  const [view, setView] = useState<View>("terrain");
  const show2D = (next: "horizon" | "timeline") => {
    setView(next);
    requestAnimationFrame(() => document.getElementById(`terrain-${next}`)?.focus());
  };
  const request = useMemo(() => {
    const form: CompareForm = { mode, scenarios: [scenarios.A, scenarios.B], thresholds };
    return Object.keys(validate(form)).length ? null : buildRequest(form);
  }, [mode, scenarios, thresholds]);
  const current = lastCompare && matchesComputedPlans({ mode, scenarios: [scenarios.A, scenarios.B], thresholds }, lastCompare.request) ? lastCompare : null;
  const comparison = useQuery<CompareResponse, ApiError>({ queryKey: ["terrain-plans", request], queryFn: () => postCompare(request!), enabled: !!request && !current, retry: false });
  useEffect(() => {
    if (comparison.data && request && !current) setLastCompare({ request, response: comparison.data });
  }, [comparison.data, request, current, setLastCompare]);
  const data = current?.response ?? comparison.data;
  const range = data ? sharedYRange(data.scenarios) : null;
  return <main className={styles.page}>
    <header>
      <h1>3D Terrain Analyser</h1>
      <p>Explore the terrain around your landing plans. <Link to="/compare">Edit plans</Link> · <Link to="/methods#visuals">View sources</Link></p>
    </header>
    <div className="segmented" role="group" aria-label="Terrain analyser view">
      {([ ["terrain", "3D Terrain"], ["horizon", "Sky & horizon"], ["timeline", "Timeline"] ] as const).map(([id, label]) => <button key={id} type="button" aria-pressed={view === id} onClick={() => setView(id)}>{label}</button>)}
    </div>
    {!request ? <p>Check the site, date and mission inputs on <Link to="/compare">Compare</Link> to load terrain.</p> : comparison.isError && !data ? <ErrorState error={comparison.error} onRetry={() => void comparison.refetch()} /> : !data || !range ? <Skeleton height="24rem" label="Loading terrain plans" /> : <>
      <div hidden={view !== "terrain"}><TerrainPanel key={data.scenarios[0].meta.computed_at} data={data} onShow2D={show2D} /></div>
      {view === "horizon" && <div id="terrain-horizon" role="region" aria-label="Sky and horizon views" tabIndex={-1} className={styles.grid}>{data.scenarios.map(s => <div key={s.id} className={styles.plan}><h2>{s.label}</h2><SkyRing scenario={s} scrubT={absoluteTime(s, scrubT, alignBy)} yMinDeg={range.yMin} yMaxDeg={range.yMax} /><HorizonPanorama scenario={s} scrubT={absoluteTime(s, scrubT, alignBy)} yMinDeg={range.yMin} yMaxDeg={range.yMax} /></div>)}</div>}
      <div id="terrain-timeline" role="region" aria-label="Terrain timeline" tabIndex={-1} hidden={view !== "timeline"}>
        <TimelineLanes data={data} alignBy={alignBy} scrubT={scrubT} onScrub={setScrubT} />
        <MomentReadout data={data} scrubT={scrubT} alignBy={alignBy} expert={false} />
      </div>
    </>}
  </main>;
}
