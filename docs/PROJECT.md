# Azelux - current project and integration status
Sole active approach: PRD v2.0, TRD v1.0, Playbook v4.1 and docs/CONTRACT.md
from the new kickoff kit. Source copies/checksums: docs/specs/.
Earlier Horizons-first plans/contracts are superseded, retained only in docs/archive/.

## Product / data flow
Browser -> FastAPI -> local SPICE ephemeris + verified LOLA skyline -> windows,
metrics, A-minus-B deltas and threshold verdicts. Horizons is an offline validation
reference, never a runtime dependency for a user's compare/sweep.
Terrain modes: terrain / terrain_coarse / geometric; last is visibly labelled
"geometric horizon only". No AI, database, authentication or uploads in product.
Runtime ephemeris/terrain and every source must be validated before REAL is claimed.
No watts, safety certification or guaranteed radio-link claim.

## Ownership - explicit user override of kit
| Role | Owned work | Branch guidance |
| --- | --- | --- |
| P1 / user | Integration ONLY: root setup, CI, locks, hooks, shared approved contract/fixtures, docs, hosting, QA, submission | feat/p1-s0-integration |
| Backend owner (kit P2) | API/models/mock routes, SPICE, windows/metrics/verdict, sweep, backend scaffold and tests | feat/p2-* |
| Terrain owner (kit P3) | DEM downloads/crops, skyline, coverage, tiles, polar site evidence | feat/p3-* |
| Frontend owner (kit P4, helpers P5/P6 as assigned) | ALL frontend source: scaffold, shell, client, routes, state, map, comparison, charts, 3D, methods/report | feat/p4-* / agreed helper branches |
| Validation owner (kit P6) | V1-V6 with backend/terrain support, methods evidence and non-polar site data | feat/p6-* |
| Coordinator / PRD owner | Names/availability, schedule/replanning, contract decisions and requirement clarification | team confirms |

Kit slot numbers are roles, not invented identities. Actual names and helper
availability remain pending. Existing remote branches are preserved, not renamed;
earlier branch names/role assignments do not override this board.

## Active paths / boundary
Contract: docs/CONTRACT.md. Fixtures: fixtures/*.json (new synthetic only).
Open new-spec questions: docs/CONTRACT_CHANGE_REQUESTS_S0.md.
Commands: README.md. Current role prompts: prompts/. Original templates in the
reference ZIP are superseded where they conflict with user ownership/tooling.

## Stage gates (IST, from new playbook; actual restart schedule needs confirmation)
| Stage | Source window | Gate |
| --- | --- | --- |
| S0 | Sat 14 Nov 13:00-15:00 | Reviewed contract/fixtures, CI, module starts/hooks, downloads started; sync-0 |
| S1 | Sat 15:00-20:00 | Fixture journey, SPICE one site, skyline one site; sync-1 |
| S2 | Sat 20:00-Sun 02:00 | Two real terrain/SPICE comparisons deployed, V3/spot check; sync-2 |
| Rest | Sun 02:00-08:00 | No merges |
| S3 | Sun 08:00-13:00 | All F1-F25, validation and 3D gates; sync-3 |
| S4 | Sun 13:00-15:00 | Two live demo runs, security, usability; mvp |
| Iteration 1 | Sun 15:00-19:00 | Explainer, alternatives, education; it1 |
| Iteration 2 | Sun 19:00-21:00 | Approved polish/extensions; rc-1 freeze |
| S5 | Sun 21:00-23:00 | <=30s subtitled video / backup deck, submission confirmation; final |

Do not advance by the clock alone. Coordinator announces any cuts/replan. Protect
comparison, real data, terrain, panorama, timeline and source labels. No S1 begun.

## Current evidence
S0 OPEN, sync-0 not passed; no main changes or tag authorized/performed.
Baseline 9339a0e passed all six hosted jobs: run 43578191183 (including Python 3.12
venv/target startup). Local target setup, frontend build, dual HTTP startup and
shutdown passed. This is scaffold evidence, not expanded API/science conformance.
New kit contract adopted by explicit user instruction; team freeze/acknowledgment
still pending. All 15 new fixtures synthetic; source sites are unverified/hidden by default.
Backend still implements old status-only liveness; compare/other new endpoints absent.
Frontend still empty shell; owner must implement new client/routes/views. No science,
deployment, usability, real site library or submission acceptance is claimed.

## Remaining Sync 0 gates
Resolve open contract questions with owners; teammate startup/hooks/role evidence;
kernel/DEM download/manifest evidence; reviewed green canonical baseline on protected
main (user has forbidden changing main here); domain/hosting and actual schedule.
See SYNC_0_CONFIRMATIONS.md. Stop at S0.

## Teammate readiness evidence received
Frontend owner reports branch feat/p4-frontend-s0 at baseline 5f8fd1b, no feature
changes yet. macOS arm64 / Node 20.20.2 / npm 10.8.2 / Python 3.12.14: setup,
hooks, both HTTP endpoints, shutdown, tsc/build, fixture and backend checks passed.
This is teammate-reported evidence, not independently rerun on that machine.
check:setup failed with no bare python on PATH; integration corrected npm commands
to use setup-selected interpreter. Frontend implementation and team freeze remain
pending; separate contract/React positions and final integration note not received.
User confirmed one teammate owns P2+P3, another P4+P5, user owns P1.
P6/Coordinator assignment still needs confirmation. No full Sync 0 acceptance.

## Latest branch review
See BRANCH_REVIEW_S0.md: backend d5c137b is CI-green but unmerged pending contract
decisions; frontend branch published at ea15dfd has no frontend-specific work yet.
Local backend full test collection blocked by pyproj DLL policy; mock startup and
fixtures passed. All three long-lived remote branches now exist. Remain in S0.

## Shared progress board
PROGRESS.md tracks all workstreams against the new source documents on each
user-requested update check, with revisions, evidence, blockers and owner to-dos.
AI/ML is not a product workstream; science/data covers SPICE, terrain and validation.

## Latest requested progress check
2026-11-14 21:33 IST: teammate heads unchanged (backend d5c137b, frontend ea15dfd).
Backend and prior integration CI success reverified; frontend has no branch run.
Source document checksums unchanged. PROGRESS.md refreshed with immediate owner
actions; no product change ready for acceptance. S0 remains open.

## Frontend S0 update
Published 0cd0ae5 now independently checked (27 tests/lint/build/mock startup PASS).
Earlier no-frontend-work statements are historical snapshots, superseded by
FRONTEND_S0_REVIEW.md and PROGRESS.md. React/source decision, dev audit, current
hosted branch CI and remaining contract acceptance are still open. Stay S0.

## User-authorized combined integration
Backend d5c137b and frontend 0cd0ae5 combined in detached review, conflict-free.
Owner product sources imported unchanged; root tooling supplies npm run dev:s0
for explicitly synthetic preview. Status: code integrated after verification,
NOT Sync 0 accepted, NOT later-stage gate accepted, NOT deployed/real-source verified.
Open contract/React/audit/validation issues remain; see PROGRESS.md and INTEGRATION_S0.md.

## Combined integration result (supersedes prior unmerged snapshots)
315d22a now contains backend d5c137b and frontend 0cd0ae5; owner sources unchanged.
CI 43617959513 completed SUCCESS for all seven jobs, including full backend owner
checks on Linux, frontend tests/lint/build and both startup modes. Local root target
setup + S0 preview startup/shutdown passed. npm run dev:s0 starts both mock transports.
No main changes, sync tag or stage advancement. Sync 0 remains open on the explicit
contract/React/audit/source-evidence acceptance items in PROGRESS.md.
