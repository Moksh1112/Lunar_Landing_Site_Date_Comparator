import { Link, Navigate, useLocation, type RouteObject } from "react-router";
import { LEGACY_REDIRECTS, PATHS, legacyTarget } from "./routes";

/** Old link → new route, with replace semantics so Back does not bounce through the redirect. */
function LegacyRedirect() {
  const { pathname, search, hash } = useLocation();
  return <Navigate to={legacyTarget(pathname, search, hash) ?? PATHS.home} replace />;
}

function NotFound() {
  return (
    <main>
      <h1>Page not found</h1>
      <p>This address is not part of Azelux.</p>
      <p className="row-actions">
        <Link to={PATHS.home} className="btn">Home</Link>{" "}
        <Link to={PATHS.compare} className="btn btn-primary">Compare landing plans</Link>
      </p>
    </main>
  );
}

const page = (load: () => Promise<{ Component: React.ComponentType }>) => ({ lazy: load });

export const routeObjects: RouteObject[] = [
  { path: PATHS.home, ...page(async () => ({ Component: (await import("../features/landing/LandingPage")).LandingPage })) },
  // Full-screen learning experiences (own chrome, optional).
  { path: PATHS.tour, ...page(async () => ({ Component: (await import("../features/landing/LandingPage")).LandingPage })) },
  { path: PATHS.simulator, ...page(async () => ({ Component: (await import("../features/sim/SimulatorPage")).SimulatorPage })) },
  ...Object.keys(LEGACY_REDIRECTS).map((path) => ({ path, element: <LegacyRedirect /> })),
  {
    ...page(async () => ({ Component: (await import("./AppShell")).AppShell })),
    children: [
      { path: PATHS.compare, ...page(async () => ({ Component: (await import("../features/compare/ComparePage")).ComparePage })) },
      { path: PATHS.bestDate, ...page(async () => ({ Component: (await import("../features/bestdate/BestDatePage")).BestDatePage })) },
      { path: PATHS.terrain, ...page(async () => ({ Component: (await import("../features/terrain3d/TerrainAnalyserPage")).TerrainAnalyserPage })) },
      { path: PATHS.methods, ...page(async () => ({ Component: (await import("../features/methods/MethodsPage")).MethodsPage })) },
      { path: PATHS.report, ...page(async () => ({ Component: (await import("../features/report/ReportPage")).ReportPage })) },
      { path: "*", element: <NotFound /> },
    ],
  },
];
