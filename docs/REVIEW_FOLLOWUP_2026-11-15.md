# Review follow-up - 15 November 2026

Revision: the commit containing this report, based on `6d334c4`; remote source
`b76ab21` is already integrated. The user requested all pending work in one commit
and authorized pushing this branch. No deployment or acceptance authorization.

## Findings verified against current code

- **Height scaling:** release instructions now require unchanged camera position,
  rotation, zoom and pan. Height-only changes no longer refit the camera. Reset view,
  tile changes and viewport-aspect changes still reframe separately.
- **Stale comparison:** no code change needed. `useCompare` only calls `postCompare`;
  ComparePage captures `planBRevision` before submitting and passes it to
  `showNewCompare`, which rejects an obsolete revision. There is no additional
  unguarded completion-time `setLastCompare` write. Existing store tests and the
  controlled delayed browser request pass after `loadAsB`.
- **Clipping:** fitted controls now set the camera far plane beyond maximum zoom,
  with terrain/marker and current target-offset margin, then refresh its projection.
  Browser regression reaches distance **38.8332**, beyond the old fixed far=30,
  with far **45.0250**; the projection matrix matches the updated value.
- **Node 20:** `npm run check:ui` supplies `--experimental-websocket`. Callers need
  no extra flags or dependency. Plain script execution without WebSocket fails
  before launching Chrome and names the supported command.
- Includes the pending judge-facing README overview, sources, validation status,
  setup/checks, future scope, roles and notices. Runtime thresholds/data are unchanged.

## Validation

- `npm --prefix frontend run test -- --run`: **201 passed, 29 files**.
- `npm --prefix frontend run lint`: **PASS**.
- `npm --prefix frontend run build`: strict typecheck and production build **PASS**.
  Existing large Three.js chunk and Zod annotation warnings remain.
- `npx --yes --package=node@20.19.0 -c "npm run check:ui"`: **11 scoped checks PASS**
  in isolated Chrome 157; no uncaught exceptions. Includes viewport refit, unchanged
  height transforms, maximum zoom clipping, stale-result protection, retry limits,
  timeline units, simulator Escape, briefing provenance and twelve landing switches.
  [Browser evidence](evidence/REVIEW_FOLLOWUP_2026-11-15.json).
- `/health`: `mock=false`, contract 1.1, five kernels, one far DEM and three near
  tiles. Actual comparison responses in this browser run: **REAL / terrain_coarse**
  for both plans. This run does not claim near+far acceptance or independent validation.
- Script syntax, README relative links and `git diff --check`: **PASS**.

Backend code/data did not change; the full backend suite was not repeated. Hosted
CI must be checked for the exact pushed SHA. Physical devices, spoken screen reader,
alternate browser engine, slow GPU and two independent usability sessions remain
pending. V4 remains FAIL; V4b and owner-reviewed V6 retain their existing scope.
AI coding assistance was used for these scoped fixes and documentation.
