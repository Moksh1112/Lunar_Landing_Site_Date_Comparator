# Azelux CONTRACT v1.0

Status: adopted as the sole new-work baseline at the user's request. This is the
new kit contract, not either earlier repository v1.0. Team freeze and implementation
conformance are NOT claimed. Open ambiguities: CONTRACT_CHANGE_REQUESTS_S0.md.
P1 records approved shared changes; frontend/backend/terrain owners implement.


Owner: P2 writes it, P1 is the only person who commits it after Sync 0. Changes only through a CONTRACT CHANGE REQUEST approved by the Coordinator.

## Conventions

- Base URL: `VITE_API_URL` (frontend) → backend. All paths start with `/api/v1` except `/health`.
- Format: JSON, UTF-8. Unknown request fields are rejected (`INVALID_INPUT`).
- Times: ISO 8601 UTC strings ending in `Z` (e.g. `2027-03-01T00:00:00Z`). Time series use integer Unix seconds (`t_unix`).
- Angles: degrees. Azimuth 0–360, from local north, clockwise (east = 90). Elevation −90 to 90 above the local horizontal plane.
- Coordinates: `lat_deg` −90 to 90 (planetocentric), `lon_east_deg` 0 to <360 (east-positive). The frontend converts −180..180 input before sending.
- Durations: hours (`*_hours`, `*_h`), floats with 0.1 precision.
- Percentages: 0–100 floats with 0.1 precision.
- Booleans in series: arrays of 0/1 integers (smaller payload).
- Max request body: 64 KB. Server timeout: 30 s (sweep), 10 s (others).
- Auth: none. CORS: exact frontend origins only.

## Error shape (every endpoint)

```json
{"error": {"code": "INVALID_INPUT", "message": "Readable message for users",
           "details": [{"field": "scenarios[1].lat_deg", "reason": "must be between -90 and 90"}]}}
```

| Code | HTTP | When |
| --- | --- | --- |
| `INVALID_INPUT` | 400 | Validation failed (range, type, unknown field, pole within 0.01°) |
| `NOT_FOUND` | 404 | Unknown `site_id` |
| `NOT_IN_COVERAGE` | 422 | `/skyline` or `/terrain-tile` asked for a point outside terrain coverage |
| `RANGE_TOO_LARGE` | 413 | Mission > 8,760 h, sweep range > 183 days, or too many samples |
| `UPSTREAM_UNAVAILABLE` | 503 | Horizons unreachable (validation endpoint only) |
| `INTERNAL` | 500 | Anything else. Never includes a stack trace |

## Shared objects

```text
Site        { site_id: string|null, name: string|null, lat_deg: number, lon_east_deg: number }
Thresholds  { sun_pct_min: number=50, earth_pct_min: number=50,
              dark_gap_h_max: number=48, blackout_h_max: number=72 }
Meta        { ephemeris: "SPICE DE440 (JPL NAIF)", kernels: string[],
              horizon_mode: "terrain"|"terrain_coarse"|"geometric", dem: string|null,
              step_minutes: number, observer_height_m: number,
              app_version: string, contract_version: "1.0",
              computed_at: ISO string, data_label: "REAL"|"SYNTHETIC" }
Window      { start: ISO, end: ISO, hours: number,
              start_censored: boolean, end_censored: boolean }
Metrics     { sun_el_max_deg: number, sun_el_mean_up_deg: number|null,
              sun_hours, sun_pct, earth_hours, earth_pct, both_hours, both_pct,
              longest_dark_h, longest_blackout_h }          (all numbers)
Verdict     { level: "green"|"amber"|"red", failed: string[] }   failed ⊆ keys of Thresholds
Skyline     { az_step_deg: 0.5, elev_deg: number[720], block_dist_km: number[720]|null }
                (block_dist_km is null in geometric mode)
```

`horizon_mode`: `terrain` = 20 m near field + 160 m far field; `terrain_coarse` = 160 m DEM only (custom polar points away from the hosted 20 m tiles); `geometric` = smooth sphere, UI label "geometric horizon only".

`data_label` is `"SYNTHETIC"` in every fixture and mock response, `"REAL"` only for computed results. The UI shows a visible SYNTHETIC badge whenever it sees it.

## GET /health

Response 200:
```json
{"status": "ok", "app_version": "0.1.0", "contract_version": "1.0",
 "kernels_loaded": ["naif0012.tls", "de440s.bsp"], "dems_loaded": ["LDEM_80S_20MPP_ADJ.TIF"],
 "mock": false}
```

## GET /api/v1/sites

Purpose: F1 curated library. Used by: frontend. Implemented by: backend (`sites/sites.json`).

Response 200:
```text
{ sites: [ { site_id, name, group: "apollo"|"clps"|"commercial"|"international"|"artemis_candidate",
             lat_deg, lon_east_deg, terrain_coverage: boolean,
             source_url: string, source_note: string, verified: boolean } ] }
```
Only `verified: true` sites are shown in the UI by default.
Fixtures: `fixtures/sites.ok.json`, `sites.empty.json`, `sites.error.json`.

