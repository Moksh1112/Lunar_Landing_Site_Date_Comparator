# Azelux progress and to-do board
Last remote check: 2026-11-15. Current status below supersedes historical snapshots.

## Current authoritative status — frontend checkpoint 9e3aff9

- Frontend 9e3aff9 integrated after all seven owner CI jobs passed (run 43638187682).
  Includes a9ee826 sky-ring visualization and mission-day panorama marker fix,
  font binaries with OFL notices/source references, and corrected owner handoff.
  P1 local lint, 118 tests and strict TypeScript/production build PASS.
  This is a functional checkpoint; the user has NOT accepted the visual design.
  Further UI redesign continues independently in the frontend owner's worktree.
- Prior frontend dbd4349 features remain integrated: source links, accessible glossary, Expert raw series/
  skyline, schematic Leaflet map, validation display, synthetic response notes and
  print fixes. Earlier local 114-test verification is superseded by 118 tests above.
- Backend 8cc3948 initially failed hosted lint (unused noqa). P1 corrected it in
  d0f81b6, also fixing the source revision and missing adapter command argument.
  All seven jobs now pass: run 43636257071. Frontend run 43635772694 also passed.
- Independent adapter checks: Ruff PASS, 4 tests PASS with normal conftest,
  full JSON schema validation PASS, original source SHA-256 PASS, deterministic
  adapted-object equality PASS. No science recomputation occurred.
- Artifact: REAL inputs / spot_check / owner_reported, 24 metric rows, one site ×
  six times for Sun/Earth. Full V1/V2/V4 remain missing. No product AI/ML exists.
- Print fixes: owner reports actual headless Edge report printing; P1 inspected
  committed print-page imagery. Independent interactive print preview remains unverified.
- Remaining frontend: visual refinement in owner's worktree; sourced lunar basemap
  images/delivery and raster orientation check; 3D remains gated.
- Combined integration 03ef7e0: all seven jobs SUCCESS in run 43636520071. P1 keeps the preview running and integrates future green owner pushes.
- Sync 0/1 remain open as previously recorded; no new science/deployment/stage claim.

## Historical snapshots (revision-specific; current status above takes precedence)

## Update procedure
Whenever the user requests an update/progress check, inspect ALL three remote heads
and actual changes against docs/specs/ PRD v2.0, TRD v1.0, Playbook v4.1 and
canonical docs/CONTRACT.md. Update revisions, evidence, blockers and owner to-dos.
Checks happen when requested, not as unattended monitoring.
Status vocabulary: absent; code present; checked (name evidence); integrated;
accepted (gate met); deployed (live verified). Owner-reported results are distinct.
Green mock CI/file presence/report stage names do not pass science or team gates.

## Current integrated source snapshot
Combined code revision 315d22a includes backend d5c137b and frontend 0cd0ae5,
authorized by user. Both owner histories and unchanged product sources verified.
Full combined Linux CI run 43617959513 SUCCESS: all seven jobs, including backend
owner tests/lint and both startup modes. Root target setup/mock startup also passed.
S0 is still OPEN. Code integration is not contract approval/science/gate acceptance.
AI/ML remains out of scope. Exactly three remote branches; no main changes or tag.

## Source-of-truth feature comparison
| PRD requirements | Backend/science evidence | Frontend evidence / remaining |
| --- | --- | --- |
| F1 sites | Loader + three sourced records present; verification owner-reported | Picker absent; official source audit and group coverage pending |
| F2 coordinates | Validation code present | Input/conversion UI absent |
| F3 map | Hillshade preparation code present | Map/projection/click/coverage UI absent |
| F4-F6 scenarios/length/presets | Compare route/service present; cap conflict open | Forms/presets absent |
| F7 sweep | Service/route present | Calendar/ranking/load-as-B absent; real acceptance pending |
| F8 SPICE | Code + one-site/six-time spot-check artifact | Position views absent; full V1/V2 pending |
| F9-F10 skyline/modes | Terrain/coarse/geometric code present | UI labels absent; raster/projection evidence and policy approval pending |
| F11 visibility | Backend code/tests present | Real-source acceptance and display pending |
| F12-F14 metrics/deltas/verdict | Code/tests/verdict cases present | Thresholds/verdict/tables absent; cross-language parity pending |
| F15-F17 panorama/timeline/scrubber | Series/windows code present | Views/time alignment absent |
| F18 3D | Tile code present, orientation contract open | 3D absent; real data and render gate pending |
| F19-F21 modes/source labels/states | Mock/error backend code present | Shell Simple/Expert, synthetic banner and shared state/label components present; feature-view wiring pending |
| F22 Horizons | Limited spot check committed | Full V1/V2 and Methods display pending |
| F23 PGDA | Acquisition/sampling code present | Full comparable long-run V4 pending; mission-vs-long-run average is not V4 |
| F24 Methods | Backend source reports present | Placeholder page present; actual Methods evidence/full V1-V6 pending |
| F25 exports | Browser responsibility per contract | Report placeholder present; CSV/JSON/print export absent |

