# Azelux backend

FastAPI service that answers one question: for two lunar sites/dates, when are the Sun and Earth above the
local horizon (terrain-aware near the south pole)? Contract: [`../docs/CONTRACT.md`](../docs/CONTRACT.md)
(v1.0). Planning and education aid only; not a landing-safety tool.

## Setup

Python 3.12 (3.11 works). Dependencies are locked in `uv.lock` (hash-pinned `requirements-lock.txt` is what
`npm run setup` installs).

```sh
npm run setup            # from the repo root: installs the locked backend deps (and the frontend)
npm run dev:all          # backend on http://127.0.0.1:8000, frontend on :5173
```

**Windows with Application Control** (virtualenv launchers are blocked): use the target mode. It installs
into the ignored `.venv/target` folder and passes `PYTHONPATH` to the backend only; nothing goes into system
Python.

```powershell
$env:AZX_PYTHON_MODE = 'target'
npm run setup
npm run dev:all
```

POSIX: `AZX_PYTHON_MODE=target npm run setup`. `AZX_SETUP_PYTHON` can point at an approved 3.11/3.12
interpreter. The root `README.md` has the full story.

Run the API by hand (from `backend/`, with the dependencies importable):

```sh
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

## Configuration (environment variables, prefix `AZX_`)

Names only in `../.env.example`; real values are never committed. Defaults:

| Variable | Default | Meaning |
|---|---|---|
| `AZX_DATA_DIR` | repo `data/` (use an absolute path outside OneDrive, e.g. `C:/azelux-data`) | Data root: `kernels/`, `dem/`, `tiles/`, `cache/` |
| `AZX_USE_MOCK` | `false` | `true` serves the contract fixtures (`data_label: "SYNTHETIC"`), needs no data |
| `AZX_KERNEL_LIST` | naif0012.tls, de440s.bsp, pck00011.tpc, moon_pa_de440_200625.bpc, moon_de440_250416.tf | Comma-separated SPICE kernels in `kernels/` |
| `AZX_DEM_NEAR` / `AZX_DEM_FAR` | `LDEM_80S_20MPP_ADJ.TIF` / `far_160m.tif` | DEM file names |
| `AZX_CORS_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` | Exact origins, comma-separated; `*` is rejected |
| `AZX_LOG_LEVEL` | `INFO` | JSON log lines on stderr, one per request, with `request_id` |
| `AZX_RATE_LIMITS_ENABLED` | `true` | Per-IP, sliding 60 s: compare 30/min, sweep 6/min |
| `AZX_RATE_LIMIT_COMPARE_PER_MIN`, `AZX_RATE_LIMIT_SWEEP_PER_MIN` | 30, 6 | The limits |
| `AZX_TRUST_FORWARDED_FOR` | `false` | Use `X-Forwarded-For` as the client IP; only behind a trusted proxy |
| `AZX_WARM_UP` | `true` | Real mode: preload GDAL, the far DEM and the compare pipeline in a background thread |

## Endpoints

All under the contract error shape `{"error": {"code", "message", "details": [{"field", "reason"}]}}`.

| Route | Purpose | Errors |
|---|---|---|
| `GET /health` | status, kernels and DEMs actually loaded, `mock` flag | |
| `GET /api/v1/sites` | curated site library | |
| `POST /api/v1/compare` | two scenarios A/B: skyline, Sun/Earth series, windows, metrics, verdict, deltas | 400, 404 unknown `site_id`, 413, 429 |
| `POST /api/v1/sweep` | best start date in a range (up to 183 days), top 5 refined | 400, 404, 413, 429 |
| `GET /api/v1/skyline?lat_deg&lon_east_deg[&observer_height_m]` | 720-bin horizon | 400, 422 `NOT_IN_COVERAGE` |
| `GET /api/v1/terrain-tile?lat_deg&lon_east_deg[&size_km]` | 256x256 float32 height tile | 400, 422 |

Input rules worth knowing: `|lat| <= 89.99`, `0 <= lon < 360`, `start_utc` is `YYYY-MM-DDTHH:MM:SS[.f]Z`
(UTC, `Z` only), mission 1 to 8,760 h, `step_minutes` 1 to 60, at most 60,000 samples per scenario, body at
most 64 KB, unknown fields rejected, dates limited to 1970-01-01 .. 2149-12-31 (the DE440s span; pre-1970 is
blocked by a Windows-only formatting bug, see `docs/SECURITY_AUDIT_S4.md`). Unknown-but-valid-looking
`site_id` gives 404. Interactive docs are served at `/docs`.

## Data: download and prepare

Mission data is not in git. Use an absolute path outside OneDrive. From the repo root:

```sh
python scripts/download_kernels.py --data-dir C:/azelux-data          # ~46 MB of SPICE kernels
python scripts/download_dems.py   --data-dir C:/azelux-data [--skip-20m] [--pgda69]
# derived products (need the backend packages on the path):
PYTHONPATH="C:/azelux-pkgs;backend" python scripts/prepare_dems.py --data-dir C:/azelux-data --far --hillshade
PYTHONPATH="C:/azelux-pkgs;backend" python scripts/prepare_dems.py --data-dir C:/azelux-data --tiles      # needs the 20 m DEM
PYTHONPATH="C:/azelux-pkgs;backend" python scripts/precompute_skylines.py --data-dir C:/azelux-data
```

Without the 20 m tiles the server runs in `terrain_coarse` (160 m) mode; north of -80.7 degrees it is
`geometric`. Each response says which (`meta.horizon_mode`, `meta.dem`, `limitations`).

## Tests

From `backend/` (adjust `PYTHONPATH` to wherever your dependencies live; in target mode that is
`../.venv/target`):

```sh
export PYTHONPATH="C:/azelux-pkgs;." PYTEST_DISABLE_PLUGIN_AUTOLOAD=1 PYTHONDONTWRITEBYTECODE=1 AZX_DATA_DIR=C:/azelux-data
python -m pytest -q -p no:cacheprovider          # everything
python -m pytest -q -p no:cacheprovider tests/test_break_it.py    # hostile-input pass on every endpoint
python -m ruff check --no-cache app tests tools
```

Tests that need the kernels or DEMs skip when `AZX_DATA_DIR` has no data (CI); everything else runs on the
mock fixtures. As of S4: 533 passed with real data.

## Mock vs real

`AZX_USE_MOCK=true` (or a machine without data) serves `fixtures/*.ok.json`: fixed, labelled `SYNTHETIC`, same
shape as real. Validation runs before the mock/real switch, so bad input fails identically in both. Real mode
is `data_label: "REAL"`: SPICE DE440 positions, DEM horizon from the 160 m (and, when present, 20 m) terrain.

## Deploy and the data subset

`docs/DEPLOY.md` covers the Dockerfile, the environment table for hosts, the 87 MB data subset copied into the
image (kernels, far DEM, hillshade, skyline cache; not the 1.5 GB source DEM), image-size estimate and
health-check settings. Behind a proxy set `AZX_TRUST_FORWARDED_FOR=true` and `AZX_CORS_ORIGINS` to the
production frontend origin. The host should add security headers (see `docs/SECURITY_AUDIT_S4.md`).

## Layout

```
app/main.py            app factory, CORS, request-ID/logging middleware, warm-up start
app/api/               routes, contract models, error handlers, limits (body cap, rate limit)
app/ephemeris/         SPICE kernels and Sun/Earth az-el series (one lock; SPICE is not thread-safe)
app/terrain/           skyline and tile providers (mock, real), DEM sampling
app/metrics/           windows, metrics, verdict (TRD 5)
app/compare/, app/sweep/   the two pipelines
app/sites/             curated site library
tests/, tools/         pytest suite; analysis helpers
```
