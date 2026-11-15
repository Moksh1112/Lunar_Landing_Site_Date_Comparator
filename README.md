# Azelux - lunar site/date comparator

Compare two lunar plans using local SPICE ephemeris and sourced terrain horizons.
The comparator provides panoramas, timelines, shared playback, Best Date, provenance,
CSV/JSON, offline HTML briefings and a printable report. The tour is the default landing page at `/`; comparison is `/compare`, and the dedicated terrain analyser is `/terrain`. The
Briefing button opens the simulator through `/landing` (redirecting to
`/learn/simulator`). The tour also remains available at `/learn/tour`.
No runtime AI, database, authentication or uploads are required in v1.

## Start locally

Requirements: Node 20.19+, npm, uv and Python 3.12 (3.11 fallback supported).

```sh
npm run setup
npm run hooks
npm run dev:s0
```

Open http://127.0.0.1:5173/; health is http://127.0.0.1:8000/health.
`dev:s0` explicitly selects SYNTHETIC frontend/backend fixtures. Their fixed results
do not reflect submitted inputs. Ctrl+C stops both modules. Stop running Python/Vite
processes belonging to this checkout before rerunning setup; Windows can lock their files.
The proposed setup fix preserves an existing venv; CI checks repeat setup in both modes.

On managed Windows where generated venv launchers are blocked:

```powershell
$env:AZX_PYTHON_MODE = 'target'
npm run setup
npm run dev:s0
```

Target mode isolates dependencies without changing OS protections. Setup records the
selected interpreter; no manual activation is needed for npm checks.

## Real data and reproducibility

A clone contains no runtime kernels, DEMs or acquired imagery. Set `AZX_DATA_DIR` to
an absolute non-cloud directory outside the repository, for example `R:/azelux-data`.
Follow [data acquisition and real startup](docs/NON_RELEASE_HANDOFF.md), then verify
actual `/health` resource lists and response provenance. `mock=false` alone does not
prove terrain readiness. Do not reuse another machine's local configuration or data paths.

The takeover reproduced real geometric and near+far polar comparisons from freshly
acquired data, including a 60-day terrain sweep. Near-only startup also exposed a
`terrain` mode/contract mismatch when far terrain was absent; `fd38ce5` fixed it (TerrainUnavailable). Remaining acceptance is tracked
in [the current progress board](docs/PROGRESS.md); detailed checks are in
[the takeover verification](docs/TAKEOVER_VERIFICATION_2026-11-15.md).

## Checks and dependency authority

```sh
npm run check:setup
npm run check:fixtures
npm run check:dependencies
npm run check
npm --prefix frontend run lint
npm --prefix frontend test -- --run
npm --prefix frontend run build
npm run check:backend
npm run check:startup
```

Stop previews before `check:startup`; it needs ports 5173/8000 free. It checks synthetic
startup/shutdown, not feature or scientific acceptance. Full backend lint/tests use:

```sh
node scripts/python.mjs -m ruff check backend
node scripts/python.mjs -m pytest -c backend/pyproject.toml backend/tests -q -rs
```

Backend dependency authority is `backend/pyproject.toml` plus `backend/uv.lock`;
frontend uses `frontend/package-lock.json`. Setup uses locked, hashed installs.
CI has seven jobs, including synthetic startup in venv/target modes. Dataset-dependent
skips do not validate science. Configuration names: `.env.example`; never commit actual
env files, secrets, kernels, rasters or caches. Use exact CORS origins.

## Methods, limits and ownership

SPICE is runtime ephemeris; Horizons is offline validation only. Deltas are A minus B.
Results must identify REAL/SYNTHETIC and actual terrain/coarse/geometric provenance;
geometric mode is labelled "geometric horizon only". NASA SVS context imagery is for
visualization, not science. Terrain 3D is optional; 2D remains available.

V1/V2 live checks and V3/V5 mathematical checks are recorded; V6 is a P2-owner qualitative
spot check. V4 remains FAIL (~6.2989 percentage points, target <=5). This is a planning
and education aid: no landing-safety certification, watts or guaranteed communications.
See [F1-F25 evidence](docs/MVP_VERIFICATION.md) and [release draft](docs/RELEASE_PREPARATION.md).
Green CI does not pass an MVP or release gate.

P1 owns root tooling, CI, shared locks and integration docs. The all-rounder owns ALL
backend/terrain and frontend implementation. Keep `feat/p1-s0-integration`,
`feat/p2-p3-backend-terrain`, `feat/p4-frontend-s0` and preserve other branches/local edits.
Human diff review precedes commit. Current user instruction: commit locally only; no push.
Deployment, main merge, tags, submission and final
acceptance require Moksh's explicit release authorization.

Canonical scope: `docs/specs/` PRD v2.0, TRD v1.0 and Playbook v4.1;
API: [docs/CONTRACT.md](docs/CONTRACT.md); overrides: [alignment](docs/SPEC_ALIGNMENT.md).
Root pointer files and `docs/archive/` are not active specifications. Disclose actual AI
assistance honestly where required without inventing authorship or verification claims.
