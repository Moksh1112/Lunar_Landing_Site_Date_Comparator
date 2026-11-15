# Non-release engineering takeover — 15 November 2026

## Latest acceptance update — 15 November 2026

Backend 7d6ac55 and frontend 016f01d integrated. Read
[ACCEPTANCE_2026-11-15.md](ACCEPTANCE_2026-11-15.md) for exact evidence and limits.
V6 is an explicitly reviewed P2-owner qualitative spot-check PASS; V4 remains FAIL,
with the confirmed reference disc-rule mismatch documented separately. Actual real
CSV/JSON downloads and five-page native print preview were checked. CSV now includes
all skyline rows and the complete request. All four routes passed responsive bounds
and sampled accessible-name checks; keyboard skip/glossary/scrubber checks passed.
Backend 551 passed / 6 skipped; combined frontend 131 tests, lint/typecheck/build pass.
Physical-device, other-browser, screen-reader and two-person usability checks remain
unverified. Concurrent unpublished landing/package/router work was preserved.
Earlier pending V6/export/print entries below are historical, superseded here.


## Active resumed engineering — 15 November 2026

The user resumed full-stack work. Earlier stopped/unmerged descriptions below are
historical. Backend 79936a5 and frontend fd7bf03 plus 8bd7dd4 are integrated.
Current evidence and the F1–F25 acceptance checklist: docs/MVP_VERIFICATION.md.
The ten-site API discrepancy was stale process cache and resolved by safe restart.
Real Best Date -> Plan B -> Compare works with sourced 20 m terrain. The previous
result ambiguity after input edits is fixed and browser-verified. Frontend now has
129 passing tests; lint/build pass. Owner CI 43686142434 SUCCESS. Current 3D first
frame measured 1000 ms on this host. V4 FAIL / V6 pending remain open. Deployment
and release remain with the user; no MVP/RC/final gate has been declared passed.


## Current stop checkpoint

The user stopped pending implementation. Read [TAKEOVER_CURRENT.md](TAKEOVER_CURRENT.md)
first: frontend fd7bf03 is pushed but not integrated; browser verification remains
open. Earlier verification below applies only to the revisions stated.

## Authority and branch discipline

The user temporarily assigned all engineering roles to this agent. Release and
deployment remain with the user. Work is published on the three existing branches:
P1 integration, P2/P3 backend, P4/P5 frontend. Do not reset or force-push owner work.
Fetch and merge integration into your clean owner worktree before resuming.

## Ready capabilities

- Real SPICE Sun/Earth comparisons; geometric, coarse and 20 m near-field terrain.
- Ten source-verified library entries: three CLPS points, six Apollo LM sites and
  LCROSS impact (explicitly not a landing site). Artemis region centres remain
  unverified rather than inferred from maps.
- 80 m NASA source verified against the earlier complete-file hash, derived 160 m far
  DEM and 2048 px hillshade. Two real 50 km near-field COG crops for the IM-2 sites.
- Sourced polar map with verified projection signs; whole-Moon NASA SVS context.
  SVS is visualization imagery, not science input. Both image families carry credit.
- On-demand terrain 3D, exaggeration, Sun/Earth markers and shared playback. Markers
  have schematic distances and brightness is illustrative. Initial first frame measured
  569 ms on this host, below the 3-second gate. 2D remains the fallback.
- Versioned validation display. V1/V2 pass; V3/V5 mathematical checks pass. Actual
  failed and incomplete checks are displayed, not hidden.
- Coordinated v1.1 additions: rate-limit parsing, manifest hashes in exports, refined
  sweep step metadata, terrain source/resolution/grid bearing; v1.0 fixtures supported.

## Start locally

From an updated integration checkout:

    npm run setup
    npm run hooks

On this managed Windows host, first set AZX_PYTHON_MODE=target. For real mode:

    $env:AZX_USE_MOCK='false'
    $env:VITE_USE_MOCK='false'
    $env:VITE_API_URL='http://127.0.0.1:8000'
    $env:AZX_DATA_DIR='C:/azx/data'
    npm run dev:all

