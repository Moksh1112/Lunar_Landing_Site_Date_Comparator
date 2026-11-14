# Azelux frontend plan (P4 + P5)

## Context

The frontend owner (P4 + P5, branch `feat/p4-frontend-s0`) owns everything in `frontend/` and nothing else. The
scaffold is empty (`src/main.tsx` is `export {}`), the backend serves only `GET /health`, and the 15 fixtures in
`fixtures/` are SYNTHETIC. This plan describes the finished app and breaks the build into one-session tasks so the
whole Compare journey can be built on fixtures before any real backend exists.

This is a plan only: no application code or dependency has been added yet. Work stays inside `frontend/`; every
diff is reviewed with the human before commit.

Sources: `docs/CONTRACT.md` v1.0, `docs/CONTRACT_CHANGE_REQUESTS_S0.md` (C01–C09), `prompts/MASTER_PROMPT_P4.md`,
`prompts/MASTER_PROMPT_P5.md`, `fixtures/README.md`, PRD v2.0, TRD v1.0 (§7 frontend), Playbook v4.1.

### Decisions (fixed)

| Topic | Decision |
|---|---|
| Runtime | React 19.2.x (below 19.4), Vite 7.3.8 + `@vitejs/plugin-react` 5.2.0, Node 20.19+, TypeScript strict |
| Libraries | TanStack Query, Zustand, d3-scale + d3-shape, react-leaflet 5, three + @react-three/fiber 9 + drei 10 |
| Added tooling | zod (dev-time response validation), react-router (4 routes), vitest, eslint + prettier |
| Styling | Plain CSS: `theme/tokens.css` variables + CSS Modules. No UI kit |
| Mock mode | `VITE_USE_MOCK=true` serves `fixtures/*.json` in exact contract shape; SYNTHETIC banner + badges |
| Mock sites | In mock mode, `verified:false` fixture sites are listed with a SYNTHETIC tag. Real mode hides unverified |
| Deltas | API deltas are A minus B. UI negates for "B: −31 h" wording; `null` stays "n/a" |
| Scrub | Store keeps `alignBy` + a scrub position (`offsetS` or `tUnix`), not one absolute `scrubT` |
| Results | Each compare is stored as an immutable `{request, response}` snapshot; result views read only the snapshot |
| P6 pages | `/methods` and `/report` are route stubs only; real content is "owner TBD (P6)" |

React 19 differs from TRD §2.2 ("react 18") and `docs/SPEC_ALIGNMENT.md` L25. It is required by react-leaflet 5
and @react-three/fiber 9. P1 must record this as a deliberate override (see §5).

---

## 1. The finished app, screen by screen

Four routes plus two overlays. Every route sits inside one shell.

### 1.0 App shell (every route)

```
+----------------------------------------------------------------------------+
| SYNTHETIC DATA - mock transport, fixtures only, not a real result  [ok v]  |  <- only when synthetic
+----------------------------------------------------------------------------+
| Azelux    Compare | Best date | Methods | Report        [Simple | Expert]  |
+----------------------------------------------------------------------------+
|                               <route outlet>                               |
+----------------------------------------------------------------------------+
| Planning and education aid. Not a safety certification, power (watt)       |
| prediction or guaranteed radio link.                    app vX · contract 1.0 |
+----------------------------------------------------------------------------+
```

- **Synthetic banner**: shown when `VITE_USE_MOCK=true`, or `/health` returns `mock:true`, or any loaded result has
  `data_label:"SYNTHETIC"`. Never dismissible. In mock mode it carries a `[ok | empty | error]` selector that picks
  which fixture variant the mock transport serves (also settable by `?mock=error` or `?mock=compare:error,sites:empty`).
- **Simple / Expert** toggle writes `expert` in the store.
- **Error boundary** around the outlet: "Something went wrong" + Reload, nav stays usable.
- Unknown route: "Page not found" + link to Compare.

### 1.1 `/` Compare (home): inputs left, results right; stacked below 768 px

