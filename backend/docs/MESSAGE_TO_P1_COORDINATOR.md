# P2 + P3 → P1 / Coordinator: backend ready for integration + decisions needed

**Branch:** `feat/p2-p3-backend-terrain` @ `d5c137b`, based on `bb5ae1d`. CI is green.
Full detail is in `backend/docs/STAGE_REPORT_P2_P3_*.md`.

## Ready to integrate

All contract endpoints run in **real mode** with `data_label: "REAL"`; mock mode is
unchanged:

- `/health`
- `/api/v1/sites`
- `/api/v1/compare`
- `/api/v1/sweep`
- `/api/v1/skyline`
- `/api/v1/terrain-tile`

**Science, checked against independent sources:**

- **SPICE vs JPL Horizons:** within 0.00001° for 6 Sun/Earth times over 30 days at IM-2.
- **SPICE `azlcpo`:** agrees to about 1e-13°.
- **V3 skyline tests** pass.
- **DEM orientation:** confirmed with NASA's IM-1 elevation (2,579 m official vs
  2,591.9 m read from the DEM).
- **PGDA 69 cross-check at IM-2 Athena:** 45.1 % Sun / 92.1 % Earth long-run, vs our
  39.7 % / 81.1 % for one lunar day. Consistent: PGDA counts any part of the disc as
  visible and averages 18.6 years.

**Terrain:** full 20 m `terrain` mode at the curated IM-2 sites (50 km tiles),
`terrain_coarse` (160 m) elsewhere south of -80.7°, and `geometric` elsewhere.

**Performance (warm server):**

| Request | Time | Budget |
| --- | --- | --- |
| Compare | 0.16–1.8 s | 3 s |
| 60-day sweep | 1.5–4.9 s | 15 s |
| Skyline (uncached) | ≤ 1.75 s | 2 s |

**Tests:** 534 pass with real data; 478 pass and 50 skip without data. Kernel and DEM
tests skip cleanly in CI.

**Frontend contract notes:**

- Deltas are **A minus B**, so the DeltaStrip copy "B: -31 h" means **-(delta)**.
- The 8-case verdict table is at `backend/tests/cases/verdict_cases.json`. It cannot live
  in `tests/data/`, because the root `.gitignore` ignores every `data/` folder.
- Python rounds exact halves to even.

**3D tiles are grid-up.** A direction at azimuth A lies at tile bearing
`B = (A + site lon_east) mod 360`. This was verified against the DEM transform and
IM-1, and is documented in `backend/docs/S0_CONTRACT_PROPOSALS_P2_P3.md`.

## Needs P1 action

1. **Merge / review:** please review `feat/p2-p3-backend-terrain` into
   `feat/p1-s0-integration` (PR on request).
2. **`.env.example` (P1-owned):**
   - NAIF removed `moon_de440_220930.tf` (404). Use `moon_de440_250416.tf`, which pairs
     with `moon_pa_de440_200625.bpc` per NAIF's readme.
   - `AZX_DATA_DIR` must be an absolute path outside OneDrive or any cloud-synced
     folder.
3. **`.gitignore`:** `data/` matches any folder named data. Suggest `/data/`.
4. **Deploy:**
   - `backend/Dockerfile` + `backend/docs/DEPLOY.md`. The data comes from a BuildKit
     named context (`--build-context data=<AZX_DATA_DIR>`), and only the subset is
     copied: kernels, the 160 m far DEM, tiles, the skyline cache and the hillshade.
     That is about 112 MB; the estimated image is about 0.6–0.65 GB against the 1 GB
     budget.
   - The image has not been built yet (no Docker daemon on the P2/P3 machine).
   - Behind a proxy, set `AZX_TRUST_FORWARDED_FOR=true` so each user gets their own
     rate-limit bucket.
   - Warm the server before the video (cold first request about 6 s; after warm-up
     2–2.4 s).
5. **For P6 (V1):** the Horizons API parameter is `ANG_FORMAT`; TRD 9.2's `ANGLE_FORMAT`
   returns HTTP 400. A working request is in `backend/tools/horizons_spot_check.py`.

## Decisions needed (Coordinator)

| ID | Decision | P2/P3 recommendation |
| --- | --- | --- |
| C04 | Time grid includes both ends; sample cap | Per scenario 60,000 today. **Change to 60,000 total per request.** One valid heavy request (1-min step, 2 × 999 h) takes about 30 s and holds the SPICE lock (A1) |
| C05 | `data_label` on `/sites` | Add an optional top-level `data_label` (v1.1); `/health` keeps using `mock` |
| C08 | Coverage modes, tile edges, tile extent, export provenance | 50 km tiles; `terrain` only when the whole 20 km disc fits in a tile; optional `manifest_sha256` in Meta and `/health` (v1.1) |
| New | `RATE_LIMITED` (HTTP 429) error code with `Retry-After` | Add to the error table; already implemented (compare 30/min, sweep 6/min per IP) |
| New | `/skyline` `meta.step_minutes` (no time grid) | Returns 0 today; make it optional in v1.1 |
| New | Site `group: "reference"` (v1.1) | Unlocks 2 verified pole sites: LCROSS impact -84.6796 / 311.2907 E (NTRS) and Shackleton -89.66 / 129.20 E (LROC). Shackleton is the best demo contrast |
| New | `terrain-tile`: optional `grid_bearing_offset_deg`, `dem`, `resolution_m` (v1.1) | Needed by P5's 3D lighting (see the bearing rule above) |
| Plan | Escalation: P2 and P3 are one person | V3 already passes, so the 02:00 risk is retired; please name a reviewer for P2/P3 PRs |
| Data | Artemis III regions | NASA publishes no numeric centres (name list and map only), so they stay out of the library |
