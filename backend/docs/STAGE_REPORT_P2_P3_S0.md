# Stage Report - P2 + P3 (backend + terrain) - S0

> **Status note (added at S0 closeout):** the stage labels in this owner report describe work on the
> owner branch only. They do **not** establish team gates: P1 integration and Sync 0 remain OPEN until
> P1/Coordinator acceptance (docs/PROGRESS.md).


Branch: `feat/p2-p3-backend-terrain` (based on P1 baseline `bb5ae1d`). Status: S0
deliverables built and checked locally; DEM downloads in progress. **Published in `2703add`**
(owner-authored commit; hosted CI 7/7 green). Contract decisions are proposed, not approved.

## Done

**Canonical dependency pair (for P1):** `backend/pyproject.toml` + `backend/uv.lock`.

- The lock was written by **uv 0.12.5** (the CI pin): `version = 1`, `revision = 3`,
  42 packages, `requires-python >=3.11,<3.13`.
- Runtime dependencies: fastapi, uvicorn, pydantic, pydantic-settings, spiceypy, numpy,
  scipy, rasterio, pyproj, httpx, orjson. Dev group: ruff, pytest.

**Backend scaffold (P2 S0.2-S0.4):**

- App factory `app/main.py`.
- `app/settings.py` reads `AZX_*` from the environment and the repo-root `.env`.
  Empty values fall back to defaults; CORS origins must be exact (no `*`, trailing `/`
  stripped).
- `app/paths.py`: every path is derived from `__file__`, so runs from the repo root and
  from `backend/` resolve identically (tested).
- JSON access logs with request ID, returned in the `X-Request-ID` header.
- `GET /health` in the contract shape; it never claims files are loaded in S0.
- `app/api/models.py`: Pydantic v2 models for every contract object, all `extra="forbid"`.
- `app/api/errors.py`: a single handler producing the contract error shape, with fields
  like `scenarios[1].site.lat_deg`. No stack traces reach clients.
- **Mock mode** (`AZX_USE_MOCK=true`): every endpoint validates its input and then
  serves `fixtures/*.ok.json`. Real mode returns `500 INTERNAL "Not implemented yet in
  this build (S0)"`, so fixtures are never served as REAL.
- Limits enforced now:
  - `|lat| > 89.99` → 400.
  - `lon` outside `[0, 360)` → 400.
  - `start_utc` without `Z` → 400.
  - Mission over 8,760 h → 413.
  - More than 60,000 samples per scenario → 413 (C04 proposal).
  - Sweep range over 183 days → 413.

**Terrain interface (P3 S0.2):** `app/terrain/`.

- `TerrainProvider` protocol: `coverage`, `skyline`, `site_height`, `terrain_tile`.
- `NotInCoverage` error, which maps to 422.
- Exact geometric horizon: dip = acos(R/(R+h)), 0.0869° at 2 m.
- `MockTerrain` serves the SYNTHETIC fixtures. Real mode raises `NotImplementedError`
  until S1, with no silent fallback to synthetic data.

**Curated sites (P3 S0.3):** `app/sites/sites.json` has **3 verified** south-pole
entries, each checked on its official page on 2026-11-14:

| Site | Latitude | Longitude | Source |
| --- | --- | --- | --- |
| IM-1 Odysseus | -80.13 | 1.44 E | nasa.gov |
| IM-2 Athena (landing) | -84.7906 | 29.1957 E | LROC |
| IM-2 intended site | -84.78 | 29.13 E | LROC |

NASA publishes **no numeric centres** for the nine Artemis III regions, so they are
listed in `app/sites/PENDING_SOURCES.md` and not invented. The target is 4 verified by
Sync 1.

**Download scripts (stdlib only; resumable; pinned sizes; refuse cloud-synced folders;
locked atomic `MANIFEST.json` writes):**

- `scripts/download_kernels.py` (P2).
- `scripts/download_dems.py` (P3), with `--pgda69` and `--inspect`.
- Shared helpers: `scripts/azx_data.py`.

**Contract and science proposals:** `backend/docs/S0_CONTRACT_PROPOSALS_P2_P3.md`
covers C04, C05, C08, the grid-north rule, PGDA 69 ownership and the escalation plan.

