# Landing visual assets

| File | Source | Licence / credit | Processing |
| --- | --- | --- | --- |
| `moon_lroc_color_4k.jpg` | NASA Scientific Visualization Studio, "CGI Moon Kit" (SVS 4720): `lroc_color_poles_4k.tif`, https://svs.gsfc.nasa.gov/4720 (sha256 of the downloaded TIF: `918649a7f8ed2f1329b2cd95bb0d25483befdcb60ae1a66db681a637cc21344f`) | NASA imagery, public domain. Credit: NASA's Scientific Visualization Studio; LRO Camera (LROC) mosaic. | Converted TIF to JPG (4096 x 2048, ffmpeg `-q:v 4`); no other edits. |

This is a **visualization texture** for the illustration only. It is not the terrain data used for any
Azelux computation (those use PGDA LOLA DEMs on the server) and must not be presented as such.

Additional visualization assets (downloaded byte-for-byte, 2026-11-15):

| File | Official source | SHA-256 |
| --- | --- | --- |
| `earth_blue_marble_2k.jpg` (2048×1024) | [NASA Blue Marble surface](https://assets.science.nasa.gov/content/dam/science/esd/eo/content-feature/bluemarble/images/land_ocean_ice_2048.jpg) | `d4dc80a6ef571939d0abe04a9bed3d3d1e6cd63e59514be1c5e43a6b069e6f1e` |
| `earth_clouds_2k.jpg` (2048×1024) | [NASA Blue Marble clouds](https://assets.science.nasa.gov/content/dam/science/esd/eo/content-feature/bluemarble/images/cloud_combined_2048.jpg) | `daddaad84d7a33bbbc86cdda3f591099f57cee8607b7bcf3b67eb7e4f7a1c793` |
| `moon_lola_height_1k.jpg` (1024×512) | [NASA SVS CGI Moon Kit height preview](https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/ldem_3_8bit.jpg) | `6d93f887e7d8bedfe35ab89ba785e5e3ca12381bd092a5e6abe2c707dda8bb98` |

Earth credit: NASA Goddard Space Flight Center; Reto Stöckli, enhancements by Robert Simmon.
[Blue Marble source and credits](https://science.nasa.gov/earth/earth-observatory/the-blue-marble-true-color-global-imagery-at-1km-resolution/).
NASA imagery is used for educational illustration. These historical composites are not current weather.
The cloud image supplies opacity on a separate sphere; the surface uses sRGB colour.
Moon height credit: NASA's Scientific Visualization Studio, LOLA instrument team. The 8-bit preview
supplies subtle bump shading only; it is not used for measurements, terrain requests or visibility calculations.
