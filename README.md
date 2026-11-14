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

## Known local setup blocker
Windows Application Control blocks the generated .venv/Scripts/python.exe for
Python 3.12 on this machine. npm run setup stops and reports it. Do not disable
security policy. Use an approved environment/administrator-approved runtime.
The installed system Python 3.13 can verify baseline health, but is NOT acceptance
of the target Python version. Full make dev/npm run dev:all is not claimed passed.
The previous Rollup error did not reproduce here: the existing frontend builds and serves.

## Checks
```sh
npm run check:setup
npm run check
npm --prefix frontend run build
python scripts/check_backend.py
```
Use a supported configured backend interpreter for the last command; it needs the
backend dependencies. This checks startup and status=ok, not the expanded Azelux
health contract, comparison journey or scientific accuracy.

CI runs on PRs/main and P1 integration branch pushes: lockfile installation,
backend startup, frontend type-check/build, attribution guard, history secret scan.
Backend owner lint/tests activate after pyproject handoff; frontend lint/test scripts
activate when supplied. Missing suites are announced, not claimed passed.
Hosted CI has not run for this uncommitted S0 work. See docs/STAGE_REPORT_AZELUX_S0.md.

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
