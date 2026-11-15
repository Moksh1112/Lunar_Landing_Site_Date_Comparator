# Azelux frontend design system: "unified monochrome"

Approved by the user on 15 Nov 2026. It replaces the light lunar atlas for every route:
/landing, /landing/tour, /, /best-date, /methods, /report and shared chrome. Product truth:
`PRODUCT.md`. Tokens: `src/theme/tokens.css` (simulator and tour mirror them in their
scoped variables). Font: `src/theme/fonts.css` (licence in `src/theme/fonts/README.md`).
Visual references were NASA+ screenshots for tone only (black canvas, white type, charcoal
surfaces); no NASA logo, graphic, copy or layout is reproduced.

## Principles

A precise, contemporary scientific planning interface. The comparison is the workspace:

- compact A/B summaries with Edit plans and Compare
- then one result sentence, concise verdict status labels, and the aligned Sun/Earth/both
  timeline with the scrubber
- secondary sections for sky rings and panoramas, deltas, metrics, and sources and limits
- raw data in Expert

Grouping comes from whitespace and alignment, not stacked cards.

## Colour

Interface chrome is black and white. Colour appears only where it carries meaning.

| Role | Value | Contrast (measured) |
| --- | --- | --- |
| Canvas / primary surface / raised | #000000 / #111111 / #1A1A1A | |
| Primary / secondary text | #F5F5F5 / #B8B8B8 | 19.3:1 / 10.6:1 on black; 8.8:1 secondary on #1A1A1A |
| Dividers / control borders | #3A3A3A / #737373 | control border 4.4:1 on black |
| Primary action | #F5F5F5, text #0A0A0A | 18.2:1 |
| Secondary action | transparent, #737373 border, white text | |
| Focus | 2 px #FFFFFF outline, 2 px offset | 21:1 on black |
| Plan A / Plan B | #2FD0B9 / #FF8A5C | 9.8:1 / 8.1:1 on #111111; A/B tags use black letters (10.8:1 / 9.0:1) |
| Sun / Earth | #F2B544 / #6EA8FF | 10.3:1 / 7.8:1 on #111111 |
| Verdict green / amber / red | #4FD88A / #F6C445 / #FF7A7A | >= 7.5:1 on #111111, always with the word |
| SYNTHETIC | #F6C445 on #1F1806 | 10.8:1 |

Semantic exceptions (kept on purpose): Sun, Earth, Plan A/B, verdict and SYNTHETIC hues,
the 3D Moon, terrain, stars and room materials. Charts keep their hues and legends.
Selected, disabled and active states never rely on colour alone: selected segmented
controls invert to white, disabled controls get a dashed border, the active nav item has a white underline.

Print (/report and any browser print) restores white paper with dark text and the earlier
print-safe data hues (`global.css` and `report.module.css` print blocks).

## Type

- Schibsted Grotesk only; hierarchy by size, weight and spacing.
- Sizes: page title 34 px (700); result sentence 24–28 px (650); section heads 18 px (650);
  body and controls 16 px; small 13–14 px.
- Tabular figures only in table cells and numeric readouts.
- No serif, no all-caps labels except the mandated SYNTHETIC marker.

## Controls and surfaces

- Radii are 6 px (controls) and 8 px (surfaces). No pills, no oversized rounded buttons.
- The header carries the brand (to Home), a Back control (hidden on Home) and the main nav:
  Home · Compare · Best Date · Learn (Quick tour, Simulator) · Methods. The active page has a
  2 px white underline (a left bar in the compact menu); below 48rem the nav collapses into a
  Menu button (Escape closes and returns focus).
- Primary action is white with near-black text; secondary buttons are transparent with a
  #737373 border and white text.
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
The simulator and tour share the monochrome theme above. All procedural/schematic numerical illustrations are SYNTHETIC and
link to the actual comparator for sourced computation. Its historic example is
labelled as recorded, and scientific status points to Methods including V4's failure.

## Routes and navigation

| Route | Page |
| --- | --- |
| `/` | Home: headline, Compare landing plans, What is Azelux?, Try the simulator, three pillars |
| `/compare` | Comparator |
| `/best-date`, `/methods`, `/report` | Best Date, Methods, Report (Report is linked from results) |
| `/learn/tour`, `/learn/simulator` | Optional tour and simulator (own full-screen chrome with Home and Open comparator) |

Legacy links redirect with replace semantics, keeping the query and hash:

- `/landing` → `/learn/simulator`
- `/landing/tour` and `/tour` → `/learn/tour`

Back goes to the previous Azelux entry when the router has one (`location.key !== "default"`).
Otherwise it falls back to a fixed page:

- tour, simulator → Home
- Best Date, Methods, Report → Compare
- Compare → Home

Rules and tests: `src/app/routes.ts`, `src/app/__tests__/routes.test.ts`.
