# Azelux - integration baseline
Two lunar site/date scenarios compared for Sun/Earth visibility. This repository
currently contains S0 scaffolds, not the Azelux product or a real science pipeline.
Live URL, screenshots, verified datasets and demo: pending. No AI/database in product.

## Ownership
P1/user: integration only. All frontend source belongs to frontend owner.
Backend/SPICE and terrain belong to their respective owners. Read docs/PROJECT.md.
The earlier root CONTRACT.md and fixtures are legacy proposals. New Azelux contract
adoption is pending team decisions in docs/CONTRACT_CHANGE_REQUESTS_S0.md.

## Setup
Install Node >=22.12 (24 is locally verified), npm, uv and Python 3.12 (3.11 is a
fallback via AZX_SETUP_PYTHON). The kit's Node 20/React 18 proposal conflicts with
this existing Node-compatible Vite/React 19 scaffold: frontend owner must decide,
not P1 silently change its stack. Install network access is required.

```sh
npm run setup
npm run hooks
npm run dev:all
```
Setup uses uv/Python 3.12, a hash-pinned backend requirements-lock.txt and npm ci.
Fallback without uv: set AZX_SETUP_PYTHON to a Python 3.11/3.12 executable.
Explicit overrides are version checked. No packages are installed into system Python.
Backend source remains requirements-based until backend owner supplies pyproject.toml
and P1 records an agreed uv.lock. No science dependencies are added by integration.

Backend http://127.0.0.1:8000/health; frontend http://127.0.0.1:5173 (blank S0 shell).
Ctrl+C stops modules. No credentials needed. Existing baseline does not yet load
Azelux env variables or implement mock API routes; names are reserved for owners.
Make aliases are available on systems with GNU Make; npm commands work in PowerShell.

## Managed Windows setup
The approved base Python 3.12.14 runs here, but Windows Application Control blocks
its generated venv launcher. An explicit target mode fixes local setup without
changing policy or system packages:
```powershell
$env:AZX_PYTHON_MODE = 'target'
npm run setup
npm run dev:all
```
POSIX equivalent: `AZX_PYTHON_MODE=target npm run setup`.
This installs hash-locked dependencies into ignored `.venv/target`, records the
selected base interpreter in `.venv/runtime.json`, and supplies PYTHONPATH only to
backend child processes. The setup flag is a shell variable; `.env` is not loaded
by setup. `AZX_SETUP_PYTHON` can specify an approved Python 3.11/3.12 interpreter.
Do not commit/copy runtime.json between machines. Rerun setup after moving the repo.

Standard mode remains the default for compatible hosts. Local target-mode setup,
Python 3.12 backend health, dual-module startup and graceful shutdown all passed.
`npm run check:startup` checks startup only, not a comparison journey.

## Checks
```sh
npm run check:setup
npm run check
npm --prefix frontend run build
npm run check:backend
npm run check:startup
```
These commands use the interpreter/dependencies selected by setup. They check
startup and status=ok, not the expanded Azelux
health contract, comparison journey or scientific accuracy.

CI runs on PRs/main and P1 integration branch pushes: lockfile installation,
backend startup, frontend type-check/build, attribution guard, history secret scan.
Backend owner lint/tests activate after pyproject handoff; frontend lint/test scripts
activate when supplied. Missing suites are announced, not claimed passed.
Initial baseline hosted CI passed all four jobs (run 43577940621). Follow-up CI
adds Python 3.12 startup checks for venv and target modes. See docs/STAGE_REPORT_AZELUX_S0.md.

## Environment defaults for future owner implementation
.env.example contains names only. Do not commit real .env files.
Backend defaults intended by TRD: AZX_DATA_DIR=./data; AZX_KERNEL_LIST supplied by
verified kernel manifest; near/far DEM supplied by terrain owner; AZX_CORS_ORIGINS
must list exact frontend origins; AZX_USE_MOCK=true for fixture development;
AZX_LOG_LEVEL=INFO. Frontend: VITE_API_URL=http://127.0.0.1:8000 and VITE_USE_MOCK=true
until real-source integration. Frontend owner handles frontend/.env.local loading.
Avoid localhost/127.0.0.1 origin mismatch. No runtime config is implemented by P1.

## Limits
All existing comparison fixture values are synthetic. SPICE/Horizons/LOLA are not
integrated. No landing-safety certification, watts or guaranteed communications.
