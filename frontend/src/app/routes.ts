/** Azelux route map and navigation rules (pure, unit-tested). */
export const PATHS = {
  home: "/",
  compare: "/compare",
  bestDate: "/best-date",
  terrain: "/terrain",
  methods: "/methods",
  report: "/report",
  tour: "/learn/tour",
  simulator: "/learn/simulator",
} as const;

/** Old public links that must keep working (redirect with replace, query and hash kept). */
export const LEGACY_REDIRECTS: Readonly<Record<string, string>> = {
  "/landing": PATHS.simulator,
  "/landing/tour": PATHS.tour,
  "/tour": PATHS.tour,
};

export function legacyTarget(pathname: string, search = "", hash = ""): string | null {
  const to = LEGACY_REDIRECTS[pathname.replace(/\/+$/, "") || "/"];
  return to ? `${to}${search}${hash}` : null;
}

/** Where the app's Back control goes when there is no earlier Azelux page (direct entry, reload, external referrer). */
export function backFallback(pathname: string): string {
  if (pathname.startsWith("/learn/")) return PATHS.home;
  if (pathname === PATHS.bestDate || pathname === PATHS.terrain || pathname === PATHS.methods || pathname === PATHS.report) return PATHS.compare;
  return PATHS.home;
}

/**
 * True when the current entry was reached by in-app navigation. React Router gives the first entry of a
 * session (direct load, reload, arrival from another site) the key "default"; history.length is not used
 * because it counts external pages.
 */
export const hasInAppHistory = (locationKey: string) => locationKey !== "default";

export type NavItem = { to: string; label: string; end?: boolean };
/** Main navigation; the tour is Home and the simulator has a direct link. */
export const MAIN_NAV: NavItem[] = [
  { to: PATHS.home, label: "Home", end: true },
  { to: PATHS.compare, label: "Compare" },
  { to: PATHS.bestDate, label: "Best Date" },
  { to: PATHS.terrain, label: "3D Terrain" },
  { to: PATHS.simulator, label: "Simulator" },
];
export const TRAILING_NAV: NavItem[] = [{ to: PATHS.methods, label: "Methods" }];
