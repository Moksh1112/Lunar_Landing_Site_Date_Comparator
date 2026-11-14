# Stage Report - P2 + P3 (backend + terrain) - S1 (first half)

Branch `feat/p2-p3-backend-terrain` (S0 committed as `2703add`, CI 7/7 green). This S1
work is **uncommitted**. Sync 0 is a team gate: P1 asked to stay in S0, and the owner
chose to continue on the branch. Nothing here is merged.

Order follows the S0 escalation proposal: skyline and V3 first, then ephemeris.

## Done

**Skyline (P3 S1.2/S1.3):** `app/terrain/skyline.py`, exactly as TRD 4.3.

- Exact 3D vectors on the sphere, 720 azimuths, 20 m steps to 20 km, then +1 % per
  sample to 400 km.
- Near/far samplers. OUTSIDE samples are ignored; NODATA samples are counted toward the
  nodata fraction. The result is floored at the sphere's geometric horizon (`-dip`).
- A full skyline (936,720 ray samples) computes in **0.35 s** from synthetic samplers
  and **3.0 s** including real DEM reads. The target is under 2 s; it will improve with
  preload or caching.

**V3 tests** (`tests/test_skyline_v3.py`, 11 cases, equator and south-pole sites):

- Flat terrain gives exactly `-dip`.
- A 1 km wall 9.9–10.1 km due east gives 5.59–5.60°, equal to the exact value for the
  wall's near face. TRD's 5.55° is the idealised zero-thickness wall at 10 km.
- A far-field wall at 50 km is within 0.002° of exact.
- Nodata versus outside, site NaN and ray-distance checks also pass.

**DEM reader (P3 S1.1):** `app/terrain/raster.py`, a `RasterSampler` that uses
rasterio windowed reads and pyproj with the raster's own Moon CRS (bilinear, pixel
centres, nodata → NaN).

- 80 m DEM metadata, recorded in MANIFEST.json:
  - 7600 × 7600 px, float32, nodata NaN.
  - Transform `[80, 0, -304000, 0, -80, 304000]`.
  - CRS "Moon (2015) - Sphere / Ocentric / South Polar", R = 1,737,400 m.
  - sha256 `82030dcb…6beee5a`.
- **Sign convention confirmed with a known feature.** NASA gives IM-1 Odysseus an
  elevation of 2,579 m. The DEM at (-80.13, 1.44) under `x = r sin λ, y = r cos λ` reads
  **2,591.9 m**; the mirrored conventions read 1,683 / -2,146 / -3,900 m.
- The **grid-bearing rule `B = (azimuth + lon) mod 360` is confirmed** (proposal doc).
  Row 0 is +y and column 0 is -x.

**Ephemeris (P2 S1.1/S1.2):** `app/ephemeris/spice.py`.

- `spkcpo(target, et, "MOON_ME", "OBSERVER", "LT+S", obs, "MOON", "MOON_ME")` behind one
  `threading.Lock`.
- Site ENU frame and a time grid with both ends included (C04).
- 256-entry LRU cache returning read-only arrays.
- Kernels load at startup in real mode only; `/health` lists the kernels actually loaded.
- Independent check against SPICE `azlcpo` over 61 times in 30 days: max difference
  about **1e-13°** (Sun and Earth).

**Horizons spot check (P2 S1.3):** `tools/horizons_spot_check.py`, results in
`docs/horizons_spot_check_S1.json`.

- IM-2 Athena, 6 times over 30 days.
- **max |Δ| < 0.00001°** for Sun and Earth azimuth and elevation. Target is 0.05°: PASS.
- **Horizons template fix:** the API parameter is `ANG_FORMAT`; TRD 9.2's `ANGLE_FORMAT`
  returns HTTP 400. P6 needs this for V1.
- Horizons echoes the site as `29.1957, -84.7906, 0.0` on a 1737.4 km sphere, which is
  V2-style evidence for east-positive longitude.

**Sites (P2 S1.4):** `app/sites/loader.py`. Real-mode `GET /api/v1/sites` serves the 3
verified pole sites; an unknown `site_id` returns 404 `NOT_FOUND`.

**First real end-to-end result (P3 S1.4):** `tools/skyline_demo.py` →
`docs/skyline_im2_athena_S1.{json,svg}`.

- Site and data: IM-2 Athena, 80 m DEM used for near and far (the equivalent of
  `terrain_coarse`), h_site 5,321.5 m, h_obs 2 m.
- Skyline: max 4.06° at azimuth 117.5° (16.5 km away), min -1.47°, nodata 0 %.
- One lunar day (708 h, 10 min) from 2027-03-01, by sample count: Sun visible 39.6 %,
  Earth 81.1 %, both 29.7 %. Sun elevation stays within -5.9..+4.2°.
- The panorama SVG shows the real skyline with the Sun and Earth paths.

## Evidence

- `ruff check app tests tools`: all passed.
- `pytest`: **100 passed** with real data; **86 passed, 8 skipped** without data (CI-like).
- All numbers above come from commands actually run on 2026-11-14.

## Open / next

- **20 m DEM still downloading** (352 / 2,696 MB, about 0.2–0.4 MB/s). Then:
  `download_dems.py --inspect`, 50 km near-field tiles (`prepare_dems.py`), a 160 m far
  DEM, and true `terrain` mode.
- P2 S2: windows with interpolated edges and censored flags, metrics, verdict and the
  8-case table, then a real `POST /compare`.
- Terrain provider (real): coverage rule (C08), skyline cache, `site_height`, wired into
  `/skyline`.
- Small follow-ups:
  - `RasterSampler(preload=True)` holds float64, which is 462 MB for the 80 m DEM →
    store float32.
  - `time_grid` tests need the leapseconds kernel, so they skip in CI → split
    kernel-free offsets.
  - Delete the stale `app/adapters/README.md`.
- A 4th verified pole site is still needed. Artemis regions have no official centres.
- Windows note: rasterio/pyproj DLLs were blocked once by Application Control and then
  loaded on retry (intermittent). Raster tests skip cleanly if imports fail.
