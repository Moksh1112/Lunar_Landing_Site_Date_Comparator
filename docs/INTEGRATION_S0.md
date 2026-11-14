# User-authorized combined integration - S0
Sources: integration 60e3830 + backend d5c137b + frontend 0cd0ae5.
Both owner branches merged conflict-free in detached checkout, no fourth branch.
P1 imported owner product code unchanged; only root setup/status files adjusted.

## Checked locally on the combined tree
- Target-mode npm setup: PASS canonical backend uv.lock + frontend package-lock.
- Frontend check/lint/build: PASS; 27 unit tests PASS.
- npm run check:fixtures: PASS all 15 synthetic fixtures.
- npm run check:setup: PASS syntax for 32 backend application files and root JS.
- Ruff backend --no-cache: PASS.
- Backend local subset: 456 passed, 36 skipped. Four files explicitly excluded
  because this host blocks pyproj native DLL imports: test_illumination.py,
  test_raster.py, test_terrain_edges.py and test_terrain_real.py.
  This is NOT a full local-suite pass. Real-data tests skipped without datasets.
- Mock dual-module startup/shutdown: PASS. Added dev:s0 and startup checker now
  forces both mock transports for S0 reproducibility. No science data downloaded.
- Before combination, full Linux backend owner CI was green; combined full Linux
  CI is required on promoted revision and is reported by exact commit/run.

## How to run this integrated S0 shell
npm run setup (on managed Windows set AZX_PYTHON_MODE=target first).
npm run dev:s0 forces frontend/backend SYNTHETIC modes; no local DEM/kernels needed.
Compare/best-date remain placeholders, methods/report remain stubs. This is not
an S1 fixture comparison journey, real demo, deployed product or accepted Sync 0.

## Open acceptance issues (not silently approved by merge authorization)
TRD 60000/request vs backend 60000/scenario; pending cap/schema/error/tile/provenance
changes; React 19 vs TRD React 18; seven moderate dev audit findings (production
only audit was clean); missing full manifests/independent V1-V6 and helper assignment.
Later-stage backend code is present from owner branch but its stage reports do not
advance team gates. Real-mode behavior/data correctness not independently accepted.
No main changes, extra remote branch, sync tag or deployment.


## Published result
Code integration 315d22a pushed. GitHub run 43617959513 completed SUCCESS: backend,
frontend, fixtures, attribution, secrets and venv/target startup jobs all passed.
Actual root target setup and mock HTTP startup/shutdown also passed. Git ancestry
and byte-for-byte owner-source comparison passed. Local subset is not full local
suite, and hosted data-dependent skips do not certify real-source validation.
Remain S0 OPEN; no tag or deployment. Subsequent status-doc commit CI is separate.

## 15 November 2026 map/evidence integration

Frontend dbd4349 is green and imported. Backend 8cc3948 failed Ruff on an unused
noqa; isolated P1 correction d0f81b6 passed all seven hosted jobs (43636257071)
before integration. P1 corrected evidence producer revision to the current source
0856c14 and added the required --generated-at argument to the recorded command.

Independent local checks: frontend lint, 114 tests, TypeScript/build; adapter Ruff,
4 tests using normal conftest, full artifact schema validation, source hash and
adapter reproduction equality. Full science tests remain unverified on this host.
The adapter only reformats the owner's evidence; it does not independently reproduce
SPICE/Horizons science. Print-page image inspection is distinct from interactive
print-preview verification. Owner's next work is visual refinement and real basemap
assets; no 3D or stage gate is inferred.

Preview check: P1 restarted only the recorded dev launcher to refresh Vite's glob
cache. Methods now visibly shows PASS / Spot check / Owner-reported / REAL inputs,
plus the explicit not-full-V1 limitation. Backend preview remains mock=true.

## Frontend 9e3aff9 checkpoint — 15 November 2026

