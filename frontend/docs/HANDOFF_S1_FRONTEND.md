# Frontend S1 handoff: Compare journey (acting frontend owner)

| Item | Value |
| --- | --- |
| Branch | `feat/p4-frontend-s0`, fast-forwarded to P1 integration `be5001c`. It had no unique commits, so nothing of the previous owner was lost. The work below is on top. Commit SHA: see the commit that adds this file. |
| Data | **All results are SYNTHETIC** (mock transport, `VITE_USE_MOCK=true`, fixtures). Real-mode integration is not authorized yet and was not used. |
| Gate | Owner S1 frontend work is **complete for the scope below**. Sync 0/1 remain for P1/Coordinator. |

## Implemented

All work is in `frontend/src/features/compare/` unless noted.

- `/` route is now **ComparePage** (`app/router.tsx`). The other three routes are kept
  unchanged.
- **Inputs:**
  - `ScenarioCard.tsx` × 2: a library site picker from `getSites`. Verified sites only by
    default; a labelled "Show unverified (SYNTHETIC) sites" option shows the rest.
    Custom latitude and longitude (-180..180 is converted to 0..360 and the converted
    value shown), UTC start, and mission hours (default 708 = one lunar day).
  - `ModePresets.tsx`: site_vs_site links B's date to A's; date_shift links B's site to
    A's. Linked fields are disabled, with a hint.
  - `ThresholdsPanel.tsx`: thresholds 50 / 50 / 48 / 72.
  - A pre-loaded starter example: two south-pole points on the same date.
- **Validation** (`compareForm.ts`), mirroring the backend:
  - `|lat| <= 89.99`; lon in [0, 360).
  - `YYYY-MM-DDTHH:MM:SSZ` between 1900 and 2149, with the mission ending by 2149-12-31.
  - 1–8,760 h.
  - **At most 60,000 samples per request**, summed over A + B.
  - Server `details[].field` errors appear inline next to the matching input.
- **Compare action** (`useCompare.ts`): a TanStack mutation. The button is disabled while
  pending (no double submit); inputs are kept on error; Retry resubmits the same
  request.
- **States:** empty (before the first compare), loading (skeletons), error (message, code,
  Retry, inline field errors), and success.
- **Results:**
  - `ResultsSummary.tsx`: verdict chips (word + colour) with the failed thresholds in
    words.
  - **DeltaStrip "B vs A"**: displays −(A−B delta).
  - MetricsTable: columns A, B and **A − B** (the raw contract delta); Expert mode adds
    run details.
  - SourceBadge: ephemeris, **horizon mode, including "geometric horizon only"**, DEM or
    "no DEM", step, and a **SYNTHETIC badge**.
  - Limits list.
- **Charts:**
  - `HorizonPanorama.tsx`: one per scenario, on a shared y range. Filled skyline; Sun and
    Earth paths solid when visible and dotted when not, broken at the 360°→0° wrap;
    scrub markers; figcaption text summary.
  - `TimelineLanes.tsx`: A/B Sun, Earth and Both lanes plus a Difference lane;
    calendar or mission-day alignment; native range scrubber; text summary.
- **Store** (`store.ts`): mode, scenarios, thresholds, `scrubT`, `alignBy`. The existing
  `expert` flag is unchanged.

## Preserved

The shell, typed client and schemas, mock/HTTP transports, error boundary, SyntheticBanner
and variant selector, ExpertToggle, theme tokens, and the Methods and Report stubs. Their
existing tests still pass. No `src/api/*`, fixture, root, CI or lockfile changes.

## Commands run (worktree `frontend/`) and actual results

| Command | Result |
| --- | --- |
| `npm ci` | 222 packages |
| `npm run lint` | clean |
| `npx tsc --noEmit` | clean |
| `npx vitest run` | **5 files, 50 tests passed** (existing api tests + compareForm + charts + format) |
| `VITE_USE_MOCK=true npm run build` | built in 2.31 s |
| `npm audit` | 7 moderate (one advisory, dev-only) |
| `npm audit --omit=dev` | **0** |

Audit detail and the proposed targeted fix are in `frontend/docs/FRONTEND_POSITIONS_S1.md`.
`npm audit fix --force` was **not** run.

## Browser checks

Built-in browser, mock mode, dev server on port 5175 (this host's ports 5173/8000 were
held by another dev server).

| Check | Result |
| --- | --- |
| `/` → Compare with fixture `ok` | Verdicts "Original plan: GREEN", "Alternative site: AMBER"; delta strip "B vs A: −15.8 h sunlight, −17.0 h Earth, −25.0 h both, +13.3 h longest dark gap, +13.8 h longest blackout"; 2 panoramas + timeline; metrics table; SYNTHETIC visible |
| `?mock=compare:empty` | "geometric horizon only" and "no DEM" shown; Far side B: RED; nulls shown as "n/a" |
| `?mock=compare:error` | Error message + `INVALID_INPUT` + Retry; inline field error next to the latitude input; inputs kept |
| Viewports | 375×812: no horizontal scroll. 768×1024: no horizontal scroll. Desktop: OK |
| Keyboard | Compare button reachable, visible focus ring (solid outline); **Enter submits** and renders results |
| Routes | `/`, `/best-date` (placeholder, unchanged), `/methods`, `/report` all render |

## Not done (honest list)

- No component-render tests: the repo has no testing-library or jsdom, and adding them
  is a dependency change for P1. Behaviour was checked in the browser instead (above).
- The UI has no controls for the step (fixed at 10 min) or observer height (fixed at
  2 m).
- Best-date page (F7 UI), 2D map (F3), 3D (F18), real-mode display, and exports remain
  gated or later-stage work. They were not claimed.
- The integrated `npm run dev:s0` was not run: ports 5173/8000 are held on this host by a
  process started at 11:50 that I did not start.

## Decisions requested

See `frontend/docs/FRONTEND_POSITIONS_S1.md`:

- **React 19.2: keep it** (recommended).
- Audit override (lockfile, P1).
- C03–C09 positions.
- No contract gaps block this journey.
