# Azelux data evidence (kernels, DEMs, illumination maps, derived products)

Generated 2026-11-14 17:18 UTC from `MANIFEST.json` by `backend/tools/data_evidence.py`. Binaries, caches and keys are NOT in git; this file is the record.
Sizes are exact bytes on disk; SHA-256 computed after download/creation. Raster fields are read from the files themselves.

## Files

| File | Role | Bytes | SHA-256 | Source / derivation |
| --- | --- | ---: | --- | --- |
| `dem/LDEM_80S_20MPP_ADJ.TIF` | near-field DEM source (20 m; cropped to tiles by prepare_dems.py) | 2,696,082,051 | `09b7ca80f9e6a146f970225d18af72fc02787669b3ef51b888e347d2b6845649`<br>md5 `cbfec0c5192d2e6ecabddd18f2338bf7` | https://pgda.gsfc.nasa.gov/data/LOLA_20mpp/LDEM_80S_20MPP_ADJ.TIF |
| `dem/LDEM_80S_80MPP_ADJ.TIF` | far-field DEM source (80 m; resampled to 160 m by prepare_dems.py) | 189,158,392 | `82030dcbdd7c4bb0c7d858e9b4b293b9f2cda5a543ba31ec0f42784bd6beee5a`<br>md5 `553e840f769805963c7b854727cd6286` | https://pgda.gsfc.nasa.gov/data/LOLA_20mpp/LDEM_80S_80MPP_ADJ.TIF |
| `dem/far_160m.tif` | dem-derived | 36,909,329 | `43e014ebbc6ee794cfd8ed02767c36fb2f8b70b21e00827b9639acfa9d7ca68a` | derived from `dem/LDEM_80S_80MPP_ADJ.TIF`: 2x2 block mean over valid pixels (NaN-aware), float32 |
| `dem/south_pole_hillshade_2048.json` | dem-derived | 1,233 | `c2facbeb1934312b99ad4c67ae5da3c869b2a5c0875253486cb539c39d9bb50e` | derived from `dem/south_pole_hillshade_2048.png`: georeferencing sidecar (CRS + bounds) |
| `dem/south_pole_hillshade_2048.png` | dem-derived | 4,179,785 | `030477d025594ed137bba16038ff8762a3636f835e63da15c9f43676e6b1a979` | derived from `dem/far_160m.tif`: hillshade az 315 alt 45, 2048 px RGBA PNG |
| `illumination/AVGVISIB_85S_060M_201608.TIF` | V4 reference: average Sun visibility 85-90 S, 60 m | 33,994,464 | `ccf67d4f39e0a970c111196da7d6551ffcf50d075470b93067fb3904c0b05806`<br>md5 `68c7b3bf19d1d5bd12fad3129efee325` | https://pgda.gsfc.nasa.gov/data/MoonIllumination/AVGVISIB_85S_060M_201608.TIF |
| `illumination/AVGVISIB_85S_060M_201608_EARTH.TIF` | V4 reference: average Earth visibility 85-90 S, 60 m | 24,862,958 | `d71dc5adfff653e0e924e0a4cbf03795b996caa30b4ace3d5843a70a5ab2f3d2`<br>md5 `3a7334761aeb126f68a262f65982dafa` | https://pgda.gsfc.nasa.gov/data/MoonIllumination/AVGVISIB_85S_060M_201608_EARTH.TIF |
| `kernels/de440s.bsp` | Sun, Earth, Moon positions (DE440 short span) | 32,726,016 | `c1c7feeab882263fc493a9d5a5b2ddd71b54826cdf65d8d17a76126b260a49f2`<br>md5 `3917ee56769db332790c751e2168843d` (matches NAIF published) | https://naif.jpl.nasa.gov/pub/naif/generic_kernels/spk/planets/de440s.bsp |
| `kernels/moon_de440_250416.tf` | lunar frames: MOON_ME / MOON_PA aliases (DE440) | 19,478 | `a47c71e9c9f33796bdafb2c9d69a7ee447b6016ecad80f71cd6f3e479f9cf768`<br>md5 `3556dde4bb7ca54a89917c301e650bbf` | https://naif.jpl.nasa.gov/pub/naif/generic_kernels/fk/satellites/moon_de440_250416.tf |
| `kernels/moon_pa_de440_200625.bpc` | high-accuracy lunar orientation (DE440) | 12,863,488 | `60cd55aa401ea2ea97360636f567554bfe4e37bb829f901b4460a455dfaf783f`<br>md5 `9f48a8c4cf1c955ac5d3a7d77a127e42` | https://naif.jpl.nasa.gov/pub/naif/generic_kernels/pck/moon_pa_de440_200625.bpc |
| `kernels/naif0012.tls` | leap seconds (UTC to ET) | 5,257 | `678e32bdb5a744117a467cd9601cd6b373f0e9bc9bbde1371d5eee39600a039b`<br>md5 `25a2fff30b0dedb4d76c06727b1895b1` | https://naif.jpl.nasa.gov/pub/naif/generic_kernels/lsk/naif0012.tls |
| `kernels/pck00011.tpc` | body radii and constants | 131,226 | `3dff7b1dbeceaa01f25467767d3fa25816051c85d162d1edf04acb310ee28bb1`<br>md5 `3c0bdc01bb4101d6242cf96ece67a586` | https://naif.jpl.nasa.gov/pub/naif/generic_kernels/pck/pck00011.tpc |
| `tiles/im2-athena.tif` | tile | 12,492,133 | `c72001e2504bf7764008ef8826e3e4e2dcde552d679a7b8d098134f91a015b12` | derived from `dem/LDEM_80S_20MPP_ADJ.TIF`: 50 km square crop centred on im2-athena |
| `tiles/im2-intended.tif` | tile | 12,493,665 | `cf6e69e34316a900ae1d1af3fb67313462e04b69859ed488cc542236c2f6dbb7` | derived from `dem/LDEM_80S_20MPP_ADJ.TIF`: 50 km square crop centred on im2-intended |

