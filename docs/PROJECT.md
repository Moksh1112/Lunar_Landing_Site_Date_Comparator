# Azelux - current integration assignment

Current local merge: `194aa94` + published `89ce28c`, preserving both histories.
[Recovery/checks](MERGE_RECOVERY_2026-11-15.md); [single current work list](PROGRESS.md).
This includes the local `/terrain`/tour UI plus incoming gap/explanation/offline
briefing, single-flight submissions and near+far coverage correction. V4 remains
FAIL; Moksh's recorded V4b adoption is separate from runtime centre-rule validation.
Incoming source CI passed seven jobs; no combined hosted CI or push is claimed.
Older exact checkpoints below retain their original scope.


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
Earlier temporary full-stack assignments do not provide blanket implementation authority.
The later direct user requests explicitly authorized the frontend milestones `50b14ea`
and `63bf0af`; general frontend/backend ownership stays with the owners.
Do not create stage branches, reset worktrees, rebase away owner history, or re-merge
already integrated source. Preserve `frontend-landing` and all other existing branches.

## Product and current state

Browser -> FastAPI -> local SPICE + sourced terrain -> windows, metrics, A-minus-B
deltas and threshold verdicts. Horizons is offline validation only. No runtime AI/ML,
database, auth or uploads are required. Geometric horizon mode is explicit; source
labels and limitations must survive every view/export. No safety, watts or radio-link guarantee.

Latest local implementation: **`63bf0af552ca54c2abf26ad5f2d0f24d6da8d15c`** on
`feat/p1-s0-integration`. Preceding UI milestone `50b14ea` follows merge `ad2ac2e`,
whose parents are `28b56e3` and owner source `47d8a58`. The last verified published
baseline is `28b56e3`; local UI commits have not been pushed. Last recorded owner
source CI: [43707999082](https://github.com/Moksh1112/Lunar_Landing_Site_Date_Comparator/actions/runs/43707999082),
seven jobs successful for `47d8a58`. No hosted result is claimed for the local UI.
Refs/hosted CI were not refreshed during this documentation-only update.

Current routes:

| Route | Behavior |
| --- | --- |
| `/` | Tour landing page; Compare and Briefing actions |
| `/compare` | Plan editor/comparison, charts, provenance and exports |
| `/best-date` | Search dates; Load as Plan B stays here, then explicit Compare A and B |
| `/terrain` | Dedicated 3D Terrain Analyser with sky/horizon and timeline views |
| `/learn/simulator` | Optional Simulator with shared navbar |
| `/methods`, `/report` | Sources/validation/visual credits and printable comparison |
| `/learn/tour` | Alternate entry to the tour |

Legacy `/landing` redirects to Simulator; `/landing/tour` and `/tour` redirect to
`/learn/tour`, retaining query/hash. Terrain is no longer launched from Compare's
bottom buttons. It uses grayscale DEM-height shading, a continuous 1x-5x height
slider and a mission-time slider. Scaling preserves orbit/zoom/pan; Reset view or
another tile reframes. Earth follows response-derived directions, with a textured
marker and motion path. Source labels remain visible; visualization credits and
limits are consolidated in Methods.

Latest recorded validation: **163 frontend tests in 22 files**, lint, TypeScript and
production build pass at `63bf0af`; isolated Chrome/Brave REAL terrain/motion/camera
checks pass. Physical devices, full accessibility and final feature acceptance stay
open. See [TERRAIN_MOTION_2026-11-15.md](TERRAIN_MOTION_2026-11-15.md).

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
may be committed locally to P1. The current user instruction forbids pushing;
obtain a new explicit instruction before any push. Final deployment, main merge, tags, submission and final
MVP acceptance require Moksh's explicit release authorization. No gate advances by the
clock or green CI alone. Event timing and remaining submissions need human confirmation.