## Evidence and limits
Backend d5c137b hosted run 43609681763: all seven jobs SUCCESS.
Detached local review: Ruff --no-cache PASS; mock dual-module startup/shutdown PASS;
15 fixture checks PASS. Full local pytest FAILED collection: Application Control
blocks pyproj DLL, followed by partial-import errors. No bypass or local full-pass claim.
Real-data test counts, performance and completed downloads in backend reports are
OWNER-REPORTED here; data/manifest not available on review host.
Integration 755916e run 43613287451: completed SUCCESS. Backend d5c137b run
43609681763: completed SUCCESS. Frontend 0cd0ae5 branch query returned no workflow runs; local checks are separate evidence.
Latest board-refresh revision CI must be reported separately.

## P1 integration to-do
- [x] Three long-lived branches, old branches removed by explicit approval.
- [x] New-only docs/contract/fixtures and portable setup/dependency handoff.
- [x] Review current backend and frontend revisions; keep product code unchanged.
- [ ] Resolve sample-cap and schema issues before integration acceptance.
- [x] Receive and independently check published frontend S0 implementation (0cd0ae5).
- [ ] Collect missing contract/React note and coordinate dependency/audit decisions.
- [ ] Collect full manifest/checksum/raster and validation provenance.
- [x] Assemble and locally test combined owner code as authorized S0 candidate; no stage advancement.
- [x] Confirm full combined Linux CI at 315d22a: run 43617959513 SUCCESS.
- [ ] Resolve deviations before Sync 0 acceptance.
      Backend cap, schema, React and audit issues remain acceptance blockers;
      code integration is not approval of those proposals.
- [x] Recheck all branch heads/CI and all four source-document/archive SHA-256s.
- [ ] Backend owner: next push should resolve aggregate sample cap against TRD or
      carry an explicit approved contract revision; no automatic acceptance of proposal.
- [ ] Frontend owner: incorporate latest integration tooling/CI and push; supply
      missing decision note and address dev audit/unsupported ESLint.
- [ ] Confirm P6/Coordinator, timing and remaining Sync 0 evidence.

## Backend/terrain owner to-do
- [ ] Resolve 60000/request (TRD) vs 60000/scenario (implementation); latest owner
      report recommends aggregate cap after heavy-request measurements.
- [ ] Approve canonical RATE_LIMITED/429, grid-up/offset/tile-size, provenance,
      source labels and sample metadata changes via team/Coordinator.
- [ ] Supply complete manifest and reproducible real-source steps.
- [ ] Complete full V1/V2 and comparable V4 with validation owner.
- [ ] Correct stale uncommitted report labels with actual commit references.
- [ ] Keep owner branch stage labels separate from accepted team gates.

## Frontend owner to-do
- [ ] Update own branch from latest integration while preserving unpushed work.
- [x] Push S0 shell/routes/typed mock client/theme/state work; P1 independently verified 27 tests, lint/build and mock startup.
- [ ] Resolve React 19 vs TRD React 18 and seven moderate dev-dependency findings.
- [ ] Get hosted CI on updated frontend/integrated revision.
- [ ] Send missing C03-C09/React decision note and final integration note.
- [ ] Confirm all frontend ownership, including kit-P1 client/shell/map.

## Gate board
Sync 0: OPEN. Missing contract freeze, frontend acceptance/CI, owner confirmations/
source evidence and canonical integration gate. Later stages: NOT ACCEPTED by P1.
Deployment/MVP/RC/submission: NOT VERIFIED. No automatic passage from branch pushes.

## Latest check log
- 2026-11-14 21:33 IST: all three heads unchanged (integration 755916e, backend d5c137b, frontend ea15dfd).
- Four source/checksum records unchanged. Latest backend routes still enforce
  MAX_SAMPLES_PER_SCENARIO=60000, while TRD specifies the per-request cap.
- Frontend source diff against the reviewed integration baseline remains empty.
- Tests were not repeated: no code changed and the earlier local DLL limitation
  remains unresolved. Current hosted success was read from GitHub, not inferred.
- No product merge, deployment, stage advancement or sync tag performed.

## Frontend S0 publication review (supersedes earlier no-code snapshot)
Remote 0cd0ae5 contains all twelve reported frontend commits; report's unpushed line
was stale. Local tsc/lint/build, 27 tests, target setup and mock HTTP startup/shutdown
passed. Full npm audit reports seven moderate dev-tree affected packages; production
only audit is clean. React decision and hosted branch CI remain open. Frontend owner source is now imported on integration; P1 did not edit it. Backend head remains d5c137b. Full review: FRONTEND_S0_REVIEW.md.

