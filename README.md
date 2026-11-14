# Azelux - integration baseline
Two lunar site/date scenarios compared for Sun/Earth visibility. This repository
currently contains S0 scaffolds, not the Azelux product or a real science pipeline.
Live URL, screenshots, verified datasets and demo: pending. No AI/database in product.

## Ownership
P1/user: integration only. All frontend source belongs to frontend owner.
Backend/SPICE and terrain belong to their respective owners. Read docs/PROJECT.md.
Only the new Azelux approach is active. Root PROJECT.md/CONTRACT.md are entry-point
links to docs/PROJECT.md and docs/CONTRACT.md. Earlier proposals/fixtures are historical
only in docs/archive/pre-azelux/. Do not build against them.
Source PRD/TRD/playbook and original kit: docs/specs/ (checksummed copies).
New contract is adopted as the baseline; team freeze and open clarifications remain
in docs/CONTRACT_CHANGE_REQUESTS_S0.md. Role prompts: prompts/.

## Setup
Target tooling from TRD: Node 20 (20.19+ required by existing Vite), npm, uv and
Python 3.12 (3.11 fallback via AZX_SETUP_PYTHON). CI now follows Node 20; local Node
24 startup was previously verified. React 18 is the new frontend target; the existing
React 19 empty scaffold awaits frontend owner's migration. Integration has not
changed frontend product files or lockfile. Install network access is required.

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
All active fixture values/coordinates are synthetic. SPICE/LOLA runtime and Horizons
offline validation are not
integrated. No landing-safety certification, watts or guaranteed communications.

## New-only specification alignment
See docs/SPEC_ALIGNMENT.md for the full old-to-new mapping and deliberate overrides.
Runtime target is SPICE with verified LOLA terrain; Horizons is validation-only.
Deltas are A minus B. No backend export/validate HTTP endpoints: report/CSV/JSON
are frontend responsibilities; validation outputs are files imported by Methods.
The actual backend currently exposes only baseline liveness; this is not a claim
that its API already conforms to the new contract.

Fixtures: `npm run fixtures` regenerates 15 new-kit synthetic examples;
`npm run check:fixtures` checks independent invariants and reproducibility.
Do not use invented sites for the real demo. Mock site records have verified=false.
The mock frontend must distinguish preview data without weakening verified-site rules.
Source ambiguities (including refined sweep metadata/transport labels) stay explicit.
No sync-0 tag or later-stage work until the real gate passes.

Python-backed npm checks and fixture commands use scripts/python.mjs and the
interpreter recorded by setup; no bare python executable or venv activation is needed.
Run npm run setup first. Direct CI Python invocations use actions/setup-python.

## Backend dependency handoff (canonical source)
Backend owner declares runtime/dev dependencies in backend/pyproject.toml and
supplies backend/uv.lock for coordinated P1 review. Once both exist, they are the
ONLY backend dependency authority for npm setup, target mode and CI. Setup performs
`uv export --locked --no-emit-project` to an ignored work/ export, then hash-checked
installation into the selected environment. The export is derived, never edited.
Default dev dependencies are included so owner checks use the same set.
A missing/stale lock or only one handoff file is an error, not a fallback.
Until BOTH files arrive, requirements-lock.txt is explicitly scaffold-only. Do not
maintain parallel production requirement files. Backend source is run via --app-dir;
packaged/local workspace build requirements need an explicit owner handoff.
CI owner tests use the root environment with --locked --no-sync. uv is pinned to
0.12.5 in CI; owner using 0.13 must demonstrate lock compatibility or request a
coordinated tooling update. CI runs on all branch pushes and PRs.

## Data outside cloud-sync folders
Git ignore does NOT stop OneDrive/iCloud/Dropbox syncing. Before any downloads,
choose an absolute non-synced path and confirm space/source content lengths.
PowerShell example (choose a location writable on your machine):
```powershell
$env:AZX_DATA_DIR = 'C:/azelux-data'
```
macOS example: `export AZX_DATA_DIR="$HOME/azelux-data"` (verify it is not synced).
These are examples, not directories created by integration. Setup does not load
.env; backend/download owners must explicitly support this variable. Downloaders
must receive the SAME path as server settings. Never start large downloads assuming
./data is outside OneDrive. Report actual sizes/checksums, not raster-size estimates.
Our launcher normalizes an explicit relative AZX_DATA_DIR against repository root;
backend standalone scripts/settings must also anchor paths independently of cwd.
Canonical fixtures live at repo-root fixtures/, not backend/fixtures/.
See docs/BACKEND_TERRAIN_HANDOFF_S0.md for the required backend/terrain decisions.
