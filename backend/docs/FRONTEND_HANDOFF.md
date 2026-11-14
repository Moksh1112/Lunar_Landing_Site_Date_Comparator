# Backend/terrain → frontend handoff (P2 + P3)

This is what the frontend owner needs to call the real backend. Contract:
`docs/CONTRACT.md` v1.0. Open proposals are in `backend/docs/CONTRACT_PROPOSALS_C03_C09.md`;
nothing below changes the contract.

## Transport

- Base URL: `VITE_API_URL`; the backend runs on `:8000`, or any port. `VITE_USE_MOCK=true`
  serves fixtures with no backend.
- CORS uses exact origins only: `AZX_CORS_ORIGINS` must list the dev origin, e.g.
  `http://127.0.0.1:5173` (defaults: `localhost` and `127.0.0.1` on port 5173).
- Every error uses the contract shape `{"error":{"code","message","details":[{field,reason}]}}`.
  Show `message` to the user. Codes:

  | Code | HTTP | Note |
  | --- | --- | --- |
  | `INVALID_INPUT` | 400 | |
  | `NOT_FOUND` | 404 | unknown `site_id` |
  | `RANGE_TOO_LARGE` | 413 | |
  | `NOT_IN_COVERAGE` | 422 | |
  | `RATE_LIMITED` | 429 | **proposed**, already implemented; honour `Retry-After` |
  | `INTERNAL` | 500 | |

- Every response carries an `X-Request-ID` header; include it in bug reports.

## Request limits to mirror in inline validation

- `lat_deg` in [-90, 90] and `|lat_deg| <= 89.99`.
- `lon_east_deg` in [0, 360). Convert -180..180 input before sending.
- `start_utc`: exactly `YYYY-MM-DDTHH:MM:SS[.f]Z`, between 1900-01-01 and 2149-12-31, and
  the mission must end by 2149-12-31.
- `mission_hours` 1..8760. `step_minutes` an integer 1..60 (default 10).
  `observer_height_m` 0..20 (default 2).
- **At most 60,000 time samples per request (TRD 10.1).**
  - Compare: `sum(ceil(mission_hours*60/step)+1)` over both scenarios.
  - Two 8,760 h scenarios at 10 min are rejected (413); 8,760 h + 708 h is accepted.
- Sweep: the range is at most 183 days (inclusive), and the date strings are `YYYY-MM-DD`.
- Rate limits per IP: compare 30/min and sweep 6/min.

## Results: reading them correctly

- **Deltas are A minus B.** The DeltaStrip copy "B: -31 h sunlight" means display
  **-(delta)**.
- `meta.horizon_mode`:
  - `terrain`: 20 m tile + 160 m far field.
  - `terrain_coarse`: 160 m only.
  - `geometric`: show the label **"geometric horizon only"** (mandatory).
  - Also show `meta.dem` and the step on every result (F20).
- `meta.data_label`: show a **SYNTHETIC** badge whenever it is not `"REAL"`. Mock mode is
  always SYNTHETIC. The real backend never falls back to fixtures: with no data it
  returns 500 or 422 errors.
- `series.t_unix` holds integer Unix seconds and starts at that scenario's own
  `start_utc`. For `alignBy: "mission_day"`, map one scrubber offset to
  `t = t_unix[0] + offset_s` in each scenario. Proposal C07; no schema change.
- `windows.*[]`: edges are interpolated between samples. `start_censored` /
  `end_censored` mean the window extends beyond the mission.
- `skyline.elev_deg[720]` is at 0.5° steps; azimuth is from local north, clockwise.
  `block_dist_km` is null in geometric mode.
- Verdict cross-check: `backend/tests/cases/verdict_cases.json` has 8 cases. The `rule`
  string explains the inclusive band edges. Python rounds exact halves to even.
- **Sweep:** `days[]` is sorted by date. `rank` 1..N, where 1–5 are `refined: true` and
  re-ranked on 10-min metrics. `top` lists the five best dates in order.

