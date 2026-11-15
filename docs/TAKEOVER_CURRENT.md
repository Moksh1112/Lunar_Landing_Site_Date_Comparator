# Start here - P1 takeover, 15 November 2026

P1 owns repository coordination, root tooling/CI, integration, evidence and release
preparation. The all-rounder owns backend/terrain and ALL frontend implementation.
Later direct user requests authorized the frontend milestones `50b14ea` and `63bf0af`;
this is a scoped exception, not a transfer of general ownership. Earlier temporary
full-stack instructions and dated service/PID snapshots are historical.
Current done/pending/blocker list: [PROGRESS.md](PROGRESS.md), top section only.

## Current review milestone

The user authorized publishing the combined local history and README/review fixes
in one commit on `feat/p1-s0-integration`. Use the commit containing
[REVIEW_FOLLOWUP_2026-11-15.md](REVIEW_FOLLOWUP_2026-11-15.md), based on `6d334c4`
with published `b76ab21` already an ancestor. Verify the remote SHA and its hosted
CI before assuming publication or a green result. Deployment remains stopped.
The earlier no-push instructions and local-only route restrictions below describe
older checkpoints, not the current authorization.

## Earlier local merge recovery (historical)

Latest integration is local `c542e0b` plus published `b76ab21`, whose exact incoming
CI passed seven jobs on [43728281474](https://github.com/Moksh1112/Lunar_Landing_Site_Date_Comparator/actions/runs/43728281474).
[Current integration checks](INTEGRATION_B76AB21_2026-11-15.md): 201 frontend tests,
556 backend tests (six skips), lint/typecheck/build and seventeen scoped Chrome checks.
The watcher is resumed after the local commit. **Do not push; deployment is stopped.**
Earlier parent references below describe the prior merge. When transferring a bundle,
include this completed latest merge, so published `b76ab21` is its ancestor.

The incoming published P1 head is `89ce28c3905effa7c52abef06f7e5d9dd9f74923`,
verified green on [CI 43721206324](https://github.com/Moksh1112/Lunar_Landing_Site_Date_Comparator/actions/runs/43721206324)
(all seven jobs). The local side is `194aa94a77360743a940bebf60edc6da94106aef`.
The merge retaining both histories is described in [MERGE_RECOVERY_2026-11-15.md](MERGE_RECOVERY_2026-11-15.md).
**Do not push.** No hosted CI is claimed for the local combined revision.

The combined app keeps the tour at `/`, the dedicated `/terrain` analyser, gray
height shading, continuous scale slider and camera continuity. It also keeps the
incoming gap/explanation/offline briefing and single-flight submissions. The new
Compare result path has the same Plan B handoff revision guard as the old path.
Earlier UI checks: [UI_REVIEW_2026-11-15.md](UI_REVIEW_2026-11-15.md),
[TERRAIN_MOTION_2026-11-15.md](TERRAIN_MOTION_2026-11-15.md).

## Prior verified baseline (historical)

| Ref | SHA | Takeover finding |
| --- | --- | --- |
| `feat/p1-s0-integration` | `37211307b248da9b7c3e679a263afe0bbeb6d4b7` | Fast-forwarded from initial `38f72b7`; local P1 diff preserved |
| `feat/p2-p3-backend-terrain` | `7d6ac5554182a262991ff2369e9babb3534edf0a` | Already ancestor of P1 |
| `feat/p4-frontend-s0` | `6310e183bd0dfae672eca4e1fc6128594e248d4a` | Already ancestor of P1, merge `3721130` |
| preserved `frontend-landing` | `72de2893a031a8f34d3e90c943aef8c3524d114c` | Already ancestor; preserve branch |

The takeover snapshot's push-triggered P1 CI was [43702841533](https://github.com/Moksh1112/Lunar_Landing_Site_Date_Comparator/actions/runs/43702841533),
seven jobs SUCCESS at `3721130`. Owner CI `43687231193` and `43701473118` also passed.
The owner had already merged the concurrent frontend update; P1 reviewed source/CI
and fast-forwarded both checkouts. Refresh refs and CI before a later integration.
This subsection describes the earlier `3721130` checkpoint. The setup/CI takeover
changes were subsequently committed in `28b56e3`; the later UI commits are local
and unpushed. This older hosted result does not validate `63bf0af`.

## Work safely

```sh
git clone --branch feat/p1-s0-integration https://github.com/Moksh1112/Lunar_Landing_Site_Date_Comparator.git
cd Lunar_Landing_Site_Date_Comparator
git fetch origin
npm run setup
npm run hooks
```

For an existing checkout first inspect status/worktrees, preserve local changes and stop
only verified checkout-specific Python/Vite processes before setup. Do not clone over,
reset, clean or switch another owner's worktree. Setup-selected Python 3.12 venv works
on this host; target mode is the documented fallback if OS policy blocks launchers.

Kush / [kushpagariya](https://github.com/kushpagariya) is the likely all-rounder, based on
backend/terrain and frontend authorship; current activity is unconfirmed. User relays
coordination. Before any owner milestone, request exact source SHA, green CI and checks,
source modes, acceptance evidence and known limits. Do not impersonate their acceptance.
No teammate has been contacted by this takeover task.

## Startup and data

For an immediate explicitly synthetic demo: `npm run dev:s0`. The route list below
requires the current review milestone or a descendant. After its authorized push,
a fresh clone of that revision includes `/terrain`, the tour-at-Home change and
the later UI fixes. An older checkout at `89ce28c` or `b76ab21` lacks these local
additions; do not use it to reproduce the new UI evidence.

To obtain the local revision without pushing, have the holder of this checkout
create a bundle outside the repository, then transfer that file to the new machine:

```sh
# After completing the merge commit in this checkout (committed history only):
git bundle create ../azelux-p1-local.bundle feat/p1-s0-integration
# In a separate, clean clone, after receiving the bundle:
git bundle verify /absolute/path/azelux-p1-local.bundle
git fetch /absolute/path/azelux-p1-local.bundle feat/p1-s0-integration
git merge --ff-only FETCH_HEAD
npm run setup
npm run hooks
npm run dev:s0
```

Inspect status before updating an existing checkout. The fast-forward deliberately
stops if its history diverges; preserve that work rather than resetting it. The
bundle must include the completed merge, so the published head is its ancestor. Bundle
transfer publishes nothing to GitHub. A clone of the current review milestone
does not need a bundle; it still needs setup and separately acquired runtime data.

On the local revision, open `/` (Home), `/compare` (comparator), `/best-date`, `/terrain`, `/methods`, `/report`,
`/learn/simulator` and `/learn/tour`. Old `/landing`, `/landing/tour` and `/tour` links redirect.
Health: `http://127.0.0.1:8000/health`; frontend: `http://127.0.0.1:5173`.

A fresh clone was reproduced under ignored `work/takeover-clean-clone`; it has its own
installed dependencies and no copied env/config. Actual tests and source modes are in
[TAKEOVER_VERIFICATION_2026-11-15.md](TAKEOVER_VERIFICATION_2026-11-15.md).
Acquire runtime data using [NON_RELEASE_HANDOFF.md](NON_RELEASE_HANDOFF.md) with an
absolute non-cloud directory outside the repo. The takeover uses `R:/azelux-data`;
`C:/azx/data` is an old host-specific example, not a portable dependency.

Check real `/health` resource lists and compare provenance, not an absent banner.
Near tiles without a far DEM now return the honest TerrainUnavailable error (backend
`fd38ce5`); `terrain` always means near + far, as the contract defines.

## Evidence and next handoff

[The F1-F25 ledger](MVP_VERIFICATION.md) records partial acceptance. V4 remains FAIL
(~6.2989 pp, target <=5). Moksh's recorded V4b adoption is separate: its
validation-only any-fraction rule passes 10/10 within 5 pp, but does not validate
the runtime centre rule. See `backend/docs/V4_DECISION_2026-11-15.md`. V6 is a P2-owner qualitative spot check. The owner's corrected
240 h simulator browser outcome remains attributed to them. P1 has now independently
reproduced the same RED/GREEN and +210.1 h result through the full near+far API; that
API check does not replace their browser evidence or the remaining human/device review.

Use [RELEASE_PREPARATION.md](RELEASE_PREPARATION.md) for the architecture, demo steps,
known limits and submission drafts. Ask humans for physical-device, spoken screen-reader,
full manual alternate-browser/engine, slow-device and two independent usability
walkthrough evidence. Isolated Chrome/Brave checks are already recorded; they do
not complete these human/device requirements.

Honor human review/sync requirements and the user's explicit milestone instructions.
Commit locally only; **do not push** unless the user explicitly changes that instruction. Final deployment, main merge, release tags,
submission and MVP acceptance require Moksh's explicit release authorization.
Preserve untracked `.codex/` and other local configuration; no such files belong in the
milestone. Disclose actual AI help honestly where required; no invented authorship.
