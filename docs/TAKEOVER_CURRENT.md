# Start here — engineering takeover, 15 November 2026

## Latest integration checkpoint — 15 November 2026

The frontend owner commit `9c644a6` is merged into `feat/p1-s0-integration` (local merge
`d232f34`). The source branch hosted CI is green, run `43693356786`. The six-step simulator
demo and a real-backend qualification journey were exercised. Backend health showed
`mock:false`, 5 kernels and 4 DEMs; the real terrain-backed results for Athena at 708 h were
RED for both tested Plan B dates (15 and 16 March 2027). See the latest section in
[PROGRESS.md](PROGRESS.md) for the exact measurements and local check limitations.
Local TypeScript and lint passed. Build and Vitest were blocked by Vite temp-file `EPERM`
while the local preview occupied the OneDrive workspace; integration checkpoint 92dc6f4 CI run 43694200641 completed SUCCESS across all seven jobs.
V4 remains FAIL; no release/MVP gate is declared passed.
## Current simulator routes — 15 November 2026

Integrated frontend-landing 2b1df93. Simulator: /landing; scroll tour: /landing/tour;
comparator: /; features: /best-date, /methods, /report. Dashboard brand links back to
the simulator. Result handoff resets the scrubber and preserves computed inputs and
response. Browser checked all routes and not-found behavior; 141 tests, lint and build
pass. See LANDING_INTEGRATION.md. Earlier descriptions of /landing as the scroll tour
are superseded. Existing V4 and physical-device/usability limitations remain.


## Latest landing integration — 15 November 2026

Reviewed frontend-landing, corrected its source labels/dependency downgrade and
animation cleanup, and merged green df60cbc (CI 43688963732) into integration.
The optional dark /landing presentation keeps the light comparator at /.
All illustrative readouts are SYNTHETIC; actual computation is in the comparator.
134 tests, lint/typecheck/build pass; responsive bounds and interactions checked.
See [LANDING_INTEGRATION.md](LANDING_INTEGRATION.md) for exact evidence and preview.
V4 remains failed; V6 is an owner qualitative spot check. Release stays with user.


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


Implementation stopped at the user's request. No remaining feature work, release,
deployment or scientific acceptance was performed after that stop.

## Branches and exact checkpoint

| Branch | Published code checkpoint | Status |
| --- | --- | --- |
| feat/p1-s0-integration | a1628de | Default branch; integrated backend 79936a5 and frontend 2f73a4e |
| feat/p2-p3-backend-terrain | 79936a5cd3b658ad7b641b7c064c00d62ffddf2e | Fully integrated into P1 |
| feat/p4-frontend-s0 | fd7bf03ed01360eb82d00b27bb78d7ff726d5e38 | Latest responsive UI checkpoint, NOT yet integrated into P1 |

P1 current documentation checkpoint a1628de hosted CI passed all jobs: run 43649876609.
Frontend checkpoint run 43649641903 completed SUCCESS: all seven jobs. The user
stopped work before integration; the next owner should review and merge when resuming. Local lint, 126 tests and strict TypeScript/production
build passed for fd7bf03. Browser inspection of that checkpoint was blocked by
Computer Use's URL-policy check; no bypass was attempted and no visual pass claimed.
See frontend/docs/UI_HARDENING_CHECKPOINT.md on the frontend branch.

## Safe takeover

    git clone --branch feat/p1-s0-integration https://github.com/Moksh1112/Lunar_Landing_Site_Date_Comparator.git
    cd Lunar_Landing_Site_Date_Comparator
    git fetch origin
    npm run setup
    npm run hooks

Keep the three existing branches. Preserve any local work before switching or merging.
Read docs/CONTRACT.md (active v1.1, v1.0 compatibility), docs/SPEC_ALIGNMENT.md,
docs/NON_RELEASE_HANDOFF.md and the current-status section of docs/PROGRESS.md.
Canonical originals are docs/specs/Azelux_PRD.pdf, Azelux_TRD.pdf and
Azelux_Playbook_v4.1.pdf. Archived instructions and historical progress rows are not
current startup instructions or current blockers.

Next engineering action, when resuming: review the green frontend run and fd7bf03,
merge origin/feat/p4-frontend-s0 into integration only when green, then inspect the
Export/layout changes at 320/375/768/1440 px and rerun the real comparison journey.
The stopped checkpoint includes bounded inline exports, wrapping terrain controls,
responsive grid floors, evidence text wrapping and matching print/report colours.

## What is ready

Real SPICE comparisons, verified 80 m source DEM, derived 160 m far DEM, real 20 m
near-field crops, sourced polar/whole-Moon imagery, terrain 3D with 2D fallback,
exports with v1.1 provenance, and ten officially sourced library locations are in
integration. V1/V2 passed against live Horizons; V3/V5 executed mathematical tests
passed. Full local backend: 547 passed, 6 skipped. No runtime AI/ML component exists
or is required in v1. Synthetic transports remain explicitly labelled.

## Open work and limits

1. V4 FAIL: sunlight difference about 6.30 percentage points at (-88, 90 E), above
   the <=5 pp target. Coarse and 20 m attempts did not resolve it. Two-attempt
   scientific debug boundary reached; preserve evidence and seek scientific review.
2. V6 INCOMPLETE: diagnostics exist; qualitative sanity acceptance is still pending.
3. Latest UI checkpoint needs rendered/keyboard/mobile/print/export verification and
   integration. Current screenshots predate this checkpoint.
4. Cross-device 3D/performance and two-person usability are unverified. The earlier
   569 ms first-frame measurement is one host and predates the readiness timing fix.
5. Vite warns about large chunks (frontend-only checkpoint: main ~552 kB, lazy 3D
   ~957 kB minified); do not treat the advisory as a failed build or silently hide it.
6. Final release, deployment, submission and final stage tags remain with the user.
   No MVP/RC/final or scientific gate is declared passed.

## Local services and data

The requested main preview remains running: http://127.0.0.1:5173, API
http://127.0.0.1:8000. It serves integration code, not unmerged fd7bf03. Health was
checked: status ok, mock false, contract 1.1. Its cached /sites still had three entries
before shutdown of this task: restart the recorded dev process to load the ten-entry
library. work/server-state.json records root PID 27988; verify its command line
before stopping it. The separate task-only preview on 5174 was stopped.

Real datasets are outside Git/OneDrive at C:/azx/data on this computer. Another
computer must reproduce them using docs/NON_RELEASE_HANDOFF.md; a clone alone does
not include kernels/rasters/imagery. The manifest snapshot is
docs/evidence/LOCAL_DATA_MANIFEST_2026-11-15.json. Full upstream 20 m checksum was
not verified; cropped datasets have hashes and explicit provenance.

Only .claude/launch.json is untracked in the root worktree; it is the user's local
preview configuration and was deliberately preserved, not published. All engineering
source changes in this takeover are committed. This work used AI assistance; retain
honest disclosure wherever the playbook or event requires it.
