import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CRS, type LatLngBoundsExpression } from "leaflet";
import { Circle, CircleMarker, ImageOverlay, MapContainer, Polyline, Rectangle, Tooltip, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { getBasemap, hillshadeUrl } from "../../api/basemap";
import { USE_MOCK } from "../../api/client";
import { getSites } from "../../api/client";
import { useStore } from "../../store";
import { convertLon, parseNum } from "../compare/compareForm";
import { COVERAGE_LAT, POLAR_EDGE_LAT, globalInverse, polarForward, polarInverse, polarRadius, round4 } from "./projection";
import styles from "./map.module.css";

type View = "global" | "polar";
type Target = "A" | "B";

const GLOBAL_BOUNDS: LatLngBoundsExpression = [[-90, 0], [90, 360]];
const EDGE = polarRadius(POLAR_EDGE_LAT);
const POLAR_BOUNDS: LatLngBoundsExpression = [[-EDGE, -EDGE], [EDGE, EDGE]];

function ClickPick({ view, onPick }: { view: View; onPick: (lat: number, lon: number) => void }) {
  useMapEvents({
    click(e) {
      const { lat: y, lng: x } = e.latlng;
      const p = view === "global" ? globalInverse(y, x) : polarInverse(x, y);
      if (p && (view === "global" || p.lat <= POLAR_EDGE_LAT)) onPick(p.lat, p.lon);
    },
  });
  return null;
}

/** Keep the whole grid fitted when the container size changes (lazy mount, details open, resize). */
function FitOnResize({ bounds }: { bounds: LatLngBoundsExpression }) {
  const map = useMap();
  useEffect(() => {
    const el = map.getContainer();
    const fit = () => {
      map.invalidateSize();
      map.fitBounds(bounds, { animate: false });
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [map, bounds]);
  return null;
}

function Graticule({ view }: { view: View }) {
  const lines = useMemo(() => {
    if (view === "global") {
      const out: [number, number][][] = [];
      for (let lon = 0; lon <= 360; lon += 30) out.push([[-90, lon], [90, lon]]);
      for (let lat = -60; lat <= 60; lat += 30) out.push([[lat, 0], [lat, 360]]);
      return out;
    }
    const out: [number, number][][] = [];
    for (let lon = 0; lon < 360; lon += 30) {
      const p = polarForward(POLAR_EDGE_LAT, lon);
      out.push([[0, 0], [p.y, p.x]]);
    }
    return out;
  }, [view]);
  return (
    <>
      {lines.map((l, i) => <Polyline key={i} positions={l} pathOptions={{ color: "#3d4757", weight: 1, interactive: false }} />)}
      {view === "polar" &&
        [-85, POLAR_EDGE_LAT].map((lat) => (
          <Circle key={lat} center={[0, 0]} radius={polarRadius(lat)} pathOptions={{ color: "#3d4757", weight: 1, fill: false, interactive: false }} />
        ))}
    </>
  );
}

/** F3 site picker: click to set a plan's coordinates; curated pins; 80.7 deg S DEM coverage outline. */
export default function SiteMap() {
  const [imageFailed, setImageFailed] = useState(false);
  const [view, setView] = useState<View>("polar");
  const [target, setTarget] = useState<Target>("A");
  const mode = useStore((s) => s.mode);
  const scenarios = useStore((s) => s.scenarios);
  const setScenario = useStore((s) => s.setScenario);
  const basemap = useQuery({ queryKey: ["lunar-basemap"], queryFn: ({ signal }) => getBasemap(signal), enabled: !USE_MOCK && view === "polar", retry: false });
  const sites = useQuery({ queryKey: ["sites"], queryFn: getSites });
  const bLocked = mode === "date_shift";
  const effTarget: Target = bLocked ? "A" : target;

  const toPlane = (lat: number, lon: number): [number, number] => {
    if (view === "global") return [lat, lon];
    const p = polarForward(lat, lon);
    return [p.y, p.x];
  };
  const inView = (lat: number) => view === "global" || lat <= POLAR_EDGE_LAT;

  const plans = (["A", "B"] as const)
    .map((id) => {
      const lat = parseNum(scenarios[id].lat);
      const lonRaw = parseNum(scenarios[id].lon);
      const lon = lonRaw === null ? null : convertLon(lonRaw);
      return lat === null || lon === null || !inView(lat) ? null : { id, pos: toPlane(lat, lon) };
    })
    .filter((p): p is { id: "A" | "B"; pos: [number, number] } => p !== null);

  const pick = (lat: number, lon: number) =>
    setScenario(effTarget, { lat: round4(lat), lon: round4(lon), siteId: null, siteName: null });

  return (
    <div className={styles.wrap}>
      <div className={styles.controls}>
        <div role="group" aria-label="Map view" className="segmented">
          <button type="button" aria-pressed={view === "polar"} onClick={() => setView("polar")}>South pole</button>
          <button type="button" aria-pressed={view === "global"} onClick={() => setView("global")}>Whole Moon</button>
        </div>
        <div role="group" aria-label="Map click sets" className="segmented">
          <button type="button" aria-pressed={effTarget === "A"} onClick={() => setTarget("A")}>Sets Plan A</button>
          <button type="button" aria-pressed={effTarget === "B"} disabled={bLocked} onClick={() => setTarget("B")}>Sets Plan B</button>
        </div>
      </div>
      <p className={styles.notice} role="note">
        {view === "polar" && basemap.data && !imageFailed ? <>
          <strong>NASA LOLA hillshade.</strong> {basemap.data.method}{" "}
          <a href={basemap.data.source_url} target="_blank" rel="noreferrer">{basemap.data.citation}</a>
        </> : <><strong>Basemap unavailable.</strong> Coordinate grid only; no lunar imagery is loaded for this view.</>}
      </p>
      <MapContainer
        key={view}
        crs={CRS.Simple}
        bounds={view === "global" ? GLOBAL_BOUNDS : POLAR_BOUNDS}
        maxBounds={view === "global" ? GLOBAL_BOUNDS : POLAR_BOUNDS}
        minZoom={-4}
        maxZoom={6}
        zoomSnap={0.25}
        attributionControl={false}
        className={styles.map}
        aria-label={view === "global" ? "Whole-Moon coordinate grid, east longitude 0 to 360" : "South-pole coordinate grid to 75 degrees south"}
      >
        {view === "polar" && basemap.data && !imageFailed && (
          <ImageOverlay url={hillshadeUrl}
            bounds={[[basemap.data.bounds_m[1] / 1000, basemap.data.bounds_m[0] / 1000],
                     [basemap.data.bounds_m[3] / 1000, basemap.data.bounds_m[2] / 1000]]}
            eventHandlers={{ error: () => setImageFailed(true) }} opacity={0.85} />
        )}
        <FitOnResize bounds={view === "global" ? GLOBAL_BOUNDS : POLAR_BOUNDS} />
        <Graticule view={view} />
        {view === "polar" ? (
          <Circle center={[0, 0]} radius={polarRadius(COVERAGE_LAT)} pathOptions={{ color: "#f6c445", weight: 2, dashArray: "6 4", fillOpacity: 0.06 }}>
            <Tooltip sticky>South-pole DEM coverage outline (80.7°S, TRD)</Tooltip>
          </Circle>
        ) : (
          <Rectangle bounds={[[-90, 0], [COVERAGE_LAT, 360]]} pathOptions={{ color: "#f6c445", weight: 2, dashArray: "6 4", fillOpacity: 0.12 }}>
            <Tooltip sticky>South-pole DEM coverage outline (south of 80.7°S, TRD)</Tooltip>
          </Rectangle>
        )}
        {(sites.data?.sites ?? []).filter((s) => inView(s.lat_deg)).map((s) => (
          <CircleMarker
            key={s.site_id}
            center={toPlane(s.lat_deg, s.lon_east_deg)}
            radius={5}
            pathOptions={{ color: "#e9edf2", weight: 1.5, fillColor: s.verified ? "#e9edf2" : "#8590a0", fillOpacity: 0.9 }}
            eventHandlers={{
              click: (e) => {
                e.originalEvent.stopPropagation();
                setScenario(effTarget, { siteId: s.site_id, siteName: s.name, lat: String(s.lat_deg), lon: String(s.lon_east_deg) });
              },
            }}
          >
            <Tooltip>{s.name}{s.verified ? "" : " (SYNTHETIC, unverified)"}</Tooltip>
          </CircleMarker>
        ))}
        {plans.map((p) => (
          <CircleMarker key={p.id} center={p.pos} radius={8} pathOptions={{ color: p.id === "A" ? "#2fd0b9" : "#b49cff", weight: 3, fillOpacity: 0.25 }} interactive={false} />
        ))}
        <ClickPick view={view} onPick={pick} />
      </MapContainer>
      <ul className={styles.legend}>
        <li><span className={styles.swA} aria-hidden="true" />Plan A</li>
        <li><span className={styles.swB} aria-hidden="true" />Plan B</li>
        <li><span className={styles.swSite} aria-hidden="true" />Library site (click to use)</li>
        <li><span className={styles.swCov} aria-hidden="true" />DEM coverage, 80.7°S</li>
      </ul>
      <p className={styles.caption}>
        {view === "polar"
          ? "Polar stereographic grid to 75°S, rings at 80.7°S and 85°S, spokes every 30° (0°E up). Hillshade uses NASA polar stereographic bounds; unavailable imagery is explicitly indicated above."
          : "Equirectangular grid: east longitude 0–360° across, latitude up. The shaded band is south of 80.7°S."}
        {bLocked && " Date shift preset: Plan B's site follows Plan A."}
      </p>
    </div>
  );
}
