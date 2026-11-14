# Azelux progress and to-do board
Last remote check: 2026-11-14 21:33 IST. Stage: S0 OPEN. Frontend S0 implementation now published and locally checked; see FRONTEND_S0_REVIEW.md.

## Update procedure
Whenever the user requests an update/progress check, inspect ALL three remote heads
and actual changes against docs/specs/ PRD v2.0, TRD v1.0, Playbook v4.1 and
canonical docs/CONTRACT.md. Update revisions, evidence, blockers and owner to-dos.
Checks happen when requested, not as unattended monitoring.
Status vocabulary: absent; code present; checked (name evidence); integrated;
accepted (gate met); deployed (live verified). Owner-reported results are distinct.
Green mock CI/file presence/report stage names do not pass science or team gates.

## Current branches
| Workstream | Reviewed revision | Assessment |
| --- | --- | --- |
| Integration feat/p1-s0-integration | bb5ae1d code baseline; 76b333e progress docs | Verified setup/CI scaffold; product branches not merged |
| Backend/terrain feat/p2-p3-backend-terrain | d5c137b | Substantial services/tests present; seven hosted jobs green |
| Frontend feat/p4-frontend-s0 | 0cd0ae5 | S0 shell/client/theme/components present; 27 tests/lint/build/startup pass locally; CI and React/audit decisions pending |
| AI/ML | Not in product scope | SPICE/terrain/validation tracked as science/data, not an invented AI feature |

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
- [ ] Integrate only reviewed conforming green work; do not advance stages implicitly.
      No newly ready product changes at this check: backend cap approval remains
      blocked; frontend now has S0 implementation but awaits React/CI/audit decisions.
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
only audit is clean. React decision and hosted branch CI remain open. No frontend
code merged or modified. Backend head remains d5c137b. Full review: FRONTEND_S0_REVIEW.md.
