# Azelux frontend design system: "light lunar atlas"

Locked by the user's brief (15 Nov 2026). It replaces the earlier earthshine and night-almanac
themes; no skill direction roll overrides it. This light default is a user-authorized deviation
from the TRD's "dark default" note. Product truth: `PRODUCT.md`. Tokens:
`src/theme/tokens.css`. Font: `src/theme/fonts.css` (licence in `src/theme/fonts/README.md`).

## Principles

A precise, contemporary scientific planning interface. The comparison is the workspace:

- compact A/B summaries with Edit plans and Compare
- then one result sentence, concise verdict status labels, and the aligned Sun/Earth/both
  timeline with the scrubber
- secondary sections for sky rings and panoramas, deltas, metrics, and sources and limits
- raw data in Expert

Grouping comes from whitespace and alignment, not stacked cards.

## Colour

| Role | Value | Contrast (measured) |
| --- | --- | --- |
| Canvas / main surface / secondary | #F5F3ED / #FFFFFF / #ECEFF0 | |
| Primary / secondary text | #18252B / #50616A | 14.1:1 / 5.8:1 on canvas; 6.4:1 secondary on white |
| Borders | #D4DCDA (strong #A9B6B4) | |
| Primary action | #244BB3, white text | 7.7:1 |
| Plan A / Plan B | #086C65 / #A44828 | 6.3:1 / 5.9:1 on white; white tag text ≥ 5.9:1 |
| Sun / Earth | #956000 / #245BB5 | 5.3:1 / 6.5:1 on white |
| Verdict green / amber / red | #1D7A3E / #8A5A00 / #B3261E | ≥ 5.4:1 on white, always with the word |
| SYNTHETIC | #7A4F00 on #FFF3D4 | 6.5:1 |

Line styles (solid visible, dotted hidden), A/B letter tags and verdict words always accompany
colour.

## Type

- Schibsted Grotesk only; hierarchy by size, weight and spacing.
- Sizes: page title 34 px (700); result sentence 24–28 px (650); section heads 18 px (650);
  body and controls 16 px; small 13–14 px.
- Tabular figures only in table cells and numeric readouts.
- No serif, no all-caps labels except the mandated SYNTHETIC marker.

## Controls and surfaces

- Radii are 6 px (controls) and 8 px (surfaces). No pills, no oversized rounded buttons.
- The header is white with plain links and a 2 px cobalt active indicator (no floating pill
  nav, no transition).
- Primary action is cobalt; secondary buttons are white with a strong border.
- Exports live in one secondary "Export" menu (CSV, JSON, printable report).
- Disclosures (Edit plans editor, map, thresholds, sky and horizon views) are inline; no
  modals.

## SYNTHETIC communication

- A global thin banner stays at the top.
- One concise notice sits near the results: "Fixed synthetic example — results do not
  reflect the entered plans." The full explanation is in its expandable details and in
  exports and Report.

## Motion

- One staged reveal for a new result, plus a 140 ms press on buttons.
- The schematic sky rings tilt to flat on scroll (CSS scroll-driven).
- Nothing animates on navigation, scrubbing or keyboard actions.
- Reduced motion and print remove motion.

## Truth rules

- Sky rings are schematic data visualizations of the response: not terrain imagery, not
  georeferenced, not 3D. Terrain 3D stays gated.
- SYNTHETIC results are always labelled; REAL results show their ephemeris, horizon mode
  (terrain / terrain coarse / "geometric horizon only") and DEM.

## Optional presentation route: /landing

Reviewed for the user's requested landing integration on 15 November 2026.
This standalone dark page introduces the comparator; it does not change the app's
light default. All procedural/schematic numerical illustrations are SYNTHETIC and
link to the actual comparator for sourced computation. Its historic example is
labelled as recorded, and scientific status points to Methods including V4's failure.
