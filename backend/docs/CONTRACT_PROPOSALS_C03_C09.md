# P2 + P3 proposals for C03-C09 (exact text for the canonical contract)

Owner: backend + terrain (P2 + P3).

- Status: **PROPOSED**. `docs/CONTRACT.md` is not modified; P1 records whatever the
  Coordinator approves.
- "Implemented" below means the owner branch already behaves this way, so a rejection
  needs a code change.
- **Versioning (Playbook 6.3):** a clarification keeps v1.0; a new optional field or
  enum value is v1.1. Nothing here is breaking.

## C03 - refined sweep days (v1.1, optional field)

**Implemented:**

- `meta.step_minutes = 30` is the sweep grid.
- The top 5 ranked days are recomputed at 10 min, flagged `refined: true`, and re-ranked
  among themselves as ranks 1-5.
- All other days keep their 30-min metrics.

**Proposed text** (under POST /api/v1/sweep, response):

> `days[].step_minutes`: number (optional, v1.1). It gives the time step behind that
> day's metrics: 10 when `refined` is true, otherwise equal to `meta.step_minutes` (30).
> Ranks 1-5 are ordered by refined metrics, and ranks 6..N by 30-min metrics. Refined
> and unrefined metrics for the same day differ by under 3 percentage points in tests.

## C04 - time grid and sample cap (clarification, v1.0)

**Implemented in the S0 closeout, to follow TRD 10.1 literally:**

**Proposed text** (Conventions):

> Time grid per scenario: samples at `start + k*step`, **both ends included**. If
> `mission_hours*60` is not a multiple of the step, the last sample sits exactly at the
> mission end. The count is `ceil(mission_hours*60/step) + 1`. Durations come from
> interpolated window edges, never from sample counts. Percentages use `mission_hours`.
>
> **Sample cap: at most 60,000 samples per request.**
>
> - Compare: the sum over both scenarios.
> - Sweep: the 30-min grid over `range_end - range_start` (in days) plus
>   `mission_hours`. The server's internal 10-min refinement of the top 5 days does not
>   count.
>
> Above the cap: 413 `RANGE_TOO_LARGE`, with `details[0].field = "scenarios"` for
> compare or `"mission_hours"` for sweep, and the requested total in `reason`.

Consequences:

- Two 8,760 h scenarios at 10 min (105,122 samples) are rejected.
- 8,760 h + 708 h at 10 min (56,810) is accepted.
- At 1-min steps, the two missions together may total at most 999.97 h.
- The largest valid sweep (183 days + 8,760 h) is 26,257 samples, inside the cap.
- Boundary tests cover exactly 60,000 (accepted) and 60,001 (rejected).

**Question for the Coordinator:** should the sweep refinement count toward the cap?
If yes, long-mission sweeps must refine at a coarser step (e.g.
`max(10, ceil(mission_hours*60*5/30000))` min) to stay under it.

## C05 - transport labels and empty sweep (v1.1, optional field)

**Proposed text:**

> `GET /api/v1/sites` response gains `data_label: "REAL" | "SYNTHETIC"` (optional,
> v1.1). It is `"SYNTHETIC"` in fixtures and mock mode, and `"REAL"` when served from
> the sourced library.
>
> - Per-site truth stays in `verified` and `source_url`, and the UI hides
>   `verified: false` by default.
> - `/health` adds no label: `mock: true` means every endpoint serves SYNTHETIC
>   fixtures.
> - Error responses carry no label.
>
> **Empty sweep:** a valid request never yields `days: []` from the real backend.
> `sweep.empty.json` exists for UI empty-state testing only.

## C06 - ranges, errors, Site fields, mode

**Implemented; proposed text:**

