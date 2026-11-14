# Branch review - 14 November 2026 - P1
Stage remains S0. This is review evidence, not acceptance of later-stage gates.

## Remote heads observed
- Integration feat/p1-s0-integration: bb5ae1d.
- Backend/terrain feat/p2-p3-backend-terrain: d5c137b (new since 2703add).
- Frontend feat/p4-frontend-s0: ea15dfd; no frontend-specific commits/code relative
  to its integration baseline. It lacks later P1 tooling fixes and should merge the
  latest integration baseline without discarding its unpushed work.
Exactly three remote branches now exist. No new stage branch was created.

## Backend findings
Latest branch includes SPICE/terrain/services/metrics/sweep and reports labelled
S1-S4. Code presence or owner report does not pass a team sync. Open proposals
were not approved by this review; no product code was merged into integration.
Hosted CI for d5c137b: SUCCESS, all seven jobs, run 43609681763.
Detached local review (no new branch):
- Ruff --no-cache: PASS.
- Full pytest: FAILED collection, four errors, caused initially by host Application
  Control blocking pyproj._transformer DLL; subsequent partial-import errors follow.
  No claim that local suite passed; no security-policy bypass attempted.
- AZX_USE_MOCK=true npm run check:startup: PASS actual dual HTTP startup and
  shutdown with ports released.
- npm run check:fixtures: PASS all 15 synthetic fixtures.

## Owner decisions / evidence needed before integration acceptance
1. Current backend cap remains 60,000 per scenario, conflicting with TRD's 60,000
   per request. Latest S4 report itself recommends an aggregate cap after observing
   a heavy request. Backend owner should restore approved baseline or obtain explicit
   team approval for a revised policy. P1 does not silently edit backend product code.
2. Resolve optional fields/site labels, grid-up tile meaning and offsets, tile sizes,
   RATE_LIMITED/429 and sample/provenance metadata via canonical contract change.
   User/frontend approval is not inferred from an owner proposal or green tests.
3. Full data manifests/checksums/raster metadata and real-source reproducibility
   evidence are not available on this review host. Download/results statements in
   backend reports remain OWNER-REPORTED here, not independently verified.
4. Committed one-site/six-time Horizons spot check is not full V1/V2 coverage.
   V4 has not been established by comparing a single mission interval with the
   PGDA long-run average. Full validation remains with assigned owners.
5. Docker build/deployment is still reported untested. Do not call estimated image
   size measured or the product deployed. Frontend remains an empty baseline shell.

## Next within S0
Get backend contract decisions/updated commit and full source evidence; get actual
frontend S0 client/shell work and separate contract/React note; confirm P6/Coordinator
assignment and Sync 0 remaining gates. Keep the three long-lived branches.
No merge, sync tag, deployment or stage advancement is implied by this report.
