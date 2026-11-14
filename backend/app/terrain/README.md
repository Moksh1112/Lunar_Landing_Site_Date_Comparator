# Terrain module (Azelux P3)

Status: S2. A real DEM-backed provider is in place. The 20 m near-field tiles are built
by `scripts/prepare_dems.py --tiles` once the 20 m DEM is downloaded.

- `interface.py`: `TerrainProvider` protocol, `SkylineResult`, `TileResult`,
  `NotInCoverage`, constants.
- `geometric.py`: exact smooth-sphere horizon dip, `acos(R / (R + h_site + h_obs))`.
- `sampling.py`: the `HeightSampler` contract (heights + footprint) and `FunctionSampler`
  for synthetic tests.
- `raster.py`: `RasterSampler`, which reads PGDA GeoTIFFs with rasterio windowed reads
  and pyproj in the raster's own Moon CRS.
  - Bilinear interpolation at pixel centres.
  - Sign convention confirmed: `x = r sin(lon)`, `y = r cos(lon)`, checked against
    IM-1's 2,579 m elevation.
- `skyline.py`: TRD 4.3 skyline (exact 3D vectors, 720 azimuths). V3 tests are in
  `tests/test_skyline_v3.py`.
- `real.py`: `RealTerrain`, label REAL.
  - Coverage rule C08:
    - `geometric` north of -80.7°.
    - `terrain` when a near tile holds the whole 20 km disc.
    - `terrain_coarse` on the 160 m far DEM otherwise.
  - Downgrades one level when nodata is 2 % or more.
  - Disk skyline cache in `<data>/cache`. Terrain tiles are grid-up.
- `mock.py`: `MockTerrain` serves the SYNTHETIC fixtures for latitude <= -80.7° and a
  geometric skyline elsewhere.
- `get_terrain_provider(use_mock, fixtures_dir, data_dir, dem_far)` returns
  `MockTerrain` or `RealTerrain`. There is never a silent fallback to synthetic data.

Horizon modes: `terrain`, `terrain_coarse`, `geometric`. Skyline: 720 values at 0.5°
steps, azimuth from north, clockwise.

3D orientation: a direction at azimuth `A` points along tile grid bearing
`(A + lon_east) mod 360`, measured clockwise from the tile top.