## Raster metadata (read from each file)

### `dem/LDEM_80S_20MPP_ADJ.TIF`
- CRS: Moon (2015) - Sphere / Ocentric / South Polar; parameters {'proj': 'stere', 'lat_0': -90, 'lon_0': 0, 'R': 1737400, 'x_0': 0, 'y_0': 0, 'units': 'm'}
- Transform (a, b, c, d, e, f): [20.0, 0.0, -304000.0, 0.0, -20.0, 304000.0]; size 30400 x 30400 px
- Bounds (m): [-304000.0, -304000.0, 304000.0, 304000.0]
- dtype float32; nodata nan; scale/offset [1.0, 0.0]
- Units: metres relative to the 1,737.4 km sphere (PGDA 90)

### `dem/LDEM_80S_80MPP_ADJ.TIF`
- CRS: Moon (2015) - Sphere / Ocentric / South Polar; parameters {'proj': 'stere', 'lat_0': -90, 'lon_0': 0, 'R': 1737400, 'x_0': 0, 'y_0': 0, 'units': 'm'}
- Transform (a, b, c, d, e, f): [80.0, 0.0, -304000.0, 0.0, -80.0, 304000.0]; size 7600 x 7600 px
- Bounds (m): [-304000.0, -304000.0, 304000.0, 304000.0]
- dtype float32; nodata nan; scale/offset [1.0, 0.0]
- Units: metres relative to the 1,737.4 km sphere (PGDA 90)

### `dem/far_160m.tif`
- CRS: Moon (2015) - Sphere / Ocentric / South Polar; parameters {'proj': 'stere', 'lat_0': -90, 'lon_0': 0, 'R': 1737400, 'x_0': 0, 'y_0': 0, 'units': 'm'}
- Transform (a, b, c, d, e, f): [160.0, 0.0, -304000.0, 0.0, -160.0, 304000.0]; size 3800 x 3800 px
- Bounds (m): [-304000.0, -304000.0, 304000.0, 304000.0]
- dtype float32; nodata nan; scale/offset [1.0, 0.0]
- Units: metres relative to the 1,737.4 km sphere (derived from PGDA 90)

