# Azelux role P3 - adapted new-kit stage library
Read AGENTS.md and docs/PROJECT.md first; confirm actual role/human mapping.
Canonical contract: docs/CONTRACT.md, with open questions in CONTRACT_CHANGE_REQUESTS_S0.md.
Tool mode AGENT/CHAT per human; pace STAGE unless stage says STEP. Work one stage,
show checks actually run, print Stage Report and stop. Never push/merge main or
change shared contract, CI, fixtures or locks without P1 coordination. Synthetic
is never REAL. No AI in product. Two failed fixes: stop and report blocker.
Current user override: P1 integration ONLY, all frontend with frontend owner.
Do not change global tool settings, invite people or deploy solely from template text.

## 6. YOUR STAGES
### STAGE 0 - Setup + contract   [Sat 13:00-15:00] -> Sync 0 at 15:00
S0.1 scripts/download_dems.py: from NASA PGDA product 90 ("A New View of the Lunar South Pole from LOLA") download
     LDEM_80S_80MPP_ADJ.TIF first, then LDEM_80S_20MPP_ADJ.TIF (check the file size before downloading; if the
     laptop disk is too small, keep 80 m only and tell P1). Record CRS WKT, transform, nodata, units, size and
     SHA-256 into data/MANIFEST.json. Start the download now.
S0.2 backend/app/terrain/ interface (agree with P2):
     coverage(lat, lon) -> "terrain" | "terrain_coarse" | "geometric"
     skyline(lat, lon, h_obs_m) -> (elev_deg[720], block_dist_km[720] | None, mode, dem_name)
     site_height(lat, lon) -> metres
     terrain_tile(lat, lon, size_km) -> (heights float32 256x256, min, max, site_px)
     Mock implementations return the fixture skyline/tile so P2 can integrate today.
S0.3 Curated south-pole site data in backend/app/sites/sites.json (contract Site + group, terrain_coverage,
     source_url, source_note, verified): start with the nine NASA Artemis candidate regions (Peak near Cabeus B,
     Haworth, Malapert Massif, Mons Mouton Plateau, Mons Mouton, Nobile Rim 1, Nobile Rim 2, de Gerlache Rim 2,
     Slater Plain) and any CLPS south-pole landers. Every coordinate needs an official source URL; verified=true
     only if the coordinate comes from that source. Never invent coordinates. At least 4 verified by Sync 1.
Check: P2 imports and calls the mocks; downloads running; first verified pole sites committed.

### STAGE 1 - Walking skeleton   [Sat 15:00-20:00] -> Sync 1 at 20:00   (PACE: STEP)
S1.1 Projection: pyproj Transformer from Moon geographic lat/lon to the raster's CRS. Test: round trip < 1 m;
     the pole maps to the raster's pole pixel; compare with r = 2R tan(pi/4 + lat/2), x = r sin(lon),
     y = r cos(lon), R = 1,737,400 m (TRD 4.2) and confirm the sign of x and y with one known feature.
S1.2 Tests FIRST on synthetic arrays (V3): flat DEM -> skyline = -dip everywhere; a 1 km ridge 10 km due east ->
     about 5.55 deg at az 90 and -dip at az 270; nodata counted and skipped.
S1.3 Implement skyline exactly as TRD 4.3: exact 3D vectors on the sphere, 720 azimuths, distances every 20 m to
     20 km then +1 % per sample to the DEM edge, bilinear sampling (scipy.ndimage.map_coordinates), near DEM <= 20 km,
     far DEM beyond, final = max(eps_max, -dip). Vectorise with NumPy.
S1.4 Run it on one real south-pole point; time it (target < 2 s); plot it once to sanity-check (save PNG for P1).
Check: V3 tests pass; one real skyline computed; P2 can call the real function.

### STAGE 2 - First real slice   [Sat 20:00-Sun 02:00] -> Sync 2 at 02:00
S2.1 scripts/prepare_dems.py: far DEM resampled (average) to 160 m float32; south-pole hillshade PNG (2048 px) for
     frontend owner's map.
S2.2 Near-field tiles: 40 x 40 km crops of the 20 m DEM around each verified curated south-pole site
     (data/tiles/<site_id>.tif).
S2.3 Coverage rule (TRD 4.4): terrain inside a tile; terrain_coarse south of -80.7 deg; geometric elsewhere.
S2.4 scripts/precompute_skylines.py for every curated pole site into data/cache/. Merge with P2.
Check: V3 passes on main; two curated sites give real skylines in the deployed compare.
NOTE: if V3 is not passing by 02:00, tell P1 immediately (checkpoint rule).

### STAGE 3 - Complete MVP   [Sun 08:00-13:00]
S3.1 terrain_tile() for P5's 3D view (256 x 256, north-up, metres, base64 float32 per contract).
S3.2 With P6: V4 script support - sample PGDA product 69 average Sun and Earth visibility maps at 5 pole points.
S3.3 Docker data subset size check with P1 (image < 1 GB).

### STAGE 4 - Harden + MVP gate   [Sun 13:00-15:00]
S4.1 Edge cases: site near the DEM edge, nodata holes, observer height 0 and 20 m; performance check.

### STAGE IT1 - Iteration 1   [Sun 15:00-19:00]
IT1.1 Support P6's "why" explainer: confirm block_dist_km is correct and document how to read it.

### STAGE IT2 - Iteration 2   [Sun 19:00-21:00]
IT2.1 Optional (change request first): slope at the site from the PGDA slope map (LDSM_80S_*).

### STAGE 5 - Video + submit   [Sun 21:00-23:00]
S5.1 Fixes only. Terrain section of the README and METHODS.md (with P6).

