# P2 + P3 S0 proposals: open contract and science decisions

Owner: backend/terrain (P2 + P3, one person). Status: PROPOSED for Coordinator decision.
P1 records any approved change in docs/CONTRACT.md and fixtures. Nothing here is
implemented as a contract change until approved. Items map to
docs/CONTRACT_CHANGE_REQUESTS_S0.md and docs/BACKEND_TERRAIN_HANDOFF_S0.md.

Versioning per Playbook 6.3: clarifications of existing text stay v1.0; new optional
fields are v1.1 (minor); nothing below is breaking.

## C04 - time grid and sample cap (clarification, stays v1.0)

Grid for one scenario: samples at `start + k * step` for k = 0..N-1, both ends included.

- If `mission_hours * 60` is a multiple of `step_minutes`:
  `N = mission_hours * 60 / step_minutes + 1`.
- Otherwise the last sample sits exactly at `start + mission_hours`, so the final
  interval is a partial step: `N = ceil(mission_hours * 60 / step_minutes) + 1`.
- Durations (window hours, gaps, percentages) come from interpolated window edges
  (TRD 5.1), never from sample counts. Percentages use `mission_hours` as denominator.

Cap: **60,000 samples per scenario** (not per request). Above it: 413 `RANGE_TOO_LARGE`
with `details[].field = "scenarios[i].mission_hours"`.

- Effect: the full allowed range (8,760 h at the default 10 min = 52,561 samples) is
  accepted for each scenario, so contract ranges and the cap no longer contradict.
- 1-minute steps are capped at 41.6 days per scenario.
- The 1 MB response budget (TRD 10.2) applies to the reference case (one lunar day,
  10 min). A 12-month compare is about 6 MB of series. That is accepted and documented,
  not silently downsampled.

Sweep grid: one 30-min grid over `range_start .. range_end + mission_hours`. The worst
case (183 days + 365 days) is 26,305 samples, inside the cap. Candidate days start at
00:00 UTC on each date in the range, both ends inclusive.

## C05 - data labels on /sites and /health (v1.1, optional fields)

- `GET /api/v1/sites`: add a top-level `data_label: "REAL" | "SYNTHETIC"` (optional in
  v1.1, so v1.0 clients ignore it). It is SYNTHETIC in fixtures and mock mode, and
  REAL only when the library is served from the sourced sites.json.
  - Per-site truth stays in `verified` and `source_url`.
  - The UI hides `verified: false` sites by default.
- `GET /health`: no new label. `mock: true` already means every endpoint serves
  SYNTHETIC fixtures, and the frontend shows the SYNTHETIC badge whenever it is true.
- Empty sweep: the real backend never returns `days: []` for a valid request, because
  every valid range has at least one candidate day. `sweep.empty.json` exists only to
  test the UI's empty state.

## C08 - coverage modes, tile edges, tile extent, export provenance

The coverage rule is deterministic and evaluated per scenario, in this order:

1. `lat_deg > -80.7` → `geometric`.
2. `terrain` if a near-field 20 m tile holds the **whole 20 km near-field disc** around
   the point, the site pixel is not nodata, and fewer than 2 % of skyline samples
   are nodata.
3. Else `terrain_coarse` if the 160 m far DEM covers the point, the site pixel is not
   nodata, and fewer than 2 % of samples are nodata.
4. Else `geometric`, with the "geometric horizon only" label.

Rays that leave the DEM's outer edge (about 80°S) stop there. That is a stated limit
(PRD 7.6), not nodata.

Tile extent: near-field tiles become **50 × 50 km** centred on each verified curated
pole site (TRD said 40 × 40 km).

- With 40 km only the exact tile centre has a full 20 km disc, so no custom point
  could ever get `terrain`.
- With 50 km, any point within 5 km of a curated site gets full terrain mode.
- Cost is about 2,500 × 2,500 float32 ≈ 25 MB per tile; real sizes are reported after
  cropping.

