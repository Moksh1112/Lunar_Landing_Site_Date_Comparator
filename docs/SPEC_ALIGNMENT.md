# New-only Azelux alignment - 14 November 2026

## Current authority

The 15 November takeover instruction assigns P1 integration, root tooling, CI,
coordination, acceptance evidence and release preparation only. The all-rounder
owns backend/terrain and ALL frontend implementation on the two existing owner
branches. Earlier temporary full-stack authorization is historical and does not
authorize general P1 implementation now. Later direct user requests authorized
the scoped UI work committed in `50b14ea` and `63bf0af`; frontend/backend ownership
otherwise remains unchanged. Keep the three existing branches; do not create
stage branches. Human diff review precedes a commit. Final deployment, main merge,
tags, submission and MVP acceptance require Moksh's explicit release authorization.
Current status: PROGRESS.md; takeover procedure: TAKEOVER_CURRENT.md.
Latest user instruction: commit locally only; do not push.

## Precedence and provenance
User selected existing repo, P1 integration ONLY, frontend with frontend owner,
no main changes, S0 only. These override template role/setup commands.
Then: new PRD v2.0 (scope), TRD v1.0 (technical detail), Playbook v4.1 (workflow),
docs/CONTRACT.md (new kit API baseline). Supplied originals/hashes: docs/specs/.
Neither the earlier root contract nor old docs/contract-provenance branch is an
active specification. Original new kit preserved unchanged as reference ZIP;
active scripts/prompts contain the corrections and overrides described below.

| Old approach / source clash | Active new baseline / resolution |
| --- | --- |
| Horizons on runtime request path | Local SPICE ephemeris, Horizons offline validation only |
| Older latitude_deg/longitude_east_deg/duration_hours schema | Site.lat_deg/lon_east_deg, mission_hours and new kit compare/sweep structures |
| B-minus-A deltas / sampled left intervals | A-minus-B and interpolated/censored windows per TRD |
| No data always error | Valid zero-visibility compare is normal success with empty windows |
| Optional terrain for core demo | Verified LOLA terrain required for core polar demo, truthful coarse/geometric coverage modes |
| Earlier Person 2 contract role | New kit P2 backend+contract draft; user/P1 integrates shared accepted changes |
| Kit P1 frontend shell/client/map | All frontend transferred to frontend owner by user override |
| New public azelux repo requested by template | Existing repo retained; package display name Azelux, no remote rename/new repo |
| Kit POSIX-only Make setup | Cross-platform npm commands; Make aliases retained; target-mode Python setup works on managed Windows |
| Kit CI invalid job-level hashFiles / no first-push handling | Keep proven CI fixes; new Node 20 target, fixture and venv/target startup checks |
| .env.example with values vs names-only TRD rule | Names-only example, documented defaults, setup shell flags separate |
| Repo has React 19 vs TRD React 18 | React 19.2.0 retained by the later explicit tooling decision below |
| CI S1 / old 30h schedule | CI S0; eight-stage new playbook gates; actual restart times need Coordinator confirmation |
| Two competing v1.0 contracts | Only docs/CONTRACT.md active; root is pointer; pre-Azelux version archived |

## Supplied fixture corrections (P1 shared fixture scope)
Regenerator follows TRD window-edge interpolation and censored flags; combined
windows intersect target intervals. Metrics/gaps derive from those same endpoints.
Sweep combined % derives from combined hours/708 h. Invented sites are verified=false.
Mock health supplies empty loaded-resource arrays and mock=true; it makes no real
source claim. No unapproved data_label fields were added to schemas that omit them.
Fixture checker verifies arithmetic/geometry invariants and deterministic generation,
not scientific accuracy or implemented API contract conformance.
New kit open issues remain in CONTRACT_CHANGE_REQUESTS_S0.md; adoption is not freeze.

## Runtime implementation boundary

The health-only backend and empty frontend were the initial S0 state, not the
current implementation. Real SPICE/DEM comparisons, sweeps, maps, exports/report,
Simulator and the dedicated Terrain Analyser are integrated. Current implementation
and evidence scope are in [PROJECT.md](PROJECT.md) and [MVP_VERIFICATION.md](MVP_VERIFICATION.md).
Fixture generation is still SYNTHETIC evidence, not scientific validation. V4 remains
FAIL; implementation and green CI do not establish final acceptance.

## Historical evidence
Archive preserves earlier files verbatim under docs/archive/. Stage reports are
revision-specific, not current blockers by default. Baseline 9339a0e CI passed all
six jobs (run 43578191183); this new alignment diff has not been published/run there.
No main merge/tag, deployments, source downloads, invitations or global settings edits.

## 15 November 2026 user-authorized integration decisions

Current implementation supersedes the historical health-only/scaffold description.
Backend 0856c14 and frontend 53221dd are integrated. React 19.2.0 is retained as an
explicit tooling deviation from TRD 18. Map dependencies, verdict float tolerance,
audit remediation and C03-C09 target decisions are approved in
FRONTEND_UNBLOCK_DECISIONS.md. Build-time validation interface: validation/README.md.
These approvals unblock frontend work; they do not certify scientific data or pass
team stage gates. Version 1.1 additions are now activated after matching consumer checks; v1.0 fixtures remain supported.

## Temporary full-stack execution (historical, superseded by takeover above)
User authorized the integration agent to perform P1-P6 engineering while teammates
are away. Keep the same three branches and owner worktrees; publish verified handoffs
as work proceeds. Release/deployment remains reserved for the user. This overrides
older integration-only/S0-only limits for this assignment, not truthful data labelling,
required validation, safety disclaimers, or source provenance.
