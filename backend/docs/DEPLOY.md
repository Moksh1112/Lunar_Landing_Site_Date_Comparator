# Backend deployment (Docker)

Target: Render / Railway / Fly, one container (TRD 8.4). Image budget: under 1 GB.

## Build and run

Mission data is not in git. It is supplied as a BuildKit named context and only a subset is copied.
Build from the repo root:

```
docker build -f backend/Dockerfile --build-context data=C:/azelux-data -t azelux-backend .
docker run --rm -p 8000:8000 azelux-backend
curl http://localhost:8000/health
```

On a CI/host, point `data=` at wherever the data folder lives (for example `data=/srv/azelux-data`).
Dependencies come from `backend/uv.lock` via `uv export --locked --no-dev` (uv 0.12.5, same as CI).
Mock mode needs no data: `docker run -e AZX_USE_MOCK=true -p 8000:8000 azelux-backend`.

## Environment variables

| Variable | Default in image | Meaning |
|---|---|---|
| `PORT` | 8000 | Listen port (Render/Railway set it) |
| `AZX_DATA_DIR` | `/data` | Data root (kernels/, dem/, tiles/, cache/) |
| `AZX_USE_MOCK` | `false` | Serve fixtures instead of computing |
| `AZX_CORS_ORIGINS` | localhost:5173 | Comma-separated exact origins; set to the production frontend origin. `*` is rejected |
| `AZX_RATE_LIMITS_ENABLED` | `true` | Per-IP limits: compare 30/min, sweep 6/min (`AZX_RATE_LIMIT_COMPARE_PER_MIN`, `AZX_RATE_LIMIT_SWEEP_PER_MIN`) |
| `AZX_TRUST_FORWARDED_FOR` | `false` | Use the first `X-Forwarded-For` entry as the client IP. Set `true` only behind a trusted proxy (Render/Railway/Fly all are), otherwise every user shares the proxy's IP and one limit |
| `AZX_WARM_UP` | `true` | Preload DEM libraries in a background thread at start |
| `AZX_LOG_LEVEL` | `INFO` | |

Requests with a body over 64 KB get 413 `RANGE_TOO_LARGE`. Exceeding a rate limit gives 429 `RATE_LIMITED` with `Retry-After`.

## Data subset copied into /data (measured 2026-11-14)

| Path | Bytes |
|---|---|
| `kernels/` (5 files: de440s.bsp, naif0012.tls, pck00011.tpc, moon_pa_de440_200625.bpc, moon_de440_250416.tf) | 45,745,465 |
| `dem/far_160m.tif` | 36,909,329 |
| `dem/south_pole_hillshade_2048.png` + `.json` | 4,181,018 |
| `cache/` (4 precomputed skylines) | 55,376 |
| `tiles/*.tif` (20 m near-field tiles) | TBD (not produced yet) |
| Total measured | 86,891,188 (about 83 MiB) |

Never copied: `dem/LDEM_80S_20MPP_ADJ.TIF` (about 1.5 GB source), `dem/LDEM_80S_80MPP_ADJ.TIF` (189 MB), `illumination/`.
If `tiles/` is absent the build still succeeds (the COPY uses a glob next to `MANIFEST.json`) and the server runs in
`terrain_coarse` mode from the 160 m DEM.

## Image size estimate vs 1 GB budget

- python:3.12-slim base: about 0.13 GB
- Python packages (numpy, scipy, rasterio with bundled GDAL, pyproj, spiceypy, fastapi, ...): about 0.33 GB (the local Windows install folder measures 327 MB; Linux wheels are similar)
- Data subset: 0.087 GB now; add the size of the 20 m near-field tiles when they exist
- Estimate: about 0.55 to 0.65 GB before tiles, leaving roughly 0.35 GB for near-field tiles

This is an estimate: the Docker daemon was not running on the build machine, so the image has not been built or measured yet.
Measure with `docker images azelux-backend` after the first build and update this section.

## Cold start / warm-up

At start the app loads the SPICE kernels (about 46 MB) and, in a background thread, imports the compare pipeline and opens the far DEM
(warm-up). `/health` answers immediately; the first compare/skyline/tile request can still take a few seconds on a cold container if it
arrives before warm-up ends. Skylines for new sites are computed on demand and written to `/data/cache` (ephemeral on most hosts; the
four pre-baked skylines in the image make the demo sites instant). Use a health-check path of `/health` and a start period of 30 s.

## Interpretation notes

- `GET /skyline` returns `meta.step_minutes = 0` because there is no time grid on that endpoint but the v1.0 `Meta` schema requires the field.
- `GET /skyline` and `GET /terrain-tile` return 422 `NOT_IN_COVERAGE` outside terrain coverage (geometric mode).