## Authorized combined integration
User authorized merging/checking both owner branches: backend d5c137b and frontend
0cd0ae5. Detached candidate merges were conflict-free. Owner product files imported
unchanged. P1 added dev:s0 explicit both-mock launcher and startup-check coverage.
Local frontend tsc/lint/build, 27 tests, 15 fixtures, Python syntax, Ruff and mock
startup/shutdown passed. Full local backend suite is blocked by pyproj DLL policy;
subset excluding four projection-import files is recorded in integration report.
Real-source test results remain owner-reported. Canonical documents retain unresolved
cap/schema/React/audit decisions; no new source-policy approval is inferred.

### Current integration task status (supersedes earlier historical check logs)
- [x] Combine backend d5c137b and frontend 0cd0ae5 conflict-free.
- [x] Verify combined frontend 27 tests/lint/build, Ruff, fixtures and mock startup.
- [x] Run supported local backend subset: 456 passed, 36 skipped; four pyproj-blocked files excluded.
- [x] Add explicit npm run dev:s0 (both transports synthetic).
- [x] Verify full combined Linux CI: 315d22a / run 43617959513, all seven jobs passed.
- [ ] Resolve open source/contract/React/audit decisions before gate acceptance.
Sync 0 remains OPEN. No later-stage gates accepted.

## Latest integration status (2026-11-15)

- Backend `0856c1416b40c194a22f4452a65e3ff4fbb67e2d` and frontend `9901476d0e625410699ac6e61edd1a93b439c826` are integrated into P1 by fast-forward. Frontend GitHub CI run 43628020833: all seven jobs SUCCESS. Backend run 43621086629: all seven jobs SUCCESS.
- Frontend owner reports the S1 mock Compare journey implemented: scenario inputs/presets/validation, compare action, results and A-minus-B metrics, horizon panoramas and Sun/Earth timeline. Owner reports 50 tests, lint/typecheck/build and browser checks at 375/768/desktop. These UI checks have not been independently rerun by P1. Results are SYNTHETIC; real-mode integration is not claimed.
- P1 diff review: frontend route/store/components/tests/docs only; no API client, backend, fixture, shared tooling or contract changes. `git diff --check` passed.
- Frontend positions on C03-C09 and React 19 are recorded in `frontend/docs/FRONTEND_POSITIONS_S1.md`; these are recommendations awaiting Coordinator decision, not approvals. Audit remains 7 moderate dev-only findings per owner report; production audit reported clean.
- Sync 0/1 remain OPEN pending Coordinator decisions, owner/evidence acceptance and team gate review. Later stages are not accepted. Best-date, real data, export and other remaining requirements should be checked against the PRD/TRD before claiming full frontend completion.
## Current status — 15 November 2026 frontend redesign integration

- [x] Integrate green frontend 53221dd; CI 43633449283 SUCCESS.
- [x] Approve R1 map dependencies and pin compatible packages; 3D remains gated.
- [x] Define R2 validation file interface; no real validation artifacts invented.
- [x] Resolve R3 with existing backend 1e-9 tolerance; frontend boundary tests pass.
- [x] Record React 19 deviation and C03-C09 target decisions under delegated authority.
- [x] Targeted minimatch override; npm full/production audit reports zero findings.
- [x] Independent local lint, 92 tests, strict TypeScript + production build.
- [x] Browser HTTP/mock Compare and Best Date/Load as B; parse actual downloaded JSON/CSV.
- [ ] Print/PDF visual verification: embedded-browser print action timed out; no preview.
- [ ] Frontend F3 map, source links, accessible glossary and Expert audit: owner next work.
- [ ] Validation display consumption and reviewed real V1/V2/V4 evidence.
- [ ] Implement/test approved v1.1 additions across consumers before activating them.

Frontend is unblocked by decisions: no waiting for inactive teammates. Full frontend
completion and real-data readiness remain evidence-based. Sync 0/1 have not been
passed by this update. Detailed handoff: FRONTEND_UNBLOCK_DECISIONS.md. Historical
pending-decision and placeholder descriptions above are superseded by this section.

Integration verification: code/lockfile revision 6ab81e3 passed all seven hosted jobs
in run 43634346682 (frontend, backend, fixtures, attribution, secrets, startup venv
and target). Backend verdict tests: 9 passed; schema sensitivity check passed after
adding explicit UTC timestamp pattern. Impeccable detector on verdict change: [].
Preview remains frontend HTTP 200 and backend /health status ok, mock true. This
CI evidence belongs to 6ab81e3; subsequent documentation-only commit has its own run.