```
+--------------------------- inputs ---------------------------+------------------- results -------------------+
| Mode: [Site vs site] [Same site, shifted date] [Free]        |  A  Original plan      GREEN  meets all        |
| +-- Scenario A (teal) -----------------------------------+   |  B  Alternative site   AMBER  fails: sunlight %,|
| | Label [Original plan            ]                      |   |                               Earth %          |
| | Site  [search library v] SYNTHETIC  [Pick on map]      |   |  B: -31 h sunlight, +12 h Earth (vs A)         |
| | Lat [-85.5 ]  Lon [30.0 ] -> 30.0 E                    |   |  [SYNTHETIC] SPICE DE440 · terrain ·           |
| | Start (UTC) [2027-03-01 00:00]                         |   |  LDEM_80S_20MPP_ADJ · step 60 min · Methods    |
| | Mission [29.5] days  = 708 h                           |   | +-- Horizon panorama A -----------------------+|
| +--------------------------------------------------------+   | | +10°      ....sun====....   earth====        ||
| +-- Scenario B (violet) ---------------------------------+   | |  0° ▄▄▆▆▄▄▄▆▆▆▄▄▄ skyline (filled) ▄▄▆▆▄    ||
| | (same fields; locked fields show a lock + reason)      |   | | -2°  0     90     180     270     360 az     ||
| +--------------------------------------------------------+   | +-- Horizon panorama B (same y scale) --------+|
| Thresholds (collapsed): sun% >= 50  earth% >= 50            |   | (text summary under each chart)              |
|                         dark gap <= 48 h  blackout <= 72 h   |   | +-- Timeline (one time axis, UTC) ------------+|
| [ Compare ]                                                  |   | | A Sun ███░░███ | Earth ██░░██ | Both █░░█ ||
+--------------------------------------------------------------+   | | B Sun ██░░░░██ | Earth █░░░██ | Both ░░░█ ||
                                                                   | +---------------------------------------------+|
                                                                   | Metrics table: metric | A | B | B vs A        |
                                                                   | Limits: "Sunlight is not power; Earth in view  |
                                                                   |  is not a radio link." + response limitations  |
                                                                   +------------------------------------------------+
```

States of the results panel (F21):

| State | What shows |
|---|---|
| Idle (no snapshot) | "Set two scenarios and press Compare." (S3: starter comparison pre-loaded instead) |
| Loading | Skeleton chips, strip, two panorama blocks, timeline. Compare button disabled, label "Comparing…" |
| Error | Message from `error.message`, error code, `[Retry]`. Inputs kept. `details[].field` mapped to inline field errors |
| Success | As drawn above |
| Valid-empty (`compare.empty.json`) | B chip RED, "never visible" lanes drawn empty with the words "No sunlight window" / "No Earth window", metrics show 0 and "n/a" for null, delta "n/a" where null |
| Stale | Inputs edited after a result: chip "Inputs changed since this result" above results; results unchanged until Compare |
| Synthetic | SYNTHETIC badge inside SourceBadge of each scenario + global banner. Mock note: "fixed fixture, not computed from your inputs" |
| Geometric | Label "geometric horizon only" on that scenario's chip, panorama and SourceBadge; `terrain_coarse` shows "terrain (coarse)" |

Input states: site list loading (skeleton rows), empty ("No sites available. Enter coordinates."), error (message +
Retry, coordinates still usable). Inline validation mirrors the contract (lat −90..90 and not within 0.01° of a
pole, lon −180..360 converted to 0..<360 and shown, mission 1..8760 h, label 1–40 chars).

Simple vs Expert: Simple shows rounded hours/% and plain-word verdicts. Expert adds degrees to 0.01°, sample step,
kernels list, skyline hover readout (S2) and raw series table.

### 1.2 Map picker (modal from "Pick on map")

```
+-- Pick site for Scenario A ----------------------------- [x] --+
| [Global] [South pole]                                           |
|   o pins (curated; SYNTHETIC tag in mock)                       |
|   ( dashed circle at 80.7°S = terrain coverage )                |
|   + clicked point                                               |
| Lat -85.50  Lon 30.00 E   terrain coverage: yes   [Use site]    |
+-----------------------------------------------------------------+
```

States: background image missing → graticule-only map with note "Base image not loaded"; sites error → map still
clickable, no pins.

### 1.3 `/best-date` (S3)

```
| Site [..]  Range [2027-03-01] to [2027-03-14] (<=183 d)  Mission [708] h  Thresholds [..]  [ Find best dates ] |
| Calendar strip:  01 RED | 02 AMBER* | 03 GREEN* | 04 GREEN* | ...   (* = refined)                             |
| Ranked list:  1. 2027-03-04  GREEN  both 212 h  dark gap 31 h   [Load as B]                                   |
| [SYNTHETIC] SPICE DE440 · terrain · step 30 min                                                              |
```

