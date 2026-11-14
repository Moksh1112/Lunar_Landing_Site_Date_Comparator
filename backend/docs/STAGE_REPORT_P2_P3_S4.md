# Stage Report - P2 + P3 (backend + terrain) - S4 hardening

> **Status note (added at S0 closeout):** the stage labels in this owner report describe work on the
> owner branch only. They do **not** establish team gates: P1 integration and Sync 0 remain OPEN until
> P1/Coordinator acceptance (docs/PROGRESS.md).


Branch `feat/p2-p3-backend-terrain`; **published in `d5c137b`** (on top of `d33ba97`; hosted CI 7/7 green;
integrated by P1 into `315d22a`).

## Full 20 m terrain (P3)

- **20 m DEM complete:** 2,696,082,051 B, exactly the server size; sha256
  `09b7ca80f9e6…`. It is a 30400², float32, nodata-NaN raster. The download survived
  three dropped connections through the new auto-resume.
- **Near-field tiles (50 km, 20 m):** `im2-athena.tif` and `im2-intended.tif`, 2500²,
  about 12.5 MB each, 0 % nodata, 8 s to build.
- **IM-2 sites now run in `terrain` mode** (20 m tile + 160 m far field).

| 2027-03-01, 708 h | Sun | Earth | Both | Longest dark |
| --- | --- | --- | --- | --- |
| Athena | 39.7 % | 81.1 % | 29.7 % | 329.6 h |
| Intended site | 37.5 % | 81.2 % | 29.8 % | 328.7 h |

  These are nearly identical to the coarse 160 m run, so the horizon here is set by
  large, distant terrain. A warm compare takes 0.16 s.

## Bugs found and fixed

| # | Repro | Effect | Fix |
| --- | --- | --- | --- |
| T1 | A site below the 1,737.4 km sphere (crater floors; e.g. -80.71/45E, -645 m) | Dip formula `acos` domain error → silently downgraded to a flat "geometric" horizon labelled REAL | Dip clamped at height 0 in `skyline.py` and `geometric.py`. The skyline cache signature now includes an algorithm version (`SKYLINE_ALGO_VERSION = 2`), so wrong cached results are recomputed and nothing has to be deleted |
| T2 | Corrupt or truncated skyline `.npz` | Request crash | Treated as a cache miss and recomputed |
| B1 | `start_utc` year 1800 / 2200 / 9999 | 500 with SPICE text in the log | 400 INVALID_INPUT; supported span 1900-01-01..2149-12-31 (DE440s), and the mission must fit inside it |
| B2 | Year `0001` | SPICE read it as 2001 → 200 with wrong data | Same span check |
| B3 | `20270301T000000Z` (compact ISO) | 500 | Strict `YYYY-MM-DDTHH:MM:SS[.f]Z` check |
| B4 | `site_id: ""` | 500 | site_id must match `[A-Za-z0-9._-]{1,64}` |
| B5 | Huge or odd `X-Request-ID` | Echoed and logged unchecked | Only `[A-Za-z0-9._:-]{1,64}` is kept, otherwise a new UUID |
| B6 | Any pre-1970 date on Windows | 500 (`fromtimestamp` of a negative time) | Timestamps formatted as epoch + timedelta. **Apollo-era dates work**: Apollo 11 (1969) and Apollo 17 (1972) landing windows were checked |
| - | Cache keys for lon -0.0 and 360 | Duplicate cache files | Longitude normalised in the key |

## Hardening evidence

- **Dependency audit:** `uvx pip-audit` on the locked export reports "No known
  vulnerabilities found". No secrets, no `print()` of request data, no stack traces or
  paths reach clients. Details: `docs/SECURITY_AUDIT_S4.md`.
- **Break-it suite** (`tests/test_break_it.py`) covers every endpoint:
  - Malformed JSON, NaN/Infinity, huge or negative numbers.
  - Pole and longitude edges; far-side and north-pole sites.
  - Unicode, emoji and right-to-left labels; duplicate ids.
  - Date edges; arrays passed as query parameters.
  - 8 parallel real compares return identical results (the SPICE lock works).
- **Terrain edges** (`tests/test_terrain_edges.py`, 20 tests):
  - The -80.7 boundary; rays leaving the DEM do not count as nodata.
  - Nodata holes downgrade the mode, and NaN never reaches a result.
  - The 20 m observer skyline is at or below the 0 m one.
  - 4 threads on one site agree; the cache write is atomic.
- **Performance** (`tools/terrain_perf.py`, far DEM only):
  - Uncached skyline 1.1–1.75 s (budget 2 s); cached 0.004 s; terrain tile 0.05 s.
  - Warm compare 0.16–1.8 s depending on load.
  - First request after warm-up 2.0–2.4 s; without warm-up 5.8 s.
- **Tests:** **534 passed** with real data; **478 passed, 50 skipped** without data
  (CI-like). Ruff clean.
- `backend/README.md` covers setup (including the Windows target-mode note), env vars,
  endpoints, data scripts, tests, mock vs real, and deploy.

## Decisions needed (Coordinator / P1)

1. **A1, a heavy valid request.** Step 1 min with two 999 h scenarios is about 120k
   samples. It takes about 30 s, returns 5.4 MB, and holds the SPICE lock, so other
   users wait; the rate limit does not prevent it. Options:
   - (a) A lower total sample cap per request, e.g. 60,000 total instead of per scenario
     (C04 proposal change).
   - (b) Coarser minimum step for long missions.
   - (c) A server-side time budget.

   Recommendation: (a). It is one constant and gives a clear 413.
2. **New `reference` site group (v1.1).** It would add two verified pole sites:
   - LCROSS impact, -84.6796 / 311.2907 E (NTRS).
   - Shackleton crater, -89.66 / 129.20 E (LROC).

   See `app/sites/PENDING_SOURCES.md`. Shackleton is the best demo contrast for IM-2.
3. Earlier requests remain open: C04, C05, C08, `RATE_LIMITED` 429, `meta.step_minutes`
   for `/skyline`, the kernel name, `ANG_FORMAT`, and the `.gitignore` `data/` pattern
   (see the S0 and S2/S3 reports).
4. Known and accepted:
   - `site_id` plus coordinates → `site_id` wins (contract: "lat/lon ignored").
   - Lax type coercion (e.g. `"10"` for `step_minutes`).
   - Public `/docs` (the P2 prompt asks to publish it).
   - Security headers (HSTS, CSP, nosniff) belong to the host.

## Still open

- Docker image not built: the Docker Desktop daemon is not running. The size is
  estimated at about 0.6 GB plus 25 MB of tiles, under the 1 GB budget.
- First request after warm-up is 2.0–2.4 s; it meets the 3 s budget only once warm-up
  has finished, so the deploy must warm up before the demo (TRD 8.4).
