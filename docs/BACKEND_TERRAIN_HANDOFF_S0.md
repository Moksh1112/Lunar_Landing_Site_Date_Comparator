# Backend + terrain S0 handoff
## Integration decisions implemented
- pyproject.toml + uv.lock become canonical atomically when both supplied; P1 records
  lock changes with owner coordination. requirements-lock is temporary scaffold-only.
- Setup/CI install locked exported dependencies, including default dev group. No
  silent fallback for missing/stale owner lock. uv 0.12.5 currently pinned in CI.
- Branch pushes now trigger CI without first opening a PR. Mock mode is enabled
  for backend/launcher checks; no kernel downloads needed for those tests.
- Explicit AZX_DATA_DIR normalized by launcher to absolute. No downloads or external
  data-directory creation performed; owner must honor env in scripts/settings.

## Owner actions before claiming Sync 0
Supply pyproject+uv.lock, backend scaffold/models/mock endpoint status/tests,
terrain interface agreement, and actual kernel/DEM download/manifest evidence.
Use an absolute non-cloud-synced data directory for all download/server commands.
3.7GB/230MB DEM numbers in teammate note are estimates, NOT verified file sizes.
Check authoritative file/response sizes, available disk and extraction/cropping space.

## Contract and science decisions still needing evidence
C04 sample cap/grid; C05 sites/health data labels; C08 actual coverage/fallback,
full required neighborhood near tile edges, tile extent and export provenance.
Define projected grid north versus true local north, terrain tile transform/axis
orientation and Sun-lighting conversion for frontend; do not assume they coincide.
Name owner/script/source for PGDA69 reference downloads (needed V4), with terms,
metadata/coverage, rather than claiming these files are acquired.
Test exact contract UTC strings with Z through the installed SPICE version and
record result; this is currently an unverified compatibility check, not an error.
Resolve data/fixture paths from stable project/module location; test repo-root and
backend-cwd runs give identical resources. CI owner tests run from backend/.
Keep processed manifest writes coordinated to avoid kernel/DEM writer races.

## Resource ownership / schedule
One teammate owns P2+P3, so the source fallback 'P2 joins P3' supplies no extra person.
Coordinator must name another reviewer/helper or revise the escalation plan.
Recommend prioritizing V3 early in S1, with explicit Coordinator update; P1 is not
starting S1 or inventing a backup person. P6 and Coordinator assignments still open.

## Already settled new-baseline concepts
SPICE runtime/Horizons offline validation, A-minus-B, normal zero visibility,
three terrain modes, synthetic labels. Specific ambiguities remain tracked in
CONTRACT_CHANGE_REQUESTS_S0.md; no implied full contract freeze or REAL result.