States: idle; loading (indeterminate progress, "can take up to 15 s"); empty (`days:[]` → "No candidate days in
this range"); error (`RANGE_TOO_LARGE` shown next to the range field + Retry); synthetic badge.

### 1.4 3D drawer (S3, lazy, opened from a scenario result)

Right-side drawer: terrain plane lit from the Sun's az/el at the scrub time, Earth marker on a sky dome, vertical
exaggeration 1–3×, play/pause. States: loading skeleton; `NOT_IN_COVERAGE` → smooth-sphere patch + label "no
terrain tile here"; error + Retry; SYNTHETIC badge from the tile's `data_label`; reduced-motion → no auto-play.

### 1.5 `/methods` and `/report` (stubs)

Heading, one paragraph ("Content pending, owner TBD"), the limits list, link back. No invented validation numbers.

---

## 2. Folder structure and component tree

```
frontend/
  PLAN.md  index.html  vite.config.ts  tsconfig.json  eslint.config.js  .prettierrc.json  package.json
  src/
    main.tsx                 # mounts <App/>; path must stay /src/main.tsx (check-startup.mjs)
    vite-env.d.ts
    store.ts                 # single Zustand store
    app/        App.tsx  router.tsx  AppShell.tsx  ErrorBoundary.tsx  SyntheticBanner.tsx
                ExpertToggle.tsx  queryClient.ts  NotFound.tsx
    api/        types.ts  schemas.ts  errors.ts  transport.ts  httpTransport.ts  mockTransport.ts
                client.ts  hooks.ts  __tests__/
    theme/      tokens.css  global.css
    components/ Skeleton.tsx  EmptyState.tsx  ErrorState.tsx  SyntheticBadge.tsx
                HorizonModeLabel.tsx  Field.tsx
    lib/        lon.ts  time.ts  validate.ts  format.ts  deltas.ts  windows.ts
                panoramaGeometry.ts  projection.ts  verdict.ts(S3)  __tests__/
    features/
      compare/  ComparePage.tsx  ScenarioCard.tsx  SitePicker.tsx  ModePresets.tsx  ThresholdsPanel.tsx
                buildCompareRequest.ts  ResultsPanel.tsx  VerdictChips.tsx  DeltaStrip.tsx
                MetricsTable.tsx  SourceBadge.tsx  HorizonPanorama.tsx  TimelineLanes.tsx
      map/      MapPicker.tsx  MoonMap.tsx
      scrubber/ (S3)   bestdate/ (S3)   view3d/ (S3)
      methods/  MethodsPage.tsx (stub)     report/  ReportPage.tsx (stub)
```

`src/visualization/README.md` and the comment in `main.tsx` name old owners; both are removed in S0.

Component tree:

```
App (QueryClientProvider, RouterProvider)
└─ AppShell (SyntheticBanner, nav, ExpertToggle, footer disclaimer)
   └─ ErrorBoundary
      ├─ ComparePage
      │  ├─ ModePresets
      │  ├─ ScenarioCard ×2 ── SitePicker ── MapPicker (modal, lazy) ── MoonMap
      │  ├─ ThresholdsPanel
      │  └─ ResultsPanel (reads snapshot only)
      │     ├─ VerdictChips ── HorizonModeLabel
      │     ├─ DeltaStrip
      │     ├─ SourceBadge ×2 ── SyntheticBadge
      │     ├─ HorizonPanorama ×2
      │     ├─ TimelineLanes
      │     ├─ Scrubber (S3)   MetricsTable   View3dDrawer (S3, lazy)
      ├─ BestDatePage (S3)   MethodsPage   ReportPage   NotFound
```

Rule: data fetching only in `src/api/`. Components never import fixtures or call `fetch`.

---

## 3. Types, API client, mock transport, store

### 3.1 `api/types.ts` (mirrors `docs/CONTRACT.md` exactly; snake_case kept)

```ts
export type Site = { site_id: string | null; name: string | null; lat_deg: number; lon_east_deg: number };
export type Thresholds = { sun_pct_min: number; earth_pct_min: number; dark_gap_h_max: number; blackout_h_max: number };
export type HorizonMode = "terrain" | "terrain_coarse" | "geometric";
export type DataLabel = "REAL" | "SYNTHETIC";
export type Meta = {
  ephemeris: string; kernels: string[]; horizon_mode: HorizonMode; dem: string | null;
  step_minutes: number; observer_height_m: number; app_version: string; contract_version: "1.0";
  computed_at: string; data_label: DataLabel;
};
export type Window = { start: string; end: string; hours: number; start_censored: boolean; end_censored: boolean };
export type Metrics = {
  sun_el_max_deg: number; sun_el_mean_up_deg: number | null;
  sun_hours: number; sun_pct: number; earth_hours: number; earth_pct: number;
  both_hours: number; both_pct: number; longest_dark_h: number; longest_blackout_h: number;
};
export type MetricKey = keyof Metrics;
export type Verdict = { level: "green" | "amber" | "red"; failed: (keyof Thresholds)[] };
export type Skyline = { az_step_deg: 0.5; elev_deg: number[]; block_dist_km: number[] | null }; // 720 each
export type Bit = 0 | 1;
export type Series = {
  t_unix: number[]; sun_az: number[]; sun_el: number[]; earth_az: number[]; earth_el: number[];
  sun_vis: Bit[]; earth_vis: Bit[];
};
export type ScenarioId = "A" | "B";
export type CompareMode = "site_vs_site" | "date_shift" | "free";

export type Health = { status: "ok"; app_version: string; contract_version: "1.0";
  kernels_loaded: string[]; dems_loaded: string[]; mock: boolean };
export type SiteGroup = "apollo" | "clps" | "commercial" | "international" | "artemis_candidate";
export type LibrarySite = { site_id: string; name: string; group: SiteGroup; lat_deg: number; lon_east_deg: number;
  terrain_coverage: boolean; source_url: string; source_note: string; verified: boolean };
export type SitesResponse = { sites: LibrarySite[] };

export type ScenarioRequest = { id: ScenarioId; label: string; site: Site; start_utc: string; mission_hours: number };
export type CompareRequest = { mode: CompareMode; scenarios: [ScenarioRequest, ScenarioRequest];
  step_minutes: number; observer_height_m: number; thresholds: Thresholds };
export type ScenarioResult = { id: ScenarioId; label: string; site: Site; meta: Meta; skyline: Skyline;
  series: Series; windows: { sun: Window[]; earth: Window[]; both: Window[] }; metrics: Metrics; verdict: Verdict };
export type Deltas = Record<MetricKey, number | null>;                    // A minus B
export type CompareResponse = { contract_version: "1.0"; scenarios: [ScenarioResult, ScenarioResult];
  deltas: Deltas; limitations: string[] };

export type SweepRequest = { site: Site; range_start: string; range_end: string; mission_hours: number;
  observer_height_m: number; thresholds: Thresholds };
export type SweepDay = { date: string; rank: number; refined: boolean; metrics: Metrics; verdict: Verdict };
export type SweepResponse = { contract_version: "1.0"; site: Site; meta: Meta; days: SweepDay[]; top: string[] };
export type SkylineResponse = { site: Site; meta: Meta; skyline: Skyline };       // no contract_version
export type TerrainTileResponse = { site: Site; size_km: number; width: 256; height: 256; heights_m_b64: string;
  min_m: number; max_m: number; site_px: [number, number]; data_label: DataLabel };

export type ApiErrorCode = "INVALID_INPUT" | "NOT_FOUND" | "NOT_IN_COVERAGE" | "RANGE_TOO_LARGE"
  | "UPSTREAM_UNAVAILABLE" | "INTERNAL";
export type ApiErrorBody = { error: { code: ApiErrorCode; message: string; details: { field: string; reason: string }[] } };
```

`api/schemas.ts` holds one zod schema per response, each written `satisfies z.ZodType<T>` so types and schemas
cannot drift. Schemas run in dev and tests only; a mismatch logs `[contract mismatch] <endpoint>` and still
returns the data.

### 3.2 Client and transports

```
hooks.ts  ->  client.ts (one fn per endpoint)  ->  Transport  ->  httpTransport | mockTransport
```

- `transport.ts`: `type ApiRequest = { endpoint: "health"|"sites"|"compare"|"sweep"|"skyline"|"terrain-tile";
  method: "GET"|"POST"; path: string; query?: Record<string, number|string>; body?: unknown; timeoutMs: number }`
  and `interface Transport { send(req: ApiRequest): Promise<unknown> }`. Chosen once from `VITE_USE_MOCK`.
- `client.ts`: `getHealth`, `getSites`, `postCompare`, `postSweep`, `getSkyline`, `getTerrainTile`. Each builds the
  request, sends it, validates in dev, returns the typed value. Timeout 30 s.
- `errors.ts`: `class ApiError { code; message; details; status; origin: "api"|"client" }`. Contract error bodies
  map 1:1. Non-contract failures use client-only codes `NETWORK`, `TIMEOUT`, `BAD_RESPONSE` (never sent by the API).
- `httpTransport.ts`: `fetch(VITE_API_URL + path)`, `AbortController` timeout, non-2xx → parse `{error}` → `ApiError`.
- `mockTransport.ts`: lazy map from `import.meta.glob("../../../fixtures/*.json")`; resolves
  `<endpoint>.<variant>.json`; 300 ms delay; `*.error.json` is thrown as `ApiError` with status from the contract
  table (400/404/422/413/503/500). Variant comes from `?mock=` or the banner selector, default `ok`; a missing
  variant (e.g. `skyline.empty`) falls back to `ok`. The request body is ignored: fixtures are fixed, and the UI
  says so. Fixtures are read in place, never copied or edited.
- `vite.config.ts`: `server.fs.allow: [".."]` so dev can read `../fixtures`; the glob is behind the
  `VITE_USE_MOCK === "true"` branch so a real-mode build does not bundle fixtures.
- `hooks.ts`: `useHealth`, `useSites` (queries); `useCompare`, `useSweep` (mutations); `useSkyline`,
  `useTerrainTile` (queries keyed by params). `useCompare.onSuccess` writes the snapshot to the store.

### 3.3 `store.ts` (Zustand)

```ts
type SiteDraft = { site_id: string | null; name: string | null; latText: string; lonText: string }; // raw input kept
type ScenarioDraft = { id: ScenarioId; label: string; site: SiteDraft; startUtc: string; missionHours: number };
type Scrub =
  | { by: "mission_day"; offsetS: number }   // seconds after each scenario's own start
  | { by: "calendar"; tUnix: number };       // one absolute instant for both
type CompareSnapshot = Readonly<{ key: string; request: CompareRequest; response: CompareResponse;
  receivedAt: string; transport: "mock" | "api" }>;      // deep-frozen

type UiState = {
  mode: CompareMode;
  scenarios: [ScenarioDraft, ScenarioDraft];
  thresholds: Thresholds;                 // defaults 50 / 50 / 48 / 72
  stepMinutes: number;                    // default 10
  observerHeightM: number;                // default 2
  expert: boolean;
  alignBy: "calendar" | "mission_day";
  scrub: Scrub | null;                    // null = no marker
  snapshot: CompareSnapshot | null;
  // actions
  setMode(m): void; patchScenario(id, patch): void; setThresholds(p): void; setExpert(b): void;
  setAlignBy(a): void; setScrub(s): void; setSnapshot(s): void; loadAsB(site, startUtc): void;
};
// selectors
scrubTUnixFor(state, id): number | null   // offset → request.scenarios[id].start_utc + offsetS, clamped to series
isStale(state): boolean                   // buildCompareRequest(drafts) key !== snapshot.key
isSynthetic(state): boolean               // mock transport OR any scenario meta.data_label === "SYNTHETIC"
```

- Mode presets: `date_shift` keeps B.site = A.site; `site_vs_site` keeps B.startUtc = A.startUtc; `free` links
  nothing. `setMode` also sets the default `alignBy` (`date_shift` → `mission_day`, others → `calendar`).
- `setAlignBy` converts the current scrub using scenario A as anchor so the marker does not jump on A.
- Result components take the snapshot as input. They never read drafts, so a result always matches the request
  that produced it (this also gives exports and countdowns their request context, C07).

---

## 4. Task list

Each task is one session, about 1–3 files. Unless noted, every task ends with:

```
npm run check                      # tsc --noEmit via root
npm --prefix frontend run build    # tsc + vite build
```

and the browser check at `http://127.0.0.1:5173` (`npm run dev:all`, `VITE_USE_MOCK=true` in
`frontend/.env.local`). "LOCK" = needs a lockfile change through P1. One stage at a time; stop at each sync.

### Stage 0: foundation

| # | Files | Build | Fixture | Acceptance |
|---|---|---|---|---|
| [x] S0.1 LOCK | `package.json`, `package-lock.json` | Batch A, exact pins: `@vitejs/plugin-react` 5.2.0, `@tanstack/react-query`, `zustand`, `zod`, `react-router`, `d3-scale`, `d3-shape`, `@types/d3-scale`, `@types/d3-shape`, `vitest`, `eslint`, `typescript-eslint`, `eslint-plugin-react-hooks`, `prettier`. Add scripts `lint`, `test`, `format`. Send the version list to P1 before installing | none | `npm ci --prefix frontend` clean; both commands pass; CI frontend job green |
| [x] S0.2 | `vite.config.ts`, `src/vite-env.d.ts`, `tsconfig.json` | React plugin, `server.fs.allow`, typed `ImportMetaEnv` (`VITE_API_URL`, `VITE_USE_MOCK`), `resolveJsonModule`, `types: ["vite/client"]` | none | Both commands pass; dev server starts on 5173; page still serves `/src/main.tsx` (`npm run check:startup`) |
| [x] S0.3 | `theme/tokens.css`, `theme/global.css` | Dark theme tokens: Sun amber, Earth blue, A teal, B violet, verdict green/amber/red, neutrals, 8 px spacing, type scale, radius, focus ring. Contrast ≥ 4.5:1. Reset + base typography | none | Imported in S0.8; body is dark, text readable; contrast of each text/background pair checked and listed in the PR |
| [x] S0.4 | `api/types.ts`, `api/schemas.ts` | §3.1 exactly, plus zod schemas with `satisfies` | all | Both commands pass (schemas type-check against types) |
| [x] S0.5 | `api/errors.ts`, `api/transport.ts`, `api/httpTransport.ts` | `ApiError`, `Transport`, fetch transport with timeout and error normalisation | none | Both commands pass |
| [x] S0.6 | `api/mockTransport.ts`, `api/client.ts` | Fixture registry, variant selection, 300 ms delay, error fixtures thrown with contract status; six client functions | all 15 | Both commands pass; temporary console call in dev shows `getSites()` returning 3 sites |
| S0.7 | `api/__tests__/fixtures.test.ts`, `api/__tests__/mockTransport.test.ts` | Every ok/empty fixture parses with its schema; every error fixture becomes `ApiError` with the right code and status | all 15 | `npm --prefix frontend test -- --run` passes; a deliberately renamed field makes it fail (then revert) |
| S0.8 | `main.tsx`, `app/App.tsx`, `app/router.tsx`, `app/queryClient.ts` | Mount, QueryClient (no retry on 4xx), routes `/`, `/best-date`, `/methods`, `/report`, `*` with placeholder pages | none | All four URLs render a heading; unknown URL shows Not found; zero console errors |
| S0.9 | `app/AppShell.tsx`, `app/SyntheticBanner.tsx`, `app/ExpertToggle.tsx` + minimal `store.ts` (`expert` only) | Nav, footer disclaimer, banner driven by `VITE_USE_MOCK` and `useHealth().mock`, variant selector writing `?mock=` | `health.ok`, `health.error` | Banner visible in mock mode on every route; with `VITE_USE_MOCK=false` and no backend, banner absent and a small "API unreachable" notice shows; toggle flips label |
| S0.10 | `app/ErrorBoundary.tsx`, `components/Skeleton.tsx`, `EmptyState.tsx`, `ErrorState.tsx` | Boundary with reload; three shared async-state components (ErrorState takes `ApiError` + `onRetry`) | `sites.error` | A throwing test route shows the boundary with nav intact; ErrorState renders code, message, Retry |
| S0.11 | `components/SyntheticBadge.tsx`, `HorizonModeLabel.tsx`, `features/methods/MethodsPage.tsx`, `features/report/ReportPage.tsx` | Badge, the three horizon labels ("terrain", "terrain (coarse)", "geometric horizon only"), stub pages | none | Stub pages show limits and "owner TBD"; no invented data |
| S0.12 | `eslint.config.js`, `.prettierrc.json`; delete `src/visualization/README.md` | Lint rules (hooks, no `dangerouslySetInnerHTML`, no `fetch` outside `src/api/`), format | none | `npm --prefix frontend run lint` clean; both commands pass. Then print the S0 Stage Report and stop for Sync 0 |

### Stage 1: Compare journey on fixtures

| # | Files | Build | Fixture | Acceptance |
|---|---|---|---|---|
| S1.1 | `store.ts`, `lib/__tests__/store.test.ts` | Full §3.3 store, presets, `setAlignBy` conversion, selectors | none | Tests: `date_shift` copies A.site to B and keeps it linked; `site_vs_site` links start; snapshot is frozen |
| S1.2 | `lib/lon.ts`, `lib/time.ts`, `lib/validate.ts` + tests | −180..180 → 0..<360; days↔hours (708 h default); UTC parse/format; field validators mirroring the contract, including the pole rule and sample count N = hours·60/step + 1 per scenario | `compare.error` (message wording) | Tests cover −180, 0, 359.99, 360, ±90, ±89.995, 0 and 8761 h |
| S1.3 | `api/hooks.ts` | Six hooks; `useCompare` stores the frozen snapshot | `sites.*`, `compare.*` | Both commands pass |
| S1.4 | `features/compare/SitePicker.tsx`, `components/Field.tsx` | Searchable list grouped by `group`, source link per site, loading/empty/error states, mock rows tagged SYNTHETIC, real mode hides `verified:false` | `sites.ok/empty/error` | `?mock=ok`: 3 tagged sites; `?mock=sites:empty`: empty message; `?mock=sites:error`: error + Retry; keyboard selectable |
| S1.5 | `features/compare/ScenarioCard.tsx` | Label, SitePicker, lat/lon with converted value shown, UTC start, mission days/hours, inline validation, locked fields per mode | `sites.ok` | Typing lon −150 shows "210.0 E"; lat 95 shows the error and keeps the text; picking a site fills lat/lon |
| S1.6 | `features/compare/ModePresets.tsx`, `ThresholdsPanel.tsx` | Three mode buttons; four numeric thresholds with defaults and reset | none | Switching to "Same site, shifted date" locks B's site with a reason; thresholds editable by keyboard |
| S1.7 | `features/compare/buildCompareRequest.ts` + test, `ComparePage.tsx` | Drafts → `CompareRequest` (or field errors); two-column layout; Compare button disabled while pending or invalid; no double submit | `compare.ok` | Clicking Compare twice sends one request (network/console count); request object matches the contract shape in the test |
| S1.8 | `features/compare/ResultsPanel.tsx` | Idle / loading / error / success / stale switch; maps `details[].field` to card fields | `compare.ok/error` | `?mock=compare:error`: message, Retry, B latitude field flagged, inputs kept; editing an input after success shows the stale chip |
| S1.9 | `features/compare/VerdictChips.tsx`, `SourceBadge.tsx` | Chip = colour + word + failed thresholds in words; badge = ephemeris, horizon label, DEM, step, SYNTHETIC badge, Methods link | `compare.ok`, `compare.empty` | ok: A GREEN, B AMBER "fails: sunlight %, Earth %"; empty: B RED with "geometric horizon only"; SYNTHETIC on both |
| S1.10 | `lib/deltas.ts`, `lib/format.ts` + tests, `features/compare/DeltaStrip.tsx` | `bVsA = -delta`, null → "n/a", signed with units, true minus sign | `compare.ok`, `compare.empty` | Test: for every key, shown value equals B − A from the fixture metrics; strip reads "B: … h sunlight, … h Earth" |
| S1.11 | `features/compare/MetricsTable.tsx` | 10 rows × A / B / B vs A, units in every cell, Simple rounding vs Expert precision, step shown in Expert | `compare.ok`, `compare.empty` | empty: `sun_el_mean_up_deg` shows "n/a" for B and in the delta column; integer `0` hours render "0.0 h" |
| S1.12 | `lib/panoramaGeometry.ts`, `lib/windows.ts` + tests | Skyline polygon points; Sun/Earth paths split into visible/hidden runs from `*_vis`; break lines at the 360→0 wrap; shared y-domain (at least −2..+10°, auto-expand) | `compare.ok` | Tests: no segment spans more than 180° of azimuth; run counts match transitions in `sun_vis` |
| S1.13 | `features/compare/HorizonPanorama.tsx` | SVG + d3-scale: filled skyline, dotted hidden / solid visible paths, axes with units, one panel per scenario with the same y scale, text summary below | `compare.ok`, `compare.empty` | Two panels; Sun amber, Earth blue; empty B shows flat geometric skyline with label; readable at 375 px wide |
| S1.14 | `features/compare/TimelineLanes.tsx` | Sun / Earth / Both lanes for A and B on one UTC axis from `windows`; censored edges drawn open-ended; empty lanes carry words; text summary | `compare.ok`, `compare.empty` | Bars line up with window start/end from the fixture (spot-check 2 windows by hover title); censored start has no cap |
| S1.15 LOCK | `package.json`, lockfile, `lib/projection.ts` + test | Batch B: `leaflet`, `react-leaflet` 5, `@types/leaflet`. Equirectangular and south-polar-stereographic forward/inverse (R = 1,737,400 m). Axis sign marked TO VERIFY with P3 | none | Round-trip tests within 1e-6°; pole maps to origin |
| S1.16 | `features/map/MoonMap.tsx`, `MapPicker.tsx` | Leaflet `CRS.Simple`, Global / South pole views on a graticule (no base image yet), pins, 80.7°S circle, click → lat/lon → "Use site" | `sites.ok` | Clicking the map fills the scenario's lat/lon; pins tagged SYNTHETIC; modal closes on Esc and returns focus |
| S1.17 | touch-ups only | Full journey pass at 1280 and 375 px, keyboard-only pass, console clean in all `?mock=` variants | all compare/sites | Journey: load → edit A/B → Compare → chips, strip, panoramas, timeline, table; **zero console errors**. Print the S1 Stage Report and stop for Sync 1 |

### Stage 2: real API (outline)

1. Switch `VITE_USE_MOCK=false`; needs backend CORS for `http://127.0.0.1:5173` (P2) or a dev proxy. Confirm
   `data_label:"REAL"` in the network tab and that the SYNTHETIC banner disappears.
2. Request-hash cache for compare; friendly handling of timeouts, 413 and rate-limit responses.
3. Panorama markers at the scrub time; Expert hover readout of skyline elevation and blocker distance.
4. Timeline difference lane; `alignBy` toggle (calendar vs mission day); click sets scrub.
5. Map backgrounds: P3's south-pole hillshade and a global image (source and licence to confirm); verify the
   projection sign against one known feature.
6. Client-side pre-check of the sample cap once P2 defines it (C04).

### Stage 3: complete MVP (outline)

1. `lib/verdict.ts`: local verdict recompute on threshold change (TRD §5.3) + vitest against
   `backend/tests/data/verdict_cases.json` (from P2).
2. Countdown to next sunset / Earthset from windows + scrub time, on each scenario result.
3. `features/scrubber/`: slider over the mission range, play/pause, arrow keys, UTC readout, reduced motion.
4. `features/bestdate/`: form, `useSweep`, calendar strip, ranked list, "Load as B". Fixtures `sweep.ok/empty/error`.
5. LOCK Batch C (`three`, `@react-three/fiber` 9, `@react-three/drei` 10, `@types/three`) + `features/view3d/`:
   lazy drawer, float32 decode, exaggeration slider, Sun light, sphere fallback. Fixtures `terrain-tile.ok/error`.
   Apply the 3D gates (over 3 s first render → click-only; not working → hidden).
6. Starter comparison pre-loaded on first visit (needs two verified pole sites from the real library).
7. Responsive 375/768/1280, keyboard, contrast, chart text summaries, Lighthouse ≥ 90 on `/`.
8. `/methods`, `/report`, CSV/JSON export: owner TBD (P6). Stubs stay until assigned.

---

## 5. Coordination needed

### Lockfile / dependency changes (through P1)

| Task | Change |
|---|---|
| S0.1 | Batch A: build plugin, query, store, zod, router, d3, vitest, eslint, prettier; new `lint`/`test` scripts (CI picks them up automatically) |
| S1.15 | Batch B: leaflet, react-leaflet 5, types |
| S3 item 5 | Batch C: three, fiber 9, drei 10, types |
| Any time | P1 to record "React 19.2.x stays (required by react-leaflet 5 and fiber 9)" in `docs/SPEC_ALIGNMENT.md` |

### Other inputs from owners

| From | Needed for | Item |
|---|---|---|
| P2 | S2 item 1 | CORS origin `http://127.0.0.1:5173` (or agree a dev proxy) |
| P2 | S3 item 1 | `backend/tests/data/verdict_cases.json` (8 cases) |
| P3 | S2 item 5 | 2048 px south-pole hillshade PNG + projection axis sign |
| P1 | S3 item 6 | Verified sites in the real library (fixtures are all `verified:false`) |
| Coordinator | S3 item 8 | Owner for methods / report / export |

### Contract change requests (to P2 via the Coordinator; none block S0 or S1)

| Affects | Request |
|---|---|
| S1.8 | Error `field` path: contract example says `scenarios[1].lat_deg`, fixture says `scenarios[1].site.lat_deg`. Fix one. UI will map the fixture form |
| S0.9, S1.4 | C05/C09: add `data_label` to `/sites` and `/health` responses, or confirm `mock:true` + client labelling is the rule |
| S1.2, S2 item 6 | C04: define the sample cap and rounding of N (default 10 min × 8760 h × 2 exceeds 60,000) |
| S1.6 | C06: threshold ranges; error code for rate limit and timeout; list `INTERNAL` for every endpoint |
| S2 item 4 | C07: confirm the scrub model in §3.3 (offset in mission-day alignment, absolute instant in calendar alignment) |
| S1.9 | C08: confirm the `terrain_coarse` UI label "terrain (coarse)" and terrain-tile extents |
| S3 item 4 | C03: effective `step_minutes` for refined sweep days; meaning of an empty sweep |
| S1.10 | Confirm deltas stay A minus B at 0.1 precision (the UI negates for "B:" wording) |