### `illumination/AVGVISIB_85S_060M_201608.TIF`
- CRS: Moon2000_spole; parameters {'proj': 'stere', 'lat_0': -90, 'lon_0': 0, 'R': 1737400, 'x_0': 0, 'y_0': 0, 'units': 'm'}
- Transform (a, b, c, d, e, f): [60.0, 0.0, -151740.0, 0.0, -60.0, 151740.0]; size 5058 x 5058 px
- Bounds (m): [-151740.0, -151740.0, 151740.0, 151740.0]
- dtype int16; nodata -32768.0; scale/offset [4e-05, 0.0]
- Units: fraction of timesteps 0..1 after scale 4e-5 (PGDA 69 PDS label)

### `illumination/AVGVISIB_85S_060M_201608_EARTH.TIF`
- CRS: Moon2000_spole; parameters {'proj': 'stere', 'lat_0': -90, 'lon_0': 0, 'R': 1737400, 'x_0': 0, 'y_0': 0, 'units': 'm'}
- Transform (a, b, c, d, e, f): [60.0, 0.0, -151740.0, 0.0, -60.0, 151740.0]; size 5058 x 5058 px
- Bounds (m): [-151740.0, -151740.0, 151740.0, 151740.0]
- dtype int16; nodata -32768.0; scale/offset [4e-05, 0.0]
- Units: fraction of timesteps 0..1 after scale 4e-5 (PGDA 69 PDS label)

### `tiles/im2-athena.tif`
- CRS: Moon (2015) - Sphere / Ocentric / South Polar; parameters {'proj': 'stere', 'lat_0': -90, 'lon_0': 0, 'R': 1737400, 'x_0': 0, 'y_0': 0, 'units': 'm'}
- Transform (a, b, c, d, e, f): [20.0, 0.0, 52100.0, 0.0, -20.0, 163000.0]; size 2500 x 2500 px
- Bounds (m): [52100.0, 113000.0, 102100.0, 163000.0]
- dtype float32; nodata nan; scale/offset [1.0, 0.0]
- Units: metres relative to the 1,737.4 km sphere (cropped from PGDA 90, 20 m)

### `tiles/im2-intended.tif`
- CRS: Moon (2015) - Sphere / Ocentric / South Polar; parameters {'proj': 'stere', 'lat_0': -90, 'lon_0': 0, 'R': 1737400, 'x_0': 0, 'y_0': 0, 'units': 'm'}
- Transform (a, b, c, d, e, f): [20.0, 0.0, 52100.0, 0.0, -20.0, 163360.0]; size 2500 x 2500 px
- Bounds (m): [52100.0, 113360.0, 102100.0, 163360.0]
- dtype float32; nodata nan; scale/offset [1.0, 0.0]
- Units: metres relative to the 1,737.4 km sphere (cropped from PGDA 90, 20 m)

## Citations

- Barker et al. 2023, PSJ 4, 183, doi:10.3847/PSJ/acf3e1
- Mazarico et al. 2011, Icarus 211, 1066, doi:10.1016/j.icarus.2010.10.030

## Commands (reproduce from an empty AZX_DATA_DIR outside any cloud-synced folder)

```
python scripts/download_kernels.py --data-dir <AZX_DATA_DIR>
python scripts/download_dems.py --data-dir <AZX_DATA_DIR> --pgda69
python scripts/download_dems.py --data-dir <AZX_DATA_DIR> --inspect
python scripts/prepare_dems.py --data-dir <AZX_DATA_DIR> --far --hillshade
python scripts/prepare_dems.py --data-dir <AZX_DATA_DIR> --tiles
python scripts/precompute_skylines.py --data-dir <AZX_DATA_DIR>
python backend/tools/data_evidence.py --out backend/docs/DATA_EVIDENCE.md
```