## Coverage behaviour (where terrain applies)

| Point | horizon_mode |
| --- | --- |
| `lat_deg > -80.7` (anywhere off the south-pole DEM) | `geometric` |
| South of -80.7°, the whole 20 km disc inside a 50 km tile around a curated site (today: IM-2 Athena and IM-2 intended; a point within about 5 km of them) | `terrain` |
| Other points south of -80.7° | `terrain_coarse` |
| Site pixel nodata, or 2 % or more nodata samples | downgraded one level |

`GET /api/v1/skyline` and `/terrain-tile` return **422 `NOT_IN_COVERAGE`** for
`geometric` points. The 3D view then shows a smooth sphere patch.

## 3D terrain tile (orientation)

- `heights_m_b64`: little-endian float32, 256 × 256, row-major.
- **Grid-up, not north-up:** row 0 is the +y edge of the south polar stereographic grid
  and column 0 the -x side. `site_px` is `[128, 128]`.
- Lighting: a direction at azimuth **A** lies at tile bearing **`(A + site lon_east_deg)
  mod 360`**, clockwise from the tile top. Use it for the Sun light direction (elevation
  `sun_el`) and the Earth marker. The rule is exact; it was verified against the DEM
  transform and NASA's IM-1 elevation.
- The source is the 20 m tile when the square fits inside it, otherwise 160 m.
  `size_km` must be in (0, 40].

## South-pole hillshade for the 2D map (F3)

**Data file:** `<AZX_DATA_DIR>/dem/south_pole_hillshade_2048.png`.

- 4,179,785 B, sha256 `030477d0…6b1a979` (full hash in `DATA_EVIDENCE.md`).
- The georeferencing sidecar is `south_pole_hillshade_2048.json`.
- The PNG is not in git; P1 decides how it reaches the frontend: copy it into
  `frontend/public/`, or serve it from the backend.

| Property | Value |
| --- | --- |
| Size | 2048 × 2048 RGBA; nodata = transparent |
| CRS | Moon (2015) sphere, south polar stereographic (`lat_0 = -90`, `lon_0 = 0`, R = 1,737,400 m, IAU:30135) |
| Bounds (m) | left -304000, bottom -304000, right 304000, top 304000; pixel 296.875 m |
| Orientation | row 0 = +y (top), column 0 = -x (left) |
| Source | `far_160m.tif` (2×2 mean of PGDA 90 `LDEM_80S_80MPP_ADJ`) |
| Hillshade | Sun azimuth 315°, altitude 45° |
| Citation | Barker et al. 2023, PSJ 4, 183, doi:10.3847/PSJ/acf3e1 (PGDA product 90) |

Pixel ↔ lat/lon (Leaflet `CRS.Simple`), with R = 1,737,400 m:

```
r = 2R·tan(π/4 + lat/2)        lat in radians, negative south
x = r·sin(lon),  y = r·cos(lon)
col = (x + 304000) / 296.875,  row = (304000 - y) / 296.875
```

Inverse, for click → lat/lon:

```
x = col·296.875 - 304000,  y = 304000 - row·296.875
r = hypot(x, y),  lon = atan2(x, y) mod 360,  lat = 2·atan(r / 2R) - π/2
```

Draw the terrain-coverage circle at lat = -80.7°, which is r = 282.6 km (row 72 at lon 0).

These formulas were checked by round trip: (-84.7906, 29.1957) → col 1283.7, row 559.2 →
back to the same lat/lon to 1e-6°.

## Site library

`GET /api/v1/sites` (real mode) returns 3 verified pole sites, each with `source_url`:

- IM-1 (north of -80.7, so geometric).
- IM-2 Athena.
- IM-2 intended.

Two more verified sites (LCROSS impact, Shackleton crater) are waiting for the
`reference` group (proposal C09). The Artemis III regions have no official numeric
centres, so they are not in the library.
