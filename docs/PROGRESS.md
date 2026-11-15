# Azelux progress and to-do board

## Current project status and pending work — 15 November 2026

**Integration:** local merge commit `ad2ac2e` contains Moksh's `47d8a58` redesign and the reviewed landing/Best Date/chart fixes. It was committed at the user's request and was not pushed. Last verified published baseline is `28b56e3`. Source CI for `47d8a58` is [43707999082](https://github.com/Moksh1112/Lunar_Landing_Site_Date_Comparator/actions/runs/43707999082), seven jobs SUCCESS; no hosted CI is claimed for local-only changes.

**Latest UI milestone (local only):** `50b14ea` added the dedicated analyser, shared Simulator chrome, prior theme/graph/Best Date fixes and visual-source credits in Methods. The follow-up now keeps **gray height shading only** (dark lowlands, light high ground), adds a continuous **1x-5x height slider**, and preserves camera orbit/zoom/pan while scaling. Only Reset view or a different tile reframes. Earth uses the existing NASA texture, a response-derived motion path, eased positions and a direct mission clock/scrubber. Playback clamps to the selected plan and replays from the endpoint. Initial investigation confirmed Earth was updating but moving subtly; no fabricated orbit was added. **163 tests**, lint/typecheck/build pass; isolated Chrome/Brave verify actual rendered Earth against REAL SPICE response geometry and identical camera transforms before/after slider changes. See [TERRAIN_MOTION_2026-11-15.md](TERRAIN_MOTION_2026-11-15.md). **No push; no new hosted integration CI.**

**Current assignment:** P1 owns root tooling, CI and integration docs; the user explicitly authorized this UI milestone. Broader frontend/backend implementation remains with its owners. Kush
([kushpagariya](https://github.com/kushpagariya)) is the likely all-rounder: GitHub maps
backend author `d5c137b` to that account, and author Kush also supplied frontend `9901476`.
This is a history-based identification, not confirmation of current availability.
The user relays coordination; no teammate message was sent. Owner editing activity is unknown.

**Completed / evidenced**

- Real SPICE comparisons, sourced DEM terrain modes, polar/global map assets, terrain 3D,
  10 sourced library sites, Best Date, comparison, provenance, CSV/JSON and print/report
  are integrated. Per-feature evidence and caveats are in `docs/MVP_VERIFICATION.md`.
- Full V1/V2 live Horizons checks passed; V3/V5 mathematical checks passed. V6 is an
  explicitly reviewed P2-owner qualitative spot check, not external scientific certification.
- The simulator's impossible 708 h “find a GREEN day” training goal was changed to 240 h
  without changing backend verdict science or thresholds. The frontend owner reports a
  REAL/terrain browser run: B=2027-03-01 RED, B=2027-03-14 GREEN, +210.1 h both-visible
  time for B. P1 reviewed source and CI but did not repeat that browser run. Details:
  `frontend/docs/HANDOFF_SIMULATOR.md`.
- CSV provenance/skyline coverage and native five-page print-preview checks were completed.
  Responsive viewport and selected keyboard/accessibility checks are in
  `docs/ACCEPTANCE_2026-11-15.md`.
- Takeover checks: 142 frontend tests, lint/typecheck/build; backend Ruff; setup syntax,
  15 synthetic fixtures, dependency handoff and combined startup/shutdown pass. A fresh
  remote clone independently starts both modules. Real HTTP health reports mock=false,
  five acquired kernels and contract 1.1; Apollo geometric comparison, signed deltas,
  empty/censored windows, input rejections and a 60-day geometric sweep were exercised.
  After documented far-DEM preparation, the fresh clone also returned REAL near+far
  terrain for two polar sites over 708 h and a 60-day terrain sweep (479.89 ms observed
  end-to-end here). The revised challenge API independently reproduced RED on March 1,
  GREEN on March 14 and +210.1 h for B; the revised browser journey remains owner-reported.
  Exact environment, data scope and results: `docs/TAKEOVER_VERIFICATION_2026-11-15.md`.
- Complete documented acquisition/preparation succeeded in external `R:/azelux-data`;
  final backend run: **551 passed, 6 cached-skyline skips**. All 16 completed manifest
  entries match the local file hashes. Runtime data remains outside Git; the review-only
  manifest snapshot and real HTTP summaries are in `docs/evidence/TAKEOVER_*`.
- Concurrent frontend `6310e18` changes nav/buttons/copy and vendors React Bits components;
  it changes no backend, contract, lockfile or threshold. Source/merge CI were read before
  fast-forward. Current UI browser/keyboard/mobile/reduced-motion review is still required.

**Still pending**

1. **Scientific V4:** FAIL, about 6.2989 percentage points against the ≤5 pp target. Source
   review identifies unresolved reference/runtime convention differences (disc visibility,
   epoch/averaging window, DEM). Keep FAIL visible; do not loosen tolerances or tune to pass.
   **Partial-data mode mismatch:** near-only Athena tiles produce `horizon_mode=terrain`
   without a far DEM, although the contract defines terrain as near+far. Backend owner
   must resolve or seek a Coordinator-approved clarification; P1 has not changed source.
   This state reproduced the 240 h RED/GREEN API outcomes with +210.0 h for B, but it
   does not independently verify the owner's +210.1 h near+far browser result.
2. **Former Home Moon follow-up (dormant):** the reduced-motion texture defect is in the former HomePage/HomeMoon component, which is no longer routed after the user selected the tour as the default landing page. Retain the owner follow-up if that component is reused; do not describe it as a defect in the current default tour.
3. **Remaining feature acceptance:** finish the outstanding F1–F25 checks in
   `docs/MVP_VERIFICATION.md`: official-site coverage/source audit; coordinate, mission and
   terrain tile/coverage boundaries; broader/slower Best Date ranges; censored windows;
   A−B sign and threshold interactions; panorama/timeline/scrubber alignment; slow-network
   and error states; full keyboard/screen-reader checks; and physical print setup.
4. **Human/device checks:** physical phone/tablet, another browser, assistive-technology
   speech, slow-device 3D behavior/performance, and two independent usability walkthroughs
   remain unverified. Responsive viewport emulation is not device testing.
5. **Release gate:** user-owned deployed demo/rehearsals, final acceptance, deployment,
   submission and release tags remain to be done by the user. MVP acceptance is OPEN.

No runtime AI/ML is required in v1. Green CI and a passing training exercise do not resolve
V4 or pass the MVP/release gate. The sections below are dated checkpoints; where they
conflict with this current list, this section and the linked acceptance ledger take priority.

### Owner work to coordinate through the user

| Owner | Next coherent milestone / required evidence |
| --- | --- |
| All-rounder, backend/terrain | V4 reference epoch/disc/DEM investigation with original FAIL retained; partial-data mode mismatch; tile/coverage edges; sourced international/commercial library breadth and mission/sample/date limits. Send exact source SHA, green CI, commands, source modes and remaining limits. |
| All-rounder, frontend | Real simulator rerun with complete near+far provenance; date-shift and panorama/timeline/scrubber alignment; threshold/delta/countdown cases; slow/error/retry/double-submit/stale-result behavior; current exports/report after affected changes. Send exact source SHA and attributed browser evidence. |
| P1 | Human review of the prepared tooling/CI/docs diff, then commit/push P1 and verify its exact hosted CI; review future owner source/contract diffs only after the source SHA is green; maintain evidence and release drafts. Clean-clone real near+far startup is reproduced. No owner source edits. |
| Humans/device owners | Full keyboard and spoken screen-reader journey, physical phone/tablet, alternate browser, slow-device 3D/fallback and two outside-team usability participants (unassisted finish/time/stuck point; target each under two minutes). |
| Moksh / Coordinator | Resolve scientific/contract decisions and stage sync; review P1 diff before commit; authorize any final deployment/main merge/tag/submission/MVP decision separately. |

Release draft and demo procedure: `docs/RELEASE_PREPARATION.md`. No new F1–F25 gate is
marked fully accepted by the takeover checks. Earlier sections below are dated history.

## Latest simulator integration — 15 November 2026

Frontend `414e7dd` was integrated into `feat/p1-s0-integration` by merge `acbf22a`.
Hosted CI passed all seven jobs for frontend `414e7dd` (run `43695763208`), integration
merge `acbf22a` (run `43696473842`), P2/P3 `7d6ac55` (run `43687231193`), and the prior P1
progress-doc checkpoint `1f5b5cc` (run `43697012466`).

The frontend handoff diagnoses the earlier 708-hour qualification as unsolvable at IM-2
Athena under the existing verdict rule: Plan B dates 1–30 March 2027 returned RED. The
training scenario now uses 240 h and starts Plan B on Plan A's day; thresholds, verdict,
contract and backend science are unchanged.

The frontend owner reports a REAL/terrain browser check of the revised challenge: B on
2027-03-01 returned RED, then B on 2027-03-14 returned GREEN, with +210.1 h both-visible
time for B. P1 reviewed the source diff and green CI but did not independently repeat that
browser run. This verifies reported training-flow behavior, not landing safety or MVP
acceptance. V4 remains scientifically FAIL; final release and acceptance remain with user.

## Simulator route checkpoint — 15 November 2026 (dated evidence)

Integrated frontend-landing 2b1df93. Simulator: /landing; scroll tour: /landing/tour;
comparator: /; features: /best-date, /methods, /report. Dashboard brand links back to
the simulator. Result handoff resets the scrubber and preserves computed inputs and
response. Browser checked all routes and not-found behavior; 141 tests, lint and build
pass. See LANDING_INTEGRATION.md. Earlier descriptions of /landing as the scroll tour
are superseded. Existing V4 and physical-device/usability limitations remain.


## Landing integration checkpoint — 15 November 2026 (dated evidence)

Reviewed frontend-landing, corrected its source labels/dependency downgrade and
animation cleanup, and merged green df60cbc (CI 43688963732) into integration.
The optional dark /landing presentation keeps the light comparator at /.
All illustrative readouts are SYNTHETIC; actual computation is in the comparator.
134 tests, lint/typecheck/build pass; responsive bounds and interactions checked.
See [LANDING_INTEGRATION.md](LANDING_INTEGRATION.md) for exact evidence and preview.
V4 remains failed; V6 is an owner qualitative spot check. Release stays with user.


## Acceptance checkpoint — 15 November 2026 (dated evidence)

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


## Full-stack checkpoint — 15 November 2026 (historical)

The user resumed full-stack work. Earlier stopped/unmerged descriptions below are
historical. Backend 79936a5 and frontend fd7bf03 plus 8bd7dd4 are integrated.
Current evidence and the F1–F25 acceptance checklist: docs/MVP_VERIFICATION.md.
The ten-site API discrepancy was stale process cache and resolved by safe restart.
Real Best Date -> Plan B -> Compare works with sourced 20 m terrain. The previous
result ambiguity after input edits is fixed and browser-verified. Frontend now has
129 passing tests; lint/build pass. Owner CI 43686142434 SUCCESS. Current 3D first
frame measured 1000 ms on this host. V4 FAIL / V6 pending remain open. Deployment
and release remain with the user; no MVP/RC/final gate has been declared passed.

Current status and pending work at the top of this file is authoritative. Remaining dated entries are historical snapshots unless called out above.

## Historical stop point before the latest integration

The user stopped pending implementation on 15 November 2026. Start with
[TAKEOVER_CURRENT.md](TAKEOVER_CURRENT.md) for exact branches, checks and next action.
Integration documentation checkpoint a1628de has green hosted CI (run 43649876609). Backend
79936a5 is integrated. Frontend fd7bf03 is pushed but NOT merged: local lint,
126 tests and TypeScript/build passed; hosted CI run 43649641903 passed all seven
jobs. Integration and rendered verification remain for the next owner. Computer Use blocked browser verification; no visual
pass is claimed. No release/deployment or remaining feature work is being continued.

## Historical full-stack milestone snapshot — superseded by current status above

- [x] Real 20 m near-field + 160 m far-field polar comparisons run successfully.
- [x] Sourced polar hillshade, projection sign checks and whole-Moon context map.
- [x] Gated terrain 3D and synchronized playback implemented; initial 569 ms host measurement.
  Latest readiness-timing correction still needs a fresh measurement.
- [x] Live full V1/V2 ephemeris checks passed; executed V3/V5 mathematical checks passed.
- [x] v1.1 backend/frontend compatibility implemented, v1.0 fixtures retained.
- [x] Local backend 547 passed / 6 skipped; frontend 126 tests, lint/typecheck/build passed.
- [ ] V4 scientific target: FAIL at one point (~6.30 pp vs <=5), including 20 m rerun.
- [ ] V6 qualitative sanity acceptance: diagnostics present, human review pending.
- [ ] User visual acceptance, two-person usability and cross-device performance checks.
- [x] Integration checkpoint a1628de hosted CI: run 43649876609 SUCCESS.
- [x] Frontend fd7bf03 hosted CI: run 43649641903 SUCCESS (seven jobs).
- [ ] Frontend fd7bf03 UI checkpoint: integrate and render-verify on resume.

Detailed source provenance, reproduction commands, tests and takeover instructions:
NON_RELEASE_HANDOFF.md. Release/deployment is reserved for the user. No scientific,
MVP, RC or final gate is silently passed. History below is revision-specific.
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

## Temporary full-stack milestone — 15 November 2026

User granted temporary P1-P6 engineering ownership; release/deployment is reserved
for the user. Existing clean owner worktrees are reused. Push every verified coherent
milestone and leave handoff evidence as work progresses.

80 m NASA PGDA DEM resumed successfully: 189158392 bytes, SHA256
82030dcbdd7c4bb0c7d858e9b4b293b9f2cda5a543ba31ec0f42784bd6beee5a,
matching the earlier owner's complete-file evidence. Derived far_160m.tif and the
georeferenced south-pole hillshade in C:/azx/data. Local covered-polar compare now
returns REAL/terrain_coarse for both curated IM-2 scenarios. This does not claim
20 m near-field coverage. Remote NASA COG tile extraction is still running.

Backend f55f8d0 is green on hosted CI. New V1/V2 runner performed live Horizons
checks: V1 576 angle rows (3 positions x 48 hourly times x Sun/Earth x az/el), max
error about 0.00000236 deg; V2 exact latitude/east-longitude header agreement.
Evidence is team-produced/owner-reported, not external certification. Initial
V2 height comparison exposed ~2e-13 km Horizons numerical noise; the final V2 rows
check exactly the latitude/longitude scope specified in PRD, while raw headers retain
height. Full artifacts are published on the backend branch; pending green evidence CI
before integration. V4 long-run illumination and terrain 3D remain outstanding.

## Terrain and basemap milestone (15 November 2026)

Completed NASA 80 m raster, derived 160 m far field and two 50 km 20 m near-field
crops. Remote crops use NASA's COG byte ranges, so their own SHA256 values are
recorded but upstream full-file checksum verification is explicitly false. No raw
rasters/kernels/images are added to git. Reproduce with:

    node scripts/python.mjs scripts/download_dems.py --data-dir C:/azx/data --skip-20m
    node scripts/python.mjs scripts/prepare_dems.py --data-dir C:/azx/data --far --hillshade
    node scripts/python.mjs scripts/prepare_remote_tiles.py --data-dir C:/azx/data

Use an absolute non-cloud data path. Remote tile reads validate expected CRS,
dimensions and pixel scale, then record crop windows and derived checksums. Downloader
retry default is now two attempts per boundary, preserving partial files.

Live comparison: IM-2 Athena vs intended site, 15 March 2027, 240 h: both REAL/terrain
(20 m near field plus 160 m far), Sun 240 h both; Earth 203.7/203.6 h. Requests and
responses are in ignored work/p1-polar-terrain-*.json. Exact map CRS formula checked
against the raster projection at four cardinal longitudes (0 E up, 90 E right).

Basemap code pushed: backend f470a87 serves only the allowlisted hillshade PNG and
metadata under /assets/lunar/; frontend 6c65375 overlays it with source citation and
explicit absent-image state. Raw DEM paths are never served. Both owner CI runs
passed before integration. Local full backend suite: 539 passed, 12 skipped; frontend
122 tests/lint/typecheck/build passed. New V1/V2 evidence is live, full-scope,
owner-reported; V3/V5 executed mathematical evidence is published on backend branch.
V4 reference maps are downloading; 3D and final non-release acceptance remain next.

## Full-stack checkpoint — terrain, map and validation

Completed and pushed owner milestones: live V1/V2 checks; V3/V5 regression evidence;
real 20 m near-field/160 m far terrain; georeferenced polar hillshade; gated 3D and
shared playback. Local full backend suite after v1.1: 546 passed / 6 skipped. Local
frontend: 126 tests, lint, TypeScript/build passed. Initial browser 3D first frame:
569 ms; playback and the real 2048 px hillshade verified. Repeat after final integration.

Scientific blocker: V4 tested all five prescribed sample positions over 18.6 years,
daily step. One Sun result differs by ~6.30 percentage points, exceeding the 5 pp
target. Replacing its coarse near-field with a real 20 m crop did not resolve it.
Both attempts are saved; investigation stopped at this boundary under the two-attempt
rule. Never change points or weaken the target to obtain a pass. V6 diagnostics are
provided but qualitative human review remains incomplete.

Whole-Moon view still uses a coordinate grid; the sourced polar hillshade is active.
Release/deployment remains the user's phase. See NON_RELEASE_HANDOFF.md for restart,
reproduction, current limitations and takeover commands (written at final checkpoint).

## Frontend owner resumed — 15 November 2026

Frontend implementation returned to its owner; P1 remains integration only.
Current beginner-guide/controller work and exact remaining checks are in
FRONTEND_HANDOFF_CURRENT.md. Source: frontend-landing 72de289, including 0851855.
