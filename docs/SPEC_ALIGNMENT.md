# New-only Azelux alignment - 14 November 2026

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
| Repo has React 19 vs TRD React 18 | Frontend owner must migrate; integration does not alter product deps |
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
Backend source is unchanged and still health-only; frontend is unchanged and still
an empty scaffold. Mock API endpoints, typed client, source labels, product views,
SPICE, DEM services, validation scripts and data manifests need their owners.
Do not treat new fixture files or copies of PDFs as completed product features.

## Historical evidence
Archive preserves earlier files verbatim under docs/archive/. Stage reports are
revision-specific, not current blockers by default. Baseline 9339a0e CI passed all
six jobs (run 43578191183); this new alignment diff has not been published/run there.
No main merge/tag, deployments, source downloads, invitations or global settings edits.