Frontend 5173; backend 8000. To run synthetic examples explicitly: npm run dev:s0.
Do not change OS security settings. Keep all raw/derived data outside cloud sync and
Git. A local background preview may already be running; work/server-state.json
records its PID and mode. Stop only a process whose command line you have verified.

## Reproduce local datasets

    node scripts/python.mjs scripts/download_kernels.py --data-dir C:/azx/data
    node scripts/python.mjs scripts/download_dems.py --data-dir C:/azx/data --skip-20m --pgda69
    node scripts/python.mjs scripts/prepare_dems.py --data-dir C:/azx/data --far --hillshade
    node scripts/python.mjs scripts/prepare_remote_tiles.py --data-dir C:/azx/data
    node scripts/python.mjs scripts/download_basemap.py --data-dir C:/azx/data

For the V4 resolution diagnostic only:

    node scripts/python.mjs scripts/prepare_remote_tiles.py --data-dir C:/azx/data --point=-88,90

NASA 20 m source is a COG: required crop windows are read by HTTP ranges, avoiding a
2.7 GB full download. Crop hashes are recorded. The full upstream 20 m file checksum
was NOT verified; manifests explicitly state this. Remote-source dimensions/CRS/pixel
scale are checked. Snapshot: docs/evidence/LOCAL_DATA_MANIFEST_2026-11-15.json. It is review
material, not runtime configuration. Derived hashes can differ across GDAL versions.
The downloader stops after two transfer attempts and keeps resumable partial files.

## Verification performed

- Full local backend suite after contract changes: 547 passed, 6 skipped. Later
  image-route tests passed separately. Do not count skips as scientific validation.
- Frontend: 126 tests, lint, strict TypeScript and production build passed. All 15 fixtures and startup/shutdown checks also passed.
- V1: 3 mathematical positions x 48 hourly epochs x Sun/Earth against live Horizons;
  576 angle rows, maximum difference about 0.00000236 degrees. V2: exact latitude and
  east-longitude header agreement. Raw headers preserve tiny altitude roundoff.
- V3: 11 executed geometry tests. V5: 31 executed windows/metrics/verdict tests.
  These test synthetic inputs and are labelled SYNTHETIC in Methods.
- Real polar pair on March 15 2027, 240 h: terrain (20 m + 160 m), Sun 240 h both,
  Earth 203.7/203.6 h. Stored locally in ignored work/p1-polar-terrain-*.json.
- Browser: no synthetic banner in real mode; sourced hillshade loaded (2048x2048),
  3D first frame 569 ms and playback moves the shared timeline/readout.

## Open blockers — do not claim completion

V4 FAIL: 5 polar test positions, 18.6-year daily SPICE sample versus PGDA 69. At
(-88, 90 E), sunlight differs by about 6.30 percentage points (target <=5). A 20 m
near-field crop did not resolve it; investigation stopped after two attempts. Keep
both the coarse baseline and final result. Do not choose different points or loosen
tolerance to manufacture a pass. Investigate reference epoch, disc semantics, DEM
model and sampling with scientific review before accepting this gate.

V6 INCOMPLETE: polar numeric diagnostics exist, but the PRD criterion is qualitative;
no numerical threshold or human acceptance is invented.

All validation is team-produced/owner-reported; no external certification. Human
visual acceptance, two-person usability checks and cross-device performance remain
unverified. No deployment, MVP/RC/final tag, release or submission was performed.

Main bundle still triggers Vite's >500 kB advisory; 3D is a separate on-demand chunk.
The measured 3D gate is one host, not a guarantee for every device. Release must
retain the 2D fallback and account for scientific blockers above.

Final export check: a stacking correction puts the Export menu above animated
results. P1 clicked the actual Download JSON control and opened
azelux-compare-real-202611142226.json: contract 1.1, REAL label and the actual server
manifest hash retained. The earlier automation timeout is superseded by this check.
