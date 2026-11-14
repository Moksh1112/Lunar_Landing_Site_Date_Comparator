# Stage Report - P2 + P3 (backend + terrain) - S2 and S3

Branch `feat/p2-p3-backend-terrain`, uncommitted on top of the S1 work. Every contract
endpoint is now **real** (`data_label: "REAL"`); mock mode is unchanged. Sync gates are
the team's call: P1 asked to stay in S0, and the owner chose to continue on the branch.

## S2 - first real slice

**Metrics (P2 S2.1):** `app/metrics/`.

- Windows use interpolated edges and censored flags; "both" windows are an intersection.
- Longest gaps include censored edges. A-B deltas and the TRD 5.3 verdict are included.
- **Re-deriving P1's fixtures from their raw series reproduces every window edge (to 1 s)
  and every metric**, so real results and mocks share one rule set.
- **The 8-case verdict table for P4 is at `backend/tests/cases/verdict_cases.json`**, not
  `tests/data/`: the repo `.gitignore` ignores every `data/` folder, which would have left
  the file uncommitted. Notes for the TypeScript port:
  - The band edges are inclusive, with a 1e-9 tolerance.
  - Python rounds exact halves to even (2.25 → 2.2).

**Real terrain (P3 S2.1/S2.3/S2.4):**

- `app/terrain/real.py` implements the C08 coverage rule:
  - `terrain` when a near tile holds the whole 20 km disc.
  - `terrain_coarse` on the 160 m far DEM otherwise.
  - `geometric` north of -80.7°.
  - Downgrades one level at 2 % or more nodata, and keeps a disk skyline cache.
- `scripts/prepare_dems.py` produced:
  - `far_160m.tif`: 3800², 36,909,329 B, NaN-aware 2×2 mean.
  - `south_pole_hillshade_2048.png`: 4,179,785 B, with a georeferencing JSON for the
    frontend map.
  - Its `--tiles` option is ready and waits for the 20 m DEM.
- `scripts/precompute_skylines.py` has filled the cache for both IM-2 sites.

**Real POST /api/v1/compare (P2 S2.2/S2.3):** `app/compare/service.py`.

- Pipeline: site → skyline → SPICE (observer at DEM site height + observer height) →
  visibility → windows/metrics/verdict → deltas.
- Also returns REAL meta and per-scenario limitations ("geometric horizon only",
  "coarse 160 m terrain").
- Every response is validated against the contract model before it leaves the server.
- IM-2 Athena vs IM-2 intended, 708 h from 2027-03-01: Sun 39.6 % vs 37.5 %, Earth
  81.2 % for both.
- IM-1 is geometric and labelled as such. An unknown site gives 404.

**Performance (P2 S2.4):**

| Request | Time | Budget |
| --- | --- | --- |
| Warm compare, 2 pole sites, 1 lunar day | about 1.1 s (388 KB) | 3 s |
| First request after the new background warm-up | about 3.3 s (was 6.2 s) | 3 s |

The remaining first-request cost is one-time Python/GDAL start-up; it is on the S4 list.

## S3 - complete endpoints

**Best-date sweep (P2 S3.1):** `app/sweep/service.py`, TRD 5.4.

- One 30-min series, sliced per candidate day; when a window boundary falls between
  samples, the exact end is interpolated.
- Ranking: verdict, then both-hours, then longest dark gap, then date. The top 5 are
  refined at 10 min and re-ranked among themselves.

| Run | Time | Target |
| --- | --- | --- |
| 60 days at IM-2 Athena, service only | 1.5 s | 15 s |
| Same, through the API from a cold server | 4.9 s | 15 s |

- The top days are 03-06, 03-07, 03-05, 03-08 and 03-04. All are red under the default
  50 % Sun threshold; Athena gets about 40 % Sun with coarse terrain.

**Real GET /skyline and /terrain-tile (P2 S3.2, P3 S3.1):**

- The tile is 256×256 float32, grid-up; the grid-bearing rule is in the proposals doc.
- A point outside terrain returns 422 `NOT_IN_COVERAGE`.

**Limits (P2 S3.3):**

- Rate limits per client IP, sliding 60 s window: compare 30/min, sweep 6/min.
- Body cap 64 KB → 413 `RANGE_TOO_LARGE` with field `body`.
- 60,000-sample cap per scenario (from S0).

**Docker (P2 S3.4, P3 S3.3):** `backend/Dockerfile` and `backend/docs/DEPLOY.md`.

- Three stages; uv 0.12.5 export; non-root user; HEALTHCHECK; honours `PORT`.
- Data comes from a BuildKit named context, `--build-context data=C:/azelux-data`, and
  only the subset is copied: kernels 45.7 MB, far DEM 36.9 MB, hillshade 4.2 MB, skyline
  cache, and tiles once built.
- That subset totals about 87 MB. **The image estimate is about 0.55–0.65 GB without
  tiles**, against the 1 GB budget.
- **Not built yet:** Docker is installed, but the Docker Desktop daemon is not running.

**V4 support (P3 S3.2):** `app/terrain/illumination.py` and `tools/pgda69_points.py`.

- PGDA 69 maps verified: int16 × 4e-5, Sun maximum 0.884 (PGDA says about 0.88).
- **Cross-check at IM-2 Athena:** PGDA's 18.6-year average is Sun 45.1 % / Earth 92.1 %;
  Azelux for one lunar day in March 2027 gives 39.6 % / 81.2 %. That is consistent with
  PGDA's any-part-of-disc rule versus our centre rule, and one day versus the long-run
  mean.
- 5 map-selected V4 candidate points near the pole are listed in the tool output.
- IM-2 sits at the edge of the 85°S map; the 75°S maps (126 MB, not downloaded) would
  cover it cleanly.

## Evidence

- `ruff check` (app, tests, tools, scripts): all passed.
- `pytest`: **173 passed** with real data; **140 passed, 27 skipped** with no data
  (CI-like).
- Live through the API: sweep, skyline and tile return 200, and a skyline at -60
  returns 422.

## Contract change requests for P1 / Coordinator (in addition to the S0 proposals C04/C05/C08)

1. **`RATE_LIMITED` (HTTP 429):** add it to the error table, with the standard shape and
   a `Retry-After` header. It applies to compare (30/min) and sweep (6/min). The
   frontend must handle 429.
2. **`/skyline` `meta.step_minutes`:** the skyline endpoint has no time grid but `Meta`
   requires the field, so `0` is returned. Confirm this, or make the field optional.
3. **Kernel name:** `moon_de440_250416.tf` replaces the removed `moon_de440_220930.tf`.
   Update `.env.example` and the TRD.
4. **Horizons API parameter:** it is `ANG_FORMAT`, not `ANGLE_FORMAT` (TRD 9.2; needed
   by P6 for V1).
5. **`.gitignore`:** the `data/` pattern matches every folder named data. Consider
   `/data/` so it only ignores the root data folder.
6. **Deployment:** behind a proxy (Render/Railway/Fly) set `AZX_TRUST_FORWARDED_FOR=true`,
   or all users share one rate-limit bucket.

## Open / next

- **The 20 m DEM is still downloading** (resumes automatically). Then:
  `prepare_dems.py --tiles`, recompute the IM-2 skylines in full `terrain` mode, and
  rerun compare and sweep at 20 m.
- **S4:** cold-start under 3 s, `pip-audit`, a break-it pass with P1, the backend README
  section, and a Docker build when the daemon runs.
- **Sites:** a 4th verified pole site; the Artemis regions still have no official
  centres.
