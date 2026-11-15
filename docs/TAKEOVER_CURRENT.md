# Start here — engineering takeover, 15 November 2026

## Latest integration checkpoint — 15 November 2026

Frontend `414e7dd` is integrated in `feat/p1-s0-integration` at merge `acbf22a`. Its source
CI passed all seven jobs (run `43695763208`); the integration merge CI also passed all seven
(run `43696473842`). The current local integration worktree fast-forwarded to the pushed
merge; its pre-existing `.claude/launch.json` remains untracked and preserved.

The frontend owner reports the 708 h qualification objective was unsolvable at IM-2 Athena
under the unchanged science rules. The challenge now uses 240 h; the owner-reported real
browser run returned RED for B=2027-03-01 and GREEN for B=2027-03-14, with terrain provenance
and +210.1 h both-visible time for B. See `frontend/docs/HANDOFF_SIMULATOR.md` and
[PROGRESS.md](PROGRESS.md). P1 reviewed the diff and CI, but did not independently repeat
the owner’s browser run. V4 remains FAIL; no MVP/release gate is declared passed.

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


## Earlier full-stack checkpoint (historical)

This dated snapshot preceded frontend `414e7dd` and integration merge `acbf22a`. Its
branch, test-count and service details are superseded by the current status and acceptance
sections above; use those sections for the present handoff.

## Branches and exact checkpoint

| Branch | Integrated code checkpoint | Status |
| --- | --- | --- |
| `feat/p1-s0-integration` | merge `acbf22a` | Default integration branch; progress and acceptance docs maintained here |
| `feat/p2-p3-backend-terrain` | `7d6ac55` | Backend/terrain head integrated into P1 |
| `feat/p4-frontend-s0` | `414e7dd` | Frontend head integrated into P1 |

Latest verified hosted CI passed for the P1 merge (run `43696473842`), P2/P3 owner
branch (run `43687231193`) and P4/P5 owner branch (run `43695763208`). The prior P1
documentation checkpoint passed run `43697012466`. No main merge or deployment is claimed.

## Safe takeover

    git clone --branch feat/p1-s0-integration https://github.com/Moksh1112/Lunar_Landing_Site_Date_Comparator.git
    cd Lunar_Landing_Site_Date_Comparator
    git fetch origin
    npm run setup
    npm run hooks

All three owner branches are already integrated at the listed code checkpoints. Do not
re-merge them. Read `docs/PROGRESS.md` and `docs/MVP_VERIFICATION.md` for current remaining
acceptance work. V4 is the highest-risk engineering blocker; the user retains final MVP and
release decisions.

## What is ready

Real SPICE comparisons, verified 80 m source DEM, derived 160 m far DEM, real 20 m
near-field crops, sourced polar/whole-Moon imagery, terrain 3D with 2D fallback,
exports with v1.1 provenance, and ten officially sourced library locations are in
integration. V1/V2 passed against live Horizons; V3/V5 executed mathematical tests
passed. Latest documented full local backend run: 551 passed, 6 skipped. No runtime AI/ML
component exists
or is required in v1. Synthetic transports remain explicitly labelled.

## Open work and limits

1. **V4 scientific validation is still FAIL** at about 6.2989 pp versus the ≤5 pp target.
   The backend source review identifies convention differences in disc visibility, averaging
   epoch/window and DEM. Continue only with source-backed evidence; do not relax tolerance.
2. **Feature acceptance remains partial.** Use `docs/MVP_VERIFICATION.md` as the detailed
   F1–F25 ledger. Remaining checks include site source coverage, coordinate and tile-edge
   cases, terrain coverage boundaries, broad/slow Best Date ranges, censored windows, A−B
   sign and time-alignment checks, slow-network/error states, and full assistive-tech review.
3. **Device and human acceptance:** physical phone/tablet, alternate browser, screen-reader
   speech, slow-device 3D performance/fallback, and two independent usability walkthroughs
   are unverified. Viewport emulation does not count as physical-device evidence.
4. **Release:** deployed demo/rehearsals, final MVP decision, deployment, submission and tags
   remain with the user. No MVP, RC or final gate is declared passed. Runtime AI/ML is not a
   v1 requirement.

## Local services and data

Earlier project evidence recorded the frontend at `http://127.0.0.1:5173` and real backend
at `http://127.0.0.1:8000`, with 10 sites and contract 1.1. Current live HTTP status could
not be rechecked during this progress update because local loopback access was denied in the
shell; verify health and site count before a demo. Confirm the process command line before
stopping any recorded PID.

Runtime kernels, DEMs, tiles and imagery live outside Git/OneDrive at `C:/azx/data` on the
original machine. A clone does not include them; reproduce using `docs/NON_RELEASE_HANDOFF.md`.
The root `.claude/launch.json` is a local untracked preview file and was preserved; do not
publish or remove it. AI assistance was used; disclose it where the playbook/submission rules
require.
