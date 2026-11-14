# Azelux frontend design system: "night almanac"

Product truth: `PRODUCT.md`. Tokens: `src/theme/tokens.css`; base elements:
`src/theme/global.css`; faces: `src/theme/fonts.css` (licences in `src/theme/fonts/README.md`).

## Direction contract

- **Thesis:** a night-edition lunar almanac. The visibility diagram is the page; everything
  else is tabulation and evidence.
- **First viewport:** the plan slip (A and B as segments of one perforated pass) beside a
  one-sentence conclusion, the verdict pair and the banded Sun/Earth/both visibility
  diagram. The starter example is computed on first visit (PRD 6.2), so the page is never
  empty.
- **Reading order:** conclusion → verdicts → visibility diagram + scrubber + countdowns →
  sky plates → panoramas → deltas → metrics table → sources, method and limits → raw data
  (Expert).
- **Signature interaction:** one scrubber moves the diagram rule, both sky plates, the
  panorama markers and the countdowns together (each mapped to its plan's own time).
- **Cross-surface:**
  - Best date is a numbered query slip (1 Site, 2 Landing days, 3 Mission) and a month
    strip (4 Pick a landing day) with a lifted focused day.
  - Methods is the almanac's explanatory supplement: a contents rail and one reading
    column.
  - Report is the printed almanac page, a paper sheet on screen and on print.
- **Risk guarded:** ruled-table grammar can turn into decorative hairlines. Every rule
  here separates data or steps.

Process: impeccable concept-seed (key `aa21021273f7ce1efcb57e88cff9d074`) assigned candidate
7 of a resonance-ordered list. A DSN link-display candidate was removed before the roll
because it would imply a guaranteed radio link. Challenger raises applied:

- **Boarding pass:** segmented plan slip.
- **Botanical folio:** identical A/B plates on one scale.
- **Crouwel grid:** functional rules.
- **Split-flap:** rows that update in place.

## Colour

| Role | Value |
| --- | --- |
| Ink ground / slip / plate | #0b0e15 / #11151d / #080a10 |
| Rules | #2a2f3b (strong #3d4351) |
| Ivory print | #ece8dd, muted #aeaa9d, faint #8f8b7f (≥ 4.5:1 on every dark surface) |
| Primary action, current nav | ivory #ece8dd with ink text (never a data hue) |
| Sun / Earth | #f2b544 / #5fa8ff |
| Plan A / B | #2fd0b9 / #b49cff |
| Verdict | green / amber / red, always with the word |
| SYNTHETIC | amber on #2b2208 |
| Report paper | #f6f3ea ground, #17181c ink (print-safe palette) |

## Type

- Gloock is the display serif: titles, the conclusion sentence, section heads, verdict
  words, delta numbers, day numbers and plan letters.
- Schibsted Grotesk (variable 400–800) is used for UI, body, tables and code.
- Signs (+/−) on deltas are set in the sans.
- Tabular figures are used only in table cells.
- No all-caps labels (except the mandated SYNTHETIC), eyebrows or middle-dot meta strings.

## Space, surfaces, controls

- 8 px scale.
- Sections are separated by full-width rules, not boxed cards. The slip and chart plates
  are the only framed objects.
- Pills for segmented choices and the primary action. Disclosures (map, thresholds) use a
  rotating "+".
- Desktop: the slip is sticky with the action pinned. Touch (< 64 rem): the action docks
  to the bottom edge (safe-area aware).
- Best date's action docks below 40 rem.

## Motion

- **New result:** a staged 280 ms reveal.
- **Sky plates:** tip from ground level to flat on scroll (CSS scroll-driven, progressive).
- **Best date:** the focused day lifts.
- **Buttons:** 140 ms press.
- **Never animated:** navigation, scrubbing and keyboard actions.
- **Reduced motion / print:** reduced motion removes the motion; print removes all of it.

## Truth rules

- Sky plates are **schematic data visualizations** of the response: not terrain imagery,
  not georeferenced and not a 3D model. Terrain 3D stays gated.
- The earthshine glow on the page background is atmosphere only.
- SYNTHETIC results always carry the badge and the "fixed test response" note.
