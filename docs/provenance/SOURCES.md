# Source verification ledger - S0
Checked official documentation pages on 14 November 2026.

| Source | Observed evidence | Still unverified / owner |
| --- | --- | --- |
| [JPL Horizons API](https://ssd-api.jpl.nasa.gov/doc/horizons.html) | Documents observer ephemeris API and configurable observer/time/quantities | Person 4: live Moon observer query, Sun/Earth targets, observer header, frame, azimuth/elevation units, UTC interpretation, access conditions and raw response comparison |
| [NASA PGDA product 78](https://pgda.gsfc.nasa.gov/products/78) | Official page lists south-pole LOLA elevation products and metadata links | Person 6: exact file, terms, checksum, CRS/transform, units, footprint/nodata and skyline radius/settings |

Documentation access is NOT a live ephemeris result or raster validation.
No live Horizons request or terrain download was performed by Person 2 in S0.
No coordinates are offered as verified curated sites. Fixture A/B are synthetic.
Real-source acceptance requires raw response hashes, sanitized requests, acquisition
UTC, observer/time/units and processing revision. Cached data must retain original
acquisition provenance and be labelled cached. Terrain mode additionally needs an
inspectable product/coverage record. Do not store credentials or large raw terrain in git.
No licence/reuse permission is inferred from public availability.
