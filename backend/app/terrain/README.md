# Terrain module (Azelux P3)

Status: S0 interface only. No real DEM code yet (arrives in S1).

- `interface.py`: `TerrainProvider` protocol, `SkylineResult`, `TileResult`, `NotInCoverage`, constants.
- `geometric.py`: exact smooth-sphere horizon dip, `acos(R / (R + h_site + h_obs))`.
- `mock.py`: `MockTerrain` serves SYNTHETIC fixtures for latitude <= -80.7 deg, geometric skyline elsewhere.
- `get_terrain_provider(use_mock, fixtures_dir, data_dir)` returns the mock; real mode raises `NotImplementedError` (never silently synthetic).

Horizon modes: `terrain`, `terrain_coarse`, `geometric`. Skyline: 720 values, 0.5 deg steps, azimuth from north clockwise.
