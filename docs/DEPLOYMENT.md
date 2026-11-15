# Deployment preparation (for review; not yet deployed)

No host has been selected and no public URL exists. Deploying needs Moksh's explicit
authorization. The files in `deploy/` are reviewed examples. No secrets are needed or stored.

## What a host must provide (measured 15 Nov 2026)

| Need | Value |
| --- | --- |
| Runtime | Linux with Python 3.12 (backend `pyproject`: ≥3.11,<3.13) and `uv`. Node 20+ only to build the frontend. |
| Persistent disk | About 361 MB of acquired data (16 manifest entries: 5 SPICE kernels, far DEM, 20 m tiles, hillshade, context map). The skyline cache grows under `<AZX_DATA_DIR>/cache`. Allow at least 1 GB. **Ephemeral disks lose the data and cache on restart.** |
| Memory | Backend about 390 MB resident after real Compare and Best Date requests. Allow at least 1 GB for the host. |
| Process model | One uvicorn worker. Rate limits (30 compares and 6 sweeps per minute per client) live in process memory. |
| HTTPS | TLS terminated by the reverse proxy (nginx + certbot, or the platform's TLS). |
| Start time | Real mode warms up DEM libraries in the background. `/health` responds immediately. |

## Recommended topology: one origin (verified locally)

```
browser ── https://SITE ──> nginx ─┬─ /, /compare, /learn/... ──> frontend/dist (SPA, index.html fallback)
                                   ├─ /api/*, /health          ──> uvicorn 127.0.0.1:8000
                                   └─ /assets/lunar/*          ──> uvicorn (map imagery from AZX_DATA_DIR)
```

Build the frontend with `VITE_API_URL=` (empty), so every request goes to the same origin.

- **Defect found and fixed:** basemap URLs used to fall back to `127.0.0.1:8000` when the value
  was empty. They now share the client's resolver (`frontend/src/api/apiBase.ts`, with tests).
- **Local verification on a real backend with a proxy emulating this routing:**
  - health, sites, compare and both map images loaded from the page's own origin;
  - `/report` and other deep links returned 200;
  - the built bundle contains no `127.0.0.1:8000` reference.

**Alternative: split origins.** Serve the static site from a static host or CDN, and the API from
a separate host. Then build with `VITE_API_URL=https://API_ORIGIN` and set
`AZX_CORS_ORIGINS=https://SITE_ORIGIN` exactly. The static host must rewrite unknown paths to
`/index.html`.

## Steps (Linux host, release directory per SHA)

```sh
# 1. code
git clone --branch feat/p1-s0-integration https://github.com/Moksh1112/Lunar_Landing_Site_Date_Comparator.git /srv/azelux/releases/<SHA>
cd /srv/azelux/releases/<SHA> && git checkout <SHA>
# 2. backend dependencies (locked)
cd backend && uv sync --locked && cd ..
# 3. data (persistent, outside the release directory); see NON_RELEASE_HANDOFF.md
export AZX_DATA_DIR=/var/lib/azelux/data
backend/.venv/bin/python scripts/download_kernels.py --data-dir $AZX_DATA_DIR
backend/.venv/bin/python scripts/download_dems.py --data-dir $AZX_DATA_DIR --skip-20m --pgda69
backend/.venv/bin/python scripts/prepare_dems.py --data-dir $AZX_DATA_DIR --far --hillshade
backend/.venv/bin/python scripts/prepare_remote_tiles.py --data-dir $AZX_DATA_DIR
backend/.venv/bin/python scripts/download_basemap.py --data-dir $AZX_DATA_DIR
# 4. frontend (same origin)
npm ci --prefix frontend && VITE_USE_MOCK=false VITE_API_URL= npm --prefix frontend run build
# 5. service + proxy
sudo cp deploy/backend.env.example /etc/azelux/backend.env   # then edit the origin
sudo cp deploy/azelux-backend.service.example /etc/systemd/system/azelux-backend.service
sudo cp deploy/nginx-azelux.conf.example /etc/nginx/sites-available/azelux  # then edit the domain
ln -sfn /srv/azelux/releases/<SHA> /srv/azelux/current
sudo systemctl daemon-reload && sudo systemctl restart azelux-backend && sudo nginx -t && sudo systemctl reload nginx
```

## Health check (gate before announcing)

- **`GET https://SITE/health` must show:**
  - `"mock": false`;
  - `kernels_loaded` with all 5 kernels: naif0012.tls, de440s.bsp, pck00011.tpc,
    moon_pa_de440_200625.bpc, moon_de440_250416.tf;
  - `dems_loaded` including `far_160m.tif` and the tiles (`im2-athena.tif`, `im2-intended.tif`);
  - the expected `manifest_sha256`. The local reference is
    `1dcb16ff00b027c8e5fbe31ebd468014a7e84f6f64d83ef38c024c8d94b95175`; a fresh acquisition
    must be re-hashed and recorded.
- **Real compare:** IM-2 Athena date shift, A 2027-03-01, B 2027-03-14, both 240 h. Expect REAL
  `terrain` with "tile im2-athena + far_160m", A red, B green, and A − B both −210.1 h.
- **Pages:** every route refreshes directly, `/THIRD_PARTY_NOTICES.txt` is served, and no
  "API unreachable" notice appears.

## Rollback

Each release lives in `/srv/azelux/releases/<SHA>`, and `current` is a symlink. To roll back:

```sh
ln -sfn /srv/azelux/releases/<PREVIOUS_SHA> /srv/azelux/current && sudo systemctl restart azelux-backend && sudo systemctl reload nginx
```

Data in `AZX_DATA_DIR` is shared and not touched by a rollback. The rollback revision is the
previously deployed SHA. Before the first deployment there is none; the last fully smoke-tested
integration SHA is recorded in `PROGRESS.md`.

## Hosting options for Moksh (no host chosen; provider plans and prices not verified here)

| Option | Fits Azelux because | Constraints to confirm with the provider |
| --- | --- | --- |
| A. Linux VM/VPS with a persistent disk (recommended) | Runs exactly the verified topology with `deploy/` files; data and cache persist | ≥1 GB RAM, ≥1 GB disk, a public IP or domain for TLS, someone to apply OS updates |
| B. Container platform with a persistent volume | Same topology in a container; mount the volume at `AZX_DATA_DIR` | The volume must persist across deploys and restarts. A Dockerfile is not yet written. Single instance only (in-memory rate limits). |
| C. Static host for the frontend + VM or container for the API | CDN for static files | Two origins: exact CORS and `VITE_API_URL`; SPA rewrite rule on the static host |

Free tiers that sleep or wipe disk on restart are unsuitable unless the data is re-acquired at
every start (about 361 MB of downloads and preparation). That is slow and depends on NASA/JPL
endpoints.

## After authorization

Run PRD 13.3 twice on the deployed URL with the final datasets and record the following:

- URL, SHA, time, health output, source modes, manifest, browser and device;
- direct-route refreshes and CORS;
- a deployed Lighthouse run and layout shift with the API reachable. The earlier 0.063 CLS came
  from the "API unreachable" notice in local tests, so re-measure it rather than assume it is
  gone.
