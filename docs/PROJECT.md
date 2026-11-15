# Azelux - current integration assignment

Canonical baseline: PRD v2.0, TRD v1.0, Playbook v4.1 under `docs/specs/` and
`docs/CONTRACT.md` v1.1 (v1.0 synthetic fixtures supported). Historical root documents
and `docs/archive/` are not runtime inputs or current blockers.

## Current ownership - user takeover instruction, 15 November 2026

| Owner | Scope | Existing branch |
| --- | --- | --- |
| P1 takeover | Repository coordination, root tooling, CI, shared locks/hooks, integration docs, evidence, QA and release preparation | `feat/p1-s0-integration` |
| All-rounder, P2/P3 | Backend application, terrain, data acquisition implementation and scientific investigation | `feat/p2-p3-backend-terrain` |
| All-rounder, P4/P5/P6 UI | ALL frontend source, including shell/client/map, simulator, views and exports | `feat/p4-frontend-s0` |
| Moksh / Coordinator | Contract clarification, sync/replanning, final release and MVP decision | Explicit authorization required |

Kush / `kushpagariya` is the history-based all-rounder identification: backend/terrain
commits `d5c137b`/`0856c14` and frontend `9901476`; GitHub maps `d5c137b` to that login.
Current editing activity is unknown. The user relays coordination; P1 sent no messages.
Earlier temporary full-stack assignments do not authorize takeover implementation.
Do not create stage branches, reset worktrees, rebase away owner history, or re-merge
already integrated source. Preserve `frontend-landing` and all other existing branches.

## Product and current state

Browser -> FastAPI -> local SPICE + sourced terrain -> windows, metrics, A-minus-B
deltas and threshold verdicts. Horizons is offline validation only. No runtime AI/ML,
database, auth or uploads are required. Geometric horizon mode is explicit; source
labels and limitations must survive every view/export. No safety, watts or radio-link guarantee.

Final fetch: P1 `3721130`, backend/terrain `7d6ac55`, frontend `6310e18` and additional
`frontend-landing` `72de289`. All owner heads are ancestors of P1. Latest hosted P1 run
[43702841533](https://github.com/Moksh1112/Lunar_Landing_Site_Date_Comparator/actions/runs/43702841533)
at `3721130` and frontend source run `43701473118` passed seven jobs. The owner had
already published the merge; P1 fast-forwarded without creating a new merge commit.

One current done/pending/blocker list lives at the top of [PROGRESS.md](PROGRESS.md).
Detailed feature evidence: [MVP_VERIFICATION.md](MVP_VERIFICATION.md).
Current reproduction: [TAKEOVER_VERIFICATION_2026-11-15.md](TAKEOVER_VERIFICATION_2026-11-15.md).
Startup/data: [NON_RELEASE_HANDOFF.md](NON_RELEASE_HANDOFF.md). Release materials:
[RELEASE_PREPARATION.md](RELEASE_PREPARATION.md). Dated acceptance records retain their
original revision scope; current CI never substitutes for device or scientific acceptance.

## Integration and review discipline

One coherent milestone at a time; stop at sync. Review exact source diff, contract and
green CI before integrating. Record source SHAs, checks, data modes and CI links; keep
owner-reported evidence attributed. Two failed fixes at a boundary require a blocker,
not repeated attempts or relaxed thresholds. V4's existing FAIL must remain visible.

Review every P1 diff with a human before committing (Playbook 4.3/5.2 and AGENTS.md).
Use the existing human identity, no AI author/coauthor/footer. Only reviewed milestones
may be committed/pushed to P1. Final deployment, main merge, tags, submission and final
MVP acceptance require Moksh's explicit release authorization. No gate advances by the
clock or green CI alone. Event timing and remaining submissions need human confirmation.
