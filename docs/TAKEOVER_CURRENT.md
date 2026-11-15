# Start here - P1 takeover, 15 November 2026

P1 owns repository coordination, root tooling/CI, integration, evidence and release
preparation. The all-rounder owns backend/terrain and ALL frontend implementation.
Later direct user requests authorized the frontend milestones `50b14ea` and `63bf0af`;
this is a scoped exception, not a transfer of general ownership. Earlier temporary
full-stack instructions and dated service/PID snapshots are historical.
Current done/pending/blocker list: [PROGRESS.md](PROGRESS.md), top section only.

## Current redesign integration

Published baseline is `28b56e3`. Local merge `ad2ac2e` preserves parents `28b56e3` and Moksh's theme source `47d8a58`; source CI [43707999082](https://github.com/Moksh1112/Lunar_Landing_Site_Date_Comparator/actions/runs/43707999082) passed seven jobs. The user explicitly requested the subsequent frontend milestone and a local commit: see [UI_TERRAIN_2026-11-15.md](UI_TERRAIN_2026-11-15.md) for its final route map, checks and repeat steps. **Do not push.** No hosted CI is claimed for the local UI revision. Earlier UI_POLISH/UI_RECOVERY notes describe intermediate snapshots; the dedicated `/terrain` page supersedes Compare's old terrain buttons.

Current review-fix follow-up (after `04c170d`): [UI_REVIEW_2026-11-15.md](UI_REVIEW_2026-11-15.md),
166 frontend tests and seven isolated Chrome checks. Camera distance now adapts to
viewport/relief while preserving the view angle, pan and relative zoom.

Prior implementation checkpoint: `63bf0af552ca54c2abf26ad5f2d0f24d6da8d15c`.
Latest analyser follow-up: [TERRAIN_MOTION_2026-11-15.md](TERRAIN_MOTION_2026-11-15.md).
Height shading is gray only; the continuous slider preserves the user's camera. Earth
motion is traced from real response positions. Checks at that prior checkpoint: 163 tests plus
lint/typecheck/build. Preserve the no-push instruction.

## Prior verified baseline (historical)

| Ref | SHA | Takeover finding |
| --- | --- | --- |
| `feat/p1-s0-integration` | `37211307b248da9b7c3e679a263afe0bbeb6d4b7` | Fast-forwarded from initial `38f72b7`; local P1 diff preserved |
| `feat/p2-p3-backend-terrain` | `7d6ac5554182a262991ff2369e9babb3534edf0a` | Already ancestor of P1 |
| `feat/p4-frontend-s0` | `6310e183bd0dfae672eca4e1fc6128594e248d4a` | Already ancestor of P1, merge `3721130` |
| preserved `frontend-landing` | `72de2893a031a8f34d3e90c943aef8c3524d114c` | Already ancestor; preserve branch |

Latest push-triggered P1 CI is [43702841533](https://github.com/Moksh1112/Lunar_Landing_Site_Date_Comparator/actions/runs/43702841533),
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
requires the **local implementation revision `63bf0af` or a descendant**. A fresh
clone of the last verified published baseline `28b56e3` does **not** contain
`/terrain`, the redesigned Home/nav or the later Best Date and Simulator flow fixes;
do not use that clone to reproduce the local UI evidence.

To obtain the local revision without pushing, have the holder of this checkout
create a bundle outside the repository, then transfer that file to the new machine:

```sh
# In this local checkout (committed history only; no runtime data/config):
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
stops if its history diverges; preserve that work rather than resetting it. Bundle
transfer publishes nothing to GitHub. Without the bundle, `/terrain` and those
local UI revisions remain unavailable in a fresh published-branch clone.

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
Near tiles alone currently return mode `terrain` without a far DEM: a recorded
backend/contract issue. Do not treat that as complete near+far acceptance.

## Evidence and next handoff

[The F1-F25 ledger](MVP_VERIFICATION.md) records partial acceptance. V4 remains FAIL
(~6.2989 pp, target <=5). V6 is a P2-owner qualitative spot check. The owner's corrected
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
