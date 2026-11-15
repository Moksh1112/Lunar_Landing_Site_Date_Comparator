# Start here — engineering takeover, 15 November 2026

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
