## P2 + P3: real backend + terrain (S0–S4)

All contract endpoints now run in **real mode** with `data_label: "REAL"`; mock mode is
unchanged:

- `/health`
- `/api/v1/sites`
- `/api/v1/compare`
- `/api/v1/sweep`
- `/api/v1/skyline`
- `/api/v1/terrain-tile`

### What's in it

- **Ephemeris:** SPICE `spkcpo` (LT+S, MOON_ME, DE440), all calls behind one lock.
  Kernel frames file `moon_de440_250416.tf`; NAIF removed the TRD's `220930`.
- **Terrain:**
  - LOLA PGDA 90 DEMs: a 20 m near-field tile within 50 km of each curated site, plus a
    160 m far field.
  - TRD 4.3 skyline with exact 3D vectors.
  - Coverage modes `terrain` / `terrain_coarse` / `geometric`, with a disk skyline cache.
- **Metrics:** windows with interpolated edges and censored flags, gaps, A−B deltas and
  the TRD 5.3 verdict. They **re-derive P1's fixtures exactly**.
- **Sweep (TRD 5.4):** a 30-min grid, top 5 refined at 10 min.
- **Limits:** compare 30/min and sweep 6/min per IP, a 64 KB body cap, a 60,000-sample
  cap, and a date span of 1900–2149.
- **Docker:** `backend/Dockerfile` + `backend/docs/DEPLOY.md`. The data subset comes from
  a BuildKit named context.
- **Dependencies:** `backend/pyproject.toml` + `backend/uv.lock`, written by uv 0.12.5 to
  match CI.

### Evidence

- **SPICE vs JPL Horizons:** within 0.00001° (6 times × Sun/Earth, IM-2, 30 days).
  SPICE `azlcpo` agrees to about 1e-13°.
- **V3 skyline tests** pass.
- **DEM sign** confirmed with NASA's IM-1 elevation: 2,579 m official vs 2,591.9 m read
  from the DEM.
- **PGDA 69 long-run visibility at IM-2 Athena:** 45.1 % Sun / 92.1 % Earth, vs Azelux's
  39.7 % / 81.1 % for one lunar day. Consistent: PGDA counts any part of the disc and
  averages 18.6 years.
- **Tests:** 534 pass with real data; 478 pass and 50 skip without data (CI). Ruff clean;
  `pip-audit` reports no known vulnerabilities.
- **Performance (warm):**

  | Request | Time | Budget |
  | --- | --- | --- |
  | Compare | 0.16–1.8 s | 3 s |
  | 60-day sweep | 1.5–4.9 s | 15 s |
  | Skyline | ≤ 1.75 s | 2 s |

### Frontend notes

- **Deltas are A minus B**, so the DeltaStrip text "B: -31 h" shows **-(delta)**.
- The verdict table is `backend/tests/cases/verdict_cases.json`. It is not in
  `tests/data/`, because `.gitignore` ignores every `data/` folder.
- **3D tiles are grid-up**: azimuth A lies at tile bearing `(A + lon_east) mod 360`.

### Decisions needed

See `backend/docs/MESSAGE_TO_P1_COORDINATOR.md`:

- C04: change the sample cap to 60,000 total per request.
- C05: `data_label` on `/sites`.
- C08: tile edges and export provenance.
- A new `RATE_LIMITED` (429) error code.
- A `reference` site group, which unlocks LCROSS and Shackleton.
- P1 file changes: the `.env.example` kernel name and the `.gitignore` `data/` pattern.

Stage reports: `backend/docs/STAGE_REPORT_P2_P3_*.md`.
