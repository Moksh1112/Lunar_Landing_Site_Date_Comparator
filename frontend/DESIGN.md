# Azelux frontend design system

Surface mode: **Operate** (a planning tool, not a landing page). The interface should
disappear into the comparison task. Tokens: `src/theme/tokens.css`; base elements:
`src/theme/global.css`.

## Direction

A restrained graphite scientific console. Chrome is neutral. **Hue is only for data**,
following TRD 7.6:

| Meaning | Token |
| --- | --- |
| Sun | `--color-sun` (amber) |
| Earth | `--color-earth` (blue) |
| Plan A / Plan B | `--color-a` (teal) / `--color-b` (violet), shown as an "A"/"B" tag |
| Verdict | `--color-green` / `--color-amber` / `--color-red`, always with the word |
| SYNTHETIC | `--color-synthetic` on `--color-synthetic-bg` |

The primary action (Compare, Find best dates, Load as Plan B) is neutral white
(`.btn-primary`), so it never reads as a data hue.

## Rules

- Dark theme by default; print switches to light paper (`@media print` in `global.css`).
- Two font families: a system sans for UI and a system mono for code. Fixed rem scale
  with ratio about 1.2. Every number column uses `tabular-nums`.
- 8 px spacing scale (`--space-*`). Radii are 4, 6 and 10 px. Elevation is a 1 px
  border; there are no decorative shadows or glows.
- One button vocabulary (`button`, `.btn`, `.btn-primary`, `.segmented`) across all routes.
- Motion conveys state only: a 140 ms press and hover feedback, and the skeleton shimmer.
  `prefers-reduced-motion` removes it.
- Text contrast is at least 4.5:1 on every surface (measured values are in the
  `tokens.css` header). Focus is a 2 px white ring via `:focus-visible`.
- Layout: input rail on the left and results on the right at 64 rem and wider; a single
  column below that. There is no horizontal scroll at 375 px.
- Every chart has a text summary. Never hide "geometric horizon only", the DEM name or
  the SYNTHETIC label.
