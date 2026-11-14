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
