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

## Verified coordinates waiting only for a contract group value (proposed v1.1: `group: "reference"`)

Both are inside terrain coverage (≤ -80.7°) and were checked on the official page on
2026-11-14. They are held back only because the contract's `group` enum
(`apollo | clps | commercial | international | artemis_candidate`) has no honest value
for a NASA impactor site or a named crater. Proposal: add `"reference"` (an optional new
enum value, v1.1). Once approved, add them to `sites.json`:

| site_id | name | lat_deg | lon_east_deg | source | evidence |
| --- | --- | --- | --- | --- | --- |
| `lcross-impact` | LCROSS Centaur impact site (Cabeus crater) | -84.6796 | 311.2907 | <https://ntrs.nasa.gov/citations/20140005563> (Marshall et al., "Locating the LCROSS Impact Craters") | "weighted average Centaur impact location of −84.6796 deg, −48.7093 deg"; 1σ 115 m in lat, 44 m in lon |
| `shackleton-crater` | Shackleton crater | -89.66 | 129.20 | <https://lroc.im-ldi.com/posts/993> (LROC "On the Rim!", 2018) | "Shackleton crater (21 km diameter, 89.66°S, 129.20°E)" |

Notes:

- LCROSS: the published longitude -48.7093 is read as east-positive, so 311.2907 E. That
  is consistent with Cabeus lying in the western longitudes.
- Shackleton: these are the coordinates the caption gives for the crater, which is
  effectively its centre (a crater floor), not a landing site.

## Other candidates not yet checked

- Shackleton rim / connecting-ridge points from Mazarico et al. 2011 (Icarus 211, 1066)
  and PGDA product 69 documentation.
- Later south-pole landers (2025-2026) with LROC-published coordinates.

Target from the P3 prompt: at least 4 verified pole sites by Sync 1 (3 verified so far).
