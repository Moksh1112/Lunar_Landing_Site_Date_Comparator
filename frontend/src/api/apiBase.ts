/**
 * API origin for the browser. Unset: the local development backend. Empty string: same origin (a reverse proxy
 * serves `/api`, `/health` and `/assets/lunar` next to the frontend). Otherwise the given origin, without a
 * trailing slash. Used by the typed client and the basemap URLs so both resolve the same way.
 */
export const resolveApiBase = (value: string | undefined): string => (value ?? "http://127.0.0.1:8000").replace(/\/$/, "");
export const API_BASE = resolveApiBase(import.meta.env.VITE_API_URL);
