# Start here - P1 takeover, 15 November 2026

P1 owns repository coordination, root tooling/CI, integration, evidence and release
preparation. The all-rounder owns backend/terrain and ALL frontend implementation.
Earlier temporary full-stack instructions and dated service/PID snapshots are historical.
Current done/pending/blocker list: [PROGRESS.md](PROGRESS.md), top section only.

## Verified baseline (takeover snapshot, historical)

Current heads, CI and the release status are in the top section of [PROGRESS.md](PROGRESS.md). The table below records the takeover starting point only.

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
The current P1 takeover diff is uncommitted; its new CI step has not run on GitHub.

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

For an immediate explicitly synthetic demo: `npm run dev:s0`. Routes: `/` home, `/compare` comparator, `/best-date`, `/methods`, `/report`,
`/learn/tour` (scroll tour) and `/learn/simulator` (optional simulator). Legacy `/landing`,
`/landing/tour` and `/tour` redirect with replace, keeping query and hash.
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
(~6.2989 pp, target <=5). V6 is a P2-owner qualitative spot check. The owner's corrected
240 h simulator browser outcome remains attributed to them. P1 has now independently
reproduced the same RED/GREEN and +210.1 h result through the full near+far API; that
API check does not replace their browser evidence or the remaining human/device review.

Use [RELEASE_PREPARATION.md](RELEASE_PREPARATION.md) for the architecture, demo steps,
known limits and submission drafts. Ask humans for physical-device, spoken screen-reader,
alternate-browser, slow-device and two independent usability walkthrough evidence.

Stop at the human diff-review/sync boundary before commit. Only reviewed P1 milestones
may be pushed to `feat/p1-s0-integration`. Final deployment, main merge, release tags,
submission and MVP acceptance require Moksh's explicit release authorization.
Preserve untracked `.codex/` and other local configuration; no such files belong in the
milestone. Disclose actual AI help honestly where required; no invented authorship.