## Evidence (commands actually run)

- `ruff check .`: All checks passed. `pytest -q`: **63 passed**, 0 failed.
- `python scripts/check_backend.py` (P1's check) from the repo root: PASS.
- Live server from the repo root in mock mode:
  - `/health` returns 200 with `X-Request-ID`.
  - `/api/v1/sites` returns 200 with the fixture.
  - An invalid latitude returns 400 with `field = "scenarios[1].site.lat_deg"`.
- Kernels downloaded into `AZX_DATA_DIR=C:/azelux-data` (outside OneDrive):

  | File | Bytes | SHA-256 (prefix) |
  | --- | --- | --- |
  | naif0012.tls | 5,257 | 678e32bdb5a74411 |
  | de440s.bsp | 32,726,016 | c1c7feeab882263f (MD5 matches NAIF's published list) |
  | pck00011.tpc | 131,226 | 3dff7b1dbeceaa01 |
  | moon_pa_de440_200625.bpc | 12,863,488 | 60cd55aa401ea2ea |
  | moon_de440_250416.tf | 19,478 | a47c71e9c9f33796 |

  Full hashes are in `C:/azelux-data/MANIFEST.json`.
- SPICE load test (SpiceyPy 8.4.0, CSPICE N0067): all 5 kernels load and `MOON_ME`
  resolves (frame id 31001).
  - `str2et("2027-03-01T00:00:00Z")` equals `str2et("2027-03-01T00:00:00")`, and
    `et2utc` returns `2027-03-01T00:00:00.000`.
  - **The contract's `Z` timestamps are compatible.**
- DEM and illumination downloads: running, about 0.4 MB/s from pgda.gsfc.nasa.gov.
  Remote sizes were verified before downloading:

  | File | Bytes |
  | --- | --- |
  | LDEM_80S_80MPP_ADJ.TIF | 189,158,392 |
  | LDEM_80S_20MPP_ADJ.TIF | 2,696,082,051 |
  | AVGVISIB_85S_060M_201608.TIF | 33,994,464 |
  | AVGVISIB_85S_060M_201608_EARTH.TIF | 24,862,958 |

  Checksums and `--inspect` raster metadata (CRS WKT, transform, dtype, nodata) will be
  added when they finish.

## Found during S0 (P1 / Coordinator please note)

1. **The TRD kernel name is outdated.** `moon_de440_220930.tf` is gone from NAIF (404).
   The current file is `moon_de440_250416.tf`, which NAIF's fk/satellites readme pairs
   with `moon_pa_de440_200625.bpc`. The backend default now uses it.
   **P1-owned files still list the old name:** `.env.example` (`AZX_KERNEL_LIST`) and
   the fixtures' `meta.kernels`, if regenerated.
2. **Windows Application Control blocks virtualenv interpreters on this machine.** That
   is the same issue P1 hit. Local checks therefore ran in target mode: system Python
   3.12 with packages in `C:/azelux-pkgs`. CI (Linux) is unaffected.
3. **A global `pytest-asyncio` on a developer's Python breaks collection.** Local runs use
   `PYTEST_DISABLE_PLUGIN_AUTOLOAD=1`. CI is unaffected.
4. **Stale old-plan file:** `backend/app/adapters/README.md` still says "Person 4/6 owns".
   It is left untouched (created by P1); I propose deleting it in S1.
5. **Interpretations awaiting confirmation** (see the proposals file):
   - The sweep range counts both end days (`(end - start).days + 1 <= 183`).
   - HTTP 405 is returned with code `INVALID_INPUT`.
   - The 64 KB body cap and rate limits are deferred to S3, as the P2 prompt says.

## Not done / next (S1, after Sync 0)

- **First (escalation plan):** the V3 skyline tests, then the real skyline on one
  verified pole site.
- Check the DEM x/y sign against the actual raster transform, which confirms or adjusts
  the grid-bearing rule.
- Then ephemeris (`spkcpo`) with the Horizons spot check, the sites loader for real
  mode, and a 4th verified pole site.
