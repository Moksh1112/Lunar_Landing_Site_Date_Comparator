// F3 map coordinates (TRD 4.2, 7.5). Leaflet CRS.Simple: LatLng(y, x) are plain plane coordinates.
// Global view: equirectangular, x = east longitude 0..360, y = latitude.
// Polar view: south polar stereographic on the 1,737.4 km sphere, km:
//   r = 2R tan(pi/4 + phi/2), x = r sin(lambda), y = r cos(lambda)
// The TRD marks the x/y sign as "TO VERIFY" against a raster; with no raster loaded this
// orientation (0 deg E up, 90 deg E right) is a schematic, not a georeferenced claim.
export const R_KM = 1737.4;
export const COVERAGE_LAT = -80.7; // TRD 4.1/7.5: south-pole DEM coverage circle
export const POLAR_EDGE_LAT = -75;

const D2R = Math.PI / 180;

export const normLon = (lon: number): number => ((lon % 360) + 360) % 360;

export function polarForward(latDeg: number, lonDeg: number): { x: number; y: number } {
  const r = 2 * R_KM * Math.tan(Math.PI / 4 + (latDeg * D2R) / 2);
  return { x: r * Math.sin(lonDeg * D2R), y: r * Math.cos(lonDeg * D2R) };
}

export function polarInverse(x: number, y: number): { lat: number; lon: number } {
  const r = Math.hypot(x, y);
  const lat = (2 * Math.atan(r / (2 * R_KM)) - Math.PI / 2) / D2R;
  return { lat, lon: r === 0 ? 0 : normLon(Math.atan2(x, y) / D2R) };
}

export const polarRadius = (latDeg: number): number => 2 * R_KM * Math.tan(Math.PI / 4 + (latDeg * D2R) / 2);

/** Click on the global plane -> site coordinates, or null outside the map. */
export function globalInverse(y: number, x: number): { lat: number; lon: number } | null {
  if (y < -90 || y > 90 || x < 0 || x > 360) return null;
  return { lat: y, lon: normLon(x) };
}

/** Rounded for the form (4 dp ~ 3 m); the API applies its own |lat| <= 89.99 rule. */
export const round4 = (n: number): string => String(Math.round(n * 1e4) / 1e4);
