# Azelux — lunar site/date comparator

Compare two lunar scenarios for Sun/Earth visibility, terrain horizon and overlapping
windows. The integrated frontend provides Compare, Best Date, Methods, CSV/JSON
exports and a printable Report. No AI or database is part of the product.

## Start locally

Requirements: Node 20.19+, npm, uv and Python 3.12 (3.11 fallback supported by setup).

```sh
npm run setup
npm run hooks
npm run dev:s0
```

Open http://127.0.0.1:5173/; backend health is http://127.0.0.1:8000/health.
`dev:s0` explicitly selects synthetic frontend and backend modes; no NASA files are
needed. Fixture responses are fixed examples and do not reflect the coordinates or
dates submitted. Ctrl+C stops both modules.

On managed Windows where Application Control blocks venv launchers:

```powershell
$env:AZX_PYTHON_MODE = 'target'
npm run setup
npm run dev:s0
```

Target mode uses an approved base interpreter with isolated dependencies; it does not
change OS protections or install packages into system Python. No venv activation is
needed for npm checks. `npm run dev:all` honors configured environment settings and
can request real services; it is not a claim of real-data readiness.

## Dependencies and configuration

Backend authority: `backend/pyproject.toml` plus `backend/uv.lock`. Setup exports the
locked runtime/dev dependencies with uv and installs them with hashes into the
selected environment. Frontend dependencies use `frontend/package-lock.json` and
`npm ci`. React 19.2 is an approved tooling deviation; details in
[alignment](docs/SPEC_ALIGNMENT.md).

`.env.example` describes settings. Never commit real .env files, kernels, rasters,
caches or secrets. Set `AZX_DATA_DIR` to an absolute path outside cloud-sync folders
(e.g. `C:/azelux-data`) for actual datasets: gitignore does not prevent OneDrive sync.
Keep CORS origins exact. Do not mix localhost and 127.0.0.1 unintentionally.

## Checks

```sh
npm run check:setup
npm run check:fixtures
npm --prefix frontend run lint
npm --prefix frontend test -- --run
npm --prefix frontend run build
npm run check:backend
npm run check:startup
```

Stop the preview before `check:startup`; it needs ports 5173/8000 free and checks
startup/shutdown only. CI runs on all branch pushes and PRs: frontend, backend,
fixtures, attribution guard, secret scan and startup in venv/target modes. Data-dependent
backend tests may skip without datasets; skips do not validate real science.

## Current capabilities and limits

- Compare: A/B inputs and presets, panorama, aligned timelines, scrubber, metrics,
  verdicts, countdowns, Simple/Expert views and raw-data tables.
- Best Date: calendar/ranking and Load as Plan B; Methods: labelled validation
  artifacts; Report: CSV/JSON downloads and print styles.
- Map: schematic coordinate picker and library pins. Lunar basemap imagery and
  raster sign/georeferencing verification are unavailable; no Earth tiles are used.
  The coverage outline does not certify terrain availability for an arbitrary site.
- Current app preview is SYNTHETIC. The Methods artifact is a REAL-input,
  owner-reported Horizons spot check (one site, six times), not full V1/V2/V4.
- Runtime ephemeris is SPICE; Horizons is offline validation only. Deltas are A minus B.
  Geometric mode must say "geometric horizon only". Fixtures are never real data.
- 3D remains gated. No deployment, science acceptance or Sync pass is implied by CI.
- Planning/education aid only: no safety certification, wattage prediction or
  guaranteed communication link.

Owner print-engine evidence and screenshots are in `frontend/docs/`; P1's embedded
browser did not expose interactive print preview. See [progress](docs/PROGRESS.md)
for exact commits, independent checks and remaining tasks.

## Sources and ownership

Canonical documents: `docs/specs/` PRD v2.0, TRD v1.0, Playbook v4.1 and supplied kit;
API baseline: [contract](docs/CONTRACT.md). `docs/archive/` is historical.

P1 owns integration, shared tooling/CI, lockfiles and integration docs. The acting
frontend owner also has user-authorized supporting backend scope. Use separate
worktrees and the three existing remote branches: `feat/p1-s0-integration`,
`feat/p4-frontend-s0`, `feat/p2-p3-backend-terrain`. Never switch another owner's
working directory or merge into integration from an owner task.

Approved unblock decisions: [handoff](docs/FRONTEND_UNBLOCK_DECISIONS.md).
Validation artifact interface: [validation](validation/README.md).
Source provenance is required before real-data acceptance. Disclose actual AI
assistance where the event requires it; do not invent scientific or verification claims.
