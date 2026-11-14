# Lunar Landing Site-Date Comparator
## Goal
Compare two site/date scenarios, show date-shift impact and Sun/Earth/windows together.
Vite + React + TypeScript -> FastAPI + Python -> JPL Horizons and verified NASA LOLA where covered.
No AI, database, certified safety, watts or communication guarantees.

## Ownership and branches
| Person | Scope / folders | Branch |
| --- | --- | --- |
| 1 | Integration, scripts/, fixtures/, docs/, root configuration, CI, deploy, README | chore/integration-devops |
| 2 | Contract decisions, docs/evaluation/, docs/provenance/ | docs/contract-provenance |
| 3 | frontend/ except visualization/; React + TypeScript | feat/frontend-react-typescript |
| 4 | backend/ except terrain/; FastAPI + Python + Horizons | feat/backend-fastapi-python |
| 5 | frontend/src/visualization/ | feat/frontend-horizon-visualization |
| 6 | backend/app/terrain/ | feat/backend-lola-terrain |

Person 1 is sole editor of lockfiles, env example, CI and shared root files.
Person 2 approves contract changes; Person 1 records approved changes.
Use PRs; only green changes merge. Never force-push main.

## Stage gates (hours from kickoff)
S0 0-3 setup; S1 3-7.5 fixture journey; S2 7.5-15 real Horizons;
S3 15-21 P0 integration; S4 21-25.5 hardening/rc-1; S5 25.5-30 submission.
Stop at every sync. Actual kickoff/deadline and breaks unverified.

## Status
S0 PARTIAL / blocked; see docs/STAGE_REPORT_S0.md. Module scaffolds only; comparison journey not implemented.
Real: health endpoint only. Mocked: proposed comparison fixtures.
Horizons live access/interpretation and LOLA coverage: UNVERIFIED.
Sync 0 pending: Person 2 contract approval, teammates clone/start acknowledgments,
CI (scheduled S1 by user), remote branch protection and verified checks.
No sync-0 tag until gate passes. Later stages have not started.