P1 integrated exactly 9e3aff94ebc3a783de2c74855234e60632bc5b4b by fast-forward after
all seven jobs passed in owner run 43638187682. Backend remains d0f81b6. The frontend
owner's separate worktree was not switched or edited; further visual redesign is
ongoing and no visual acceptance is implied.

This checkpoint includes the response-based sky rings, F17 per-scenario absolute
scrub time, self-hosted font notices/source references and corrected handoff. Rings
are schematic data views, not verified terrain or completion of the F18 3D gate.
P1 local lint, 118 tests (12 files), strict TypeScript and production build passed.
Build retains its >500 kB main-chunk advisory and upstream zod annotation warnings.
Only copied OFL licence texts report trailing whitespace; originals preserved.
Owner browser/reduced-motion/print results remain owner evidence for this checkpoint;
P1 did not repeat those browser checks. App preview remains synthetic. Full scientific
validation, real lunar basemaps, gated 3D and the user's visual redesign remain open.

## Light layout and real geometric handoff — 15 November 2026

Integrated frontend d0a3d853801cadda69cb4ed01710f602292a4e5d and backend
0d6f3829d4a936edbdd482ebae0fba63abc2dcf6 after successful owner CI runs
43642818525 and 43641136341. Owner worktrees untouched. P1 local checks: lint,
122 frontend tests, strict TypeScript/production build; 7 terrain-degraded tests
and changed-backend Ruff PASS. Build retains >500 kB main-chunk advisory.

Backend fix distinguishes unavailable server terrain within coverage from genuine
outside-coverage geometric mode. No new error enum or fixture fallback is introduced.
Owner full-suite claim (491 passed/50 skipped) is not a P1 full-suite rerun.

P1 read C:/azx/evidence/real-export.json, real-export.csv, real-network.json and
real-ui.json. Saved run: im1-odysseus (-80.13, 1.44 E), 1 March vs 15 March 2027,
240 h, REAL geometric mode, Sun 0 vs 224.6 h. P1 parsed exports and verified first
series timestamps match both requests, 1441 samples per scenario and 2882 CSV rows.
This is inspection of saved live-run evidence, not independently recomputed science.
The UI log records the expected covered-polar error; date shift network log records
HTTP 200 on port 8010. Logs are local review material, not hosted deployment proof.

Terrain pair is still blocked on verified complete DEMs: PGDA transfer interrupted
and resume failed (agent stopped after two attempts). Keep partial rasters outside
git; never load/claim them as verified terrain. Do not treat geometric journey success
as the required terrain demo. Full validation, basemap, 3D gate, deployment and demo
remain outstanding. UI screenshots reflect the new light direction; acceptance is
still the user's decision. No automatic stage tag/gate passage.

## P1 independent real preview check — 15 November 2026

The shared preview was intentionally mock-backed, causing the SYNTHETIC banner.
P1 switched both AZX_USE_MOCK and VITE_USE_MOCK to false, set AZX_DATA_DIR=C:/azx/data,
and restarted only the recorded preview process. Kernel sizes and SHA-256 values
for all five files match the local provenance manifest; no completed DEM exists
(the only raster download is a .part file).

Live /health: status ok, mock false, five kernels loaded, zero DEMs. P1 POSTed the
IM-1 date-shift request through port 8000: REAL/geometric responses, 1441 samples
per plan, sunlight 0 and 224.6 h. P1 then entered the same two starts and 240-hour
missions in the actual browser on port 5173 and reproduced the same result. The
synthetic banner is absent. Request/response saved locally in ignored work/ files.
This verifies live SPICE/geometric integration, not terrain or full validation.

Preview remains in real mode. Its initial polar starter can show a terrain-unavailable
error: use IM-1 Odysseus, Date shift, 2027-03-01 / 2027-03-15, 240 h each for the
supported real example. A fresh page does not persist the manually entered example.
Do not hide the missing-terrain error or present the partial DEM as usable.
