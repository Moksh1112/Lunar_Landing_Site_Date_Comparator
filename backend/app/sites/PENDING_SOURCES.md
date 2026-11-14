# South-pole sites waiting for an official coordinate source (P3)

Rule (PRD 8.2): no coordinate enters `sites.json` without an official source link, and
`verified: true` only when the number comes from that source. Never estimate.

## Artemis III candidate landing regions (NASA, Oct 2024)

Source: <https://www.nasa.gov/news-release/nasa-provides-update-on-artemis-iii-moon-landing-regions/>
(checked 2026-11-14). The page lists the region names and a map, but **no numeric centre
coordinates**. NASA says it will pick specific sites within regions later.

- Peak near Cabeus B
- Haworth
- Malapert Massif
- Mons Mouton Plateau
- Mons Mouton
- Nobile Rim 1
- Nobile Rim 2
- de Gerlache Rim 2
- Slater Plain

Next places to look (S1): NTRS site-selection papers, the Artemis III Science Definition
Team report, and LROC "Artemis III candidate regions" posts. If no numeric source exists,
these stay out of the site library (the UI calls them "Artemis candidate landing regions",
PRD 8.1). A named site could be represented by a sourced point inside the region only if
an official source gives that point.

## Other candidates not yet checked

- Shackleton rim / connecting-ridge points from Mazarico et al. 2011 (Icarus 211, 1066)
  and PGDA product 69 documentation.
- Later south-pole landers (2025-2026) with LROC-published coordinates.

Target from the P3 prompt: at least 4 verified pole sites by Sync 1 (3 verified so far).