> **Thresholds:** `sun_pct_min` and `earth_pct_min` in 0..100; `dark_gap_h_max` and
> `blackout_h_max` ≥ 0 (hours).
>
> **Site (request):** either `site_id` (pattern `[A-Za-z0-9._-]{1,64}`), or both
> `lat_deg` and `lon_east_deg`.
>
> - If `site_id` is given, any lat/lon are ignored, as v1.0 already says.
> - `|lat_deg| > 89.99` → 400.
> - `lon_east_deg` must be in [0, 360).
>
> **start_utc:** the exact form `YYYY-MM-DDTHH:MM:SS[.fraction]Z`, in 1900-01-01 ..
> 2149-12-31 (the DE440s span), and the whole mission must end by 2149-12-31.
> Otherwise 400 `INVALID_INPUT`.
>
> **New error code `RATE_LIMITED`, HTTP 429:**
>
> - Body: `{"error":{"code":"RATE_LIMITED","message":"Too many requests; try again in N s.",
>   "details":[{"field":"rate","reason":"limit X per minute"}]}}`, plus a `Retry-After`
>   header (seconds).
> - Limits per client IP, sliding 60 s window: compare 30/min, sweep 6/min.
> - Behind a proxy the deployment sets `AZX_TRUST_FORWARDED_FOR=true`.
>
> **Body cap:** more than 64 KB → 413 `RANGE_TOO_LARGE`, field `body`.
>
> **Timeouts:** no separate timeout error. The sample cap bounds work: about 30 s
> worst case before C04; now bounded by 60,000 samples.
>
> **mode:** echoed and not enforced by the backend. The presets (date_shift locks B's
> site, site_vs_site locks B's date) are enforced by the frontend.

## C07 - shifted-date scrubber and request context (no schema change)

**Proposed text** (frontend guidance; the backend already returns everything needed):

> Each scenario's `series.t_unix` starts at its own `start_utc`. For
> `alignBy = "mission_day"`, the frontend maps one scrubber value **offset_s** (seconds
> since mission start) to each scenario's sample time `t = t_unix[0] + offset_s`.
> For `"calendar"`, it uses one absolute time (`scrubT`). Countdowns ("next sunset")
> use that scenario's windows at its own `t`.
>
> Exports must store the **full compare request** together with the response
> (`meta.computed_at`, `app_version`, `contract_version`), so countdowns and offsets can
> be re-derived.

## C08 - coverage, tile extent and orientation, provenance (v1.1 optional fields)

**Implemented coverage rule; proposed text:**

> `horizon_mode` per scenario:
>
> - `geometric` if `lat_deg > -80.7`.
> - Else `terrain` if a 20 m near-field tile holds the **whole 20 km disc** around the
>   point.
> - Else `terrain_coarse` (160 m far DEM).
> - In every mode the site pixel must be valid and fewer than 2 % of skyline samples
>   may be nodata; otherwise the mode downgrades one level.
> - Rays leaving the DEM edge (about 80°S) stop there; that is not nodata.
>
> Near-field tiles are **50 × 50 km** around each verified curated pole site, so a
> point within 5 km of a curated site gets `terrain`.

**`GET /api/v1/terrain-tile`, proposed v1.1 optional fields and text:**

> Heights are **grid-up**, not north-up: row 0 is the +y edge of the south polar
> stereographic grid (`x = r·sin λ`, `y = r·cos λ`), and column 0 is the -x side.
>
> - `grid_bearing_offset_deg` = the tile centre's `lon_east_deg`. A direction at
>   azimuth A (from local north, clockwise) lies at tile bearing `(A + offset) mod 360`,
>   clockwise from the tile top.
> - `source_dem`: string, e.g. `"LDEM_80S_20MPP_ADJ tile im2-athena"` or `"far_160m"`.
> - `resolution_m`: the source pixel size (20 or 160).
> - The tile comes from the 20 m tile when the requested square fits inside it,
>   otherwise from the 160 m DEM resampled to 256².
> - `size_km` stays in (0, 40]; outside coverage → 422 `NOT_IN_COVERAGE`.

The bearing rule is exact: the projection is conformal. It was checked numerically and
against the DEM transform; the IM-1 elevation check confirms the sign.

**Provenance, proposed v1.1 optional fields:**

> `meta.manifest_sha256` and `/health` `manifest_sha256`: the SHA-256 of the server's
> data `MANIFEST.json`, which lists every kernel and DEM with its own SHA-256 (published
> as `backend/docs/DATA_EVIDENCE.md`). Exports carry `meta` plus this hash.

**`/skyline` `meta.step_minutes`:** the endpoint has no time grid. It returns 0 today.
Proposed: make it optional (absent) for `/skyline` in v1.1.

## C09 - reconcile source contradictions

**Proposals:**

1. **Version labels:** follow Playbook 6.3 strictly. Adding optional fields or enum
   values is v1.1. **Changing compare from exactly 2 to 2-4 scenarios is breaking
   (v2.0)**, because existing clients and the `deltas` shape assume A/B. If the
   Iteration 2 multi-scenario compare is approved, use a new endpoint
   (`POST /api/v1/compare-multi`), which keeps it v1.1.
2. **data_label rule:** "every response carries data_label" is read as every
   **result-bearing** response (compare, sweep, skyline, terrain-tile). `/sites` gains
   the optional label (C05); `/health` uses `mock`; errors carry none.
3. **Demo gate after cuts:** if 3D or PDF is cut at a checkpoint, `/terrain-tile` stays
   live but unused. The source labels (REAL/SYNTHETIC badge, "geometric horizon only",
   DEM name) stay mandatory in every view that remains (PRD never-cut list).
4. **New site group `reference` (v1.1 enum value):** it unlocks two verified pole points
   now held in `backend/app/sites/PENDING_SOURCES.md`:
   - LCROSS impact, -84.6796 / 311.2907 E (NTRS 20140005563).
   - Shackleton crater, -89.66 / 129.20 E (LROC post 993).

## Already implemented on the owner branch (for the record)

- C02 windows/metrics semantics (they re-derive P1's corrected fixtures exactly).
- C04 per-request cap.
- C06 validation and limits.
- C08 coverage rule and tiles.

None of this approves the contract text; P1 records the decisions.
