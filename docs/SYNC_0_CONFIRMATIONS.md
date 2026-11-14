# Azelux Sync 0 confirmations (new-only checklist)
S0 remains open. Do not use historical checklists from docs/archive/.

## Contract / fixtures
Backend drafts; frontend/terrain review; Coordinator approves; P1 records changes.
Read docs/CONTRACT.md (new kit v1.0) and CONTRACT_CHANGE_REQUESTS_S0.md.
Confirm A-minus-B deltas, UTC Unix series, Site nesting, SPICE runtime,
interpolated/censored windows and normal successful zero-visibility result.
Review generated synthetic fixtures, including corrected windows/gaps/sweep arithmetic,
verified=false mock sites and mock health. Explicitly resolve remaining C04-C08,
thresholds/timeouts, refined metadata and frontend date-shift mapping.

## Every active teammate
Send name/role, exact branch+commit, OS/Node/npm/Python versions, setup command/result,
module startup HTTP/output, tests actually run, hook result (`scripts/hooks`), contract
revision read, ownership accepted, and Ready for Sync 0 YES or exact blocker.
Frontend: acknowledge ALL frontend work including kit P1 shell/client/map.
Backend: acknowledge expanded health, Pydantic/mock endpoint scaffold, SPICE/metrics.
Terrain: confirm agreed importable interfaces with backend and download evidence.
Late helpers: confirm actual availability; no fabricated readiness required before arrival.

## Kernel owner
Official NAIF URLs, exact filenames/roles/coverage, download script+commit, status
per file, expected/downloaded bytes, SHA-256 for completed files, manifest excerpt,
load-test output or explicitly NOT RUN. Kit filenames are TO VERIFY, not proof.

## DEM owner
Official PGDA URLs/product IDs, exact near/far files, terms/attribution, script+commit,
per-file download progress and bytes/checksums. For available rasters: CRS WKT,
transform, dimensions/resolution, nodata, elevation units/reference and footprint.
S0 needs downloads started with evidence, not fictitious completed science validation.
No raw files in git. Partial downloads remain marked in progress.

## Repository owner / Coordinator
Names/role map, P5/P6 arrival, actual schedule, organizer deadline/rules verification,
host/domain access, reviewed green protected-main plan. This agent may not create/
merge/change main. Local/CI startup success does not itself pass the project gate.