`GET /api/v1/terrain-tile` (v1.1 optional fields):

- `dem: string` and `resolution_m: number`. The tile comes from the near-field tile
  when the requested square fits inside one, otherwise it is resampled from the 160 m
  far DEM. The 3D view then shows which source it is.
- `grid_bearing_offset_deg: number` (see orientation below).

Export provenance (v1.1 optional field):

- Add `manifest_sha256: string | null` to `Meta` and to `/health`. It is the SHA-256 of
  `data/MANIFEST.json`, which lists every kernel and DEM file with its own SHA-256.
- Browser exports then carry `meta` (kernel names, DEM, step, observer height, app and
  contract version) plus this hash.
- No endpoint serves the full manifest. The methods page cites the committed
  validation results instead.

## Orientation: grid north vs local north (needed by 3D lighting, P5)

DEMs are south polar stereographic (TRD 4.2): `x = r sin(lon)`, `y = r cos(lon)`.

- For a point at east longitude `lon`, a direction at azimuth `A` (clockwise from local
  north) points along grid bearing `B = (A + lon) mod 360`, measured clockwise from the
  grid's +y axis.
- The relation is exact because the projection is conformal. P3 checked it numerically
  at three sites (-85.5/30, -86.2/210, -89/300; three azimuths each, exact to 0.001°).

Rule:

- Terrain tiles are served in the raster's native grid. Row 0 is the +y (top) edge and
  column 0 the -x edge. Tiles are not resampled to local north, which would lose
  detail and cost time.
- Contract text "north-up" becomes **"grid-up (+y of the south polar stereographic
  grid)"**, and the tile response adds `grid_bearing_offset_deg = lon_east_deg` of the
  tile centre.
- 3D lighting: the Sun direction in tile coordinates uses bearing `B = sun_az + offset`
  (clockwise from tile top) and elevation `sun_el`. The Earth marker works the same way.
- The skyline itself never uses grid directions: rays follow great circles from the
  site (TRD 4.3), so the skyline azimuths are true local azimuths.
- TO VERIFY at S1 (P3): the sign of x/y in the actual raster transform, checked against
  one known feature. If the raster uses `y = -r cos(lon)`, the offset becomes
  `180 - lon` and this note will be updated before P5 builds on it.

## PGDA 69 acquisition ownership

- **P3** owns acquisition: `scripts/download_dems.py --pgda69` fetches the south-pole
  average Sun and Earth visibility maps, records them in `data/MANIFEST.json`, and
  states the terms and citation.
- **P6** owns the V4 comparison script (`validation/v4_pgda.py`).
- P3 publishes a function to sample the maps at given lat/lon so P6 does not re-derive
  the projection.

## Escalation plan (P2 and P3 are one person)

The PRD checkpoint "Sun 02:00: P2 joins P3" adds no capacity. Proposal for the
Coordinator:

- Move V3 (synthetic flat/ridge skyline tests) to the **first** S1 task, before backend
  ephemeris work.
- New checkpoint **Sat 22:00**: if V3 is not passing, the Coordinator assigns a Python
  reviewer (P6 when they arrive, or P1 for review only) and P2 work (metrics) moves
  ahead while terrain is debugged.
- Sun 10:00 fallback unchanged: PGDA sky-visibility as a coarse check, labelled
  "terrain (preliminary)".
- Reviewer for P2/P3 pull requests: P1, or the Coordinator names one.

## Request-shape interpretations used by the S0 scaffold (please confirm, C06)

- Request `Site`: `site_id` alone is enough; otherwise both `lat_deg` and
  `lon_east_deg` are required.
- Pole rule: `|lat_deg| > 89.99` → 400 `INVALID_INPUT`. `lon_east_deg` must be in
  `[0, 360)`.
- `start_utc` must end in `Z`. Other UTC offsets are rejected, not converted.
- Threshold ranges: percentages 0–100 and hours ≥ 0. Mode presets are enforced by the
  frontend; the backend accepts any `mode` value and only echoes it.