## POST /api/v1/compare

Purpose: F4–F6, F8–F14. Retry: safe (no side effects).

Request:
```text
{ mode: "site_vs_site" | "date_shift" | "free",
  scenarios: [ { id: "A"|"B", label: string (1-40 chars),
                 site: Site (site_id OR lat/lon required; if site_id given, lat/lon are ignored),
                 start_utc: ISO, mission_hours: number 1..8760 }, ... exactly 2 ],
  step_minutes: integer 1..60 = 10,
  observer_height_m: number 0..20 = 2,
  thresholds: Thresholds }
```

Response 200:
```text
{ contract_version: "1.0",
  scenarios: [ { id, label, site: Site, meta: Meta, skyline: Skyline,
                 series: { t_unix: int[N], sun_az: number[N], sun_el: number[N],
                           earth_az: number[N], earth_el: number[N],
                           sun_vis: (0|1)[N], earth_vis: (0|1)[N] },
                 windows: { sun: Window[], earth: Window[], both: Window[] },
                 metrics: Metrics, verdict: Verdict } x2 ],
  deltas: { <each numeric Metrics key>: number|null }      (A minus B),
  limitations: string[] }
```

Empty result (valid, not an error): a scenario where a body is never visible has `windows.sun = []`, `sun_hours = 0`, `sun_el_mean_up_deg = null`.
Errors: `INVALID_INPUT`, `NOT_FOUND`, `RANGE_TOO_LARGE`, `INTERNAL`.
Fixtures: `fixtures/compare.ok.json`, `compare.empty.json`, `compare.error.json`.

## POST /api/v1/sweep

Purpose: F7 best-date finder. Retry: safe.

Request:
```text
{ site: Site, range_start: ISO date (YYYY-MM-DD), range_end: ISO date,
  mission_hours: number 1..8760, observer_height_m: number = 2,
  thresholds: Thresholds }
```

Response 200:
```text
{ contract_version: "1.0", site: Site, meta: Meta (step_minutes = 30),
  days: [ { date: "YYYY-MM-DD", rank: int, refined: boolean,
            metrics: Metrics, verdict: Verdict } ]          (sorted by date),
  top: [ "YYYY-MM-DD", ... up to 5 ]                       (best first) }
```
Errors: `INVALID_INPUT`, `NOT_FOUND`, `RANGE_TOO_LARGE`.
Fixtures: `fixtures/sweep.ok.json`, `sweep.empty.json`, `sweep.error.json`.

## GET /api/v1/skyline?lat_deg=..&lon_east_deg=..&observer_height_m=2

Purpose: F9 (also used by panorama before a compare). Retry: safe.
Response 200: `{ site: Site, meta: Meta, skyline: Skyline }`
Errors: `INVALID_INPUT`, `NOT_IN_COVERAGE`.
Fixtures: `fixtures/skyline.ok.json`, `skyline.error.json`.

## GET /api/v1/terrain-tile?lat_deg=..&lon_east_deg=..&size_km=20

Purpose: F18 3D view. Retry: safe.
Response 200:
```text
{ site: Site, size_km: number, width: 256, height: 256,
  heights_m_b64: string (little-endian float32, row-major, north-up),
  min_m: number, max_m: number, site_px: [x, y], data_label }
```
Errors: `INVALID_INPUT`, `NOT_IN_COVERAGE`.
Fixtures: `fixtures/terrain-tile.ok.json`, `terrain-tile.error.json`.

## Not endpoints (handled elsewhere)

- Export: CSV/JSON built in the browser from the compare response; PDF = browser print of `/report`.
- Validation results: `validation/results/*.json` files committed by P6, imported by the methods page at build time.

## Changelog

- v1.0 (14 Nov 2026) initial.

## Approved next revision and clarifications (15 November 2026)

User-authorized P1 decisions: FRONTEND_UNBLOCK_DECISIONS.md. C04 aggregate 60,000
sample/request cap, endpoint inclusion/partial final step, and C07 mission-relative
scrubber mapping are approved v1.0 clarifications. The browser and Python verdict
comparisons share an absolute 1e-9 floating-point tolerance at pass/near boundaries.

C03 day step metadata, C05 sites label, C06 RATE_LIMITED/429, C08 tile grid-bearing
and provenance metadata, and C09 reference group are approved v1.1 targets described
in backend/docs/CONTRACT_PROPOSALS_C03_C09.md. This does not activate these additions
or change the current response version: owner implementation and consumer tests must
land together. Current terrain implementation is grid-up; do not interpret it as the
north-up text above before the v1.1 orientation correction lands. Exactly two scenarios
remain required; future multi-scenario work requires its own approved interface.
The build-time validation-file schema is defined separately in validation/README.md.
