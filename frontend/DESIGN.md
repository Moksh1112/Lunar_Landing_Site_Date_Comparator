# Azelux frontend design system: "earthshine"

Surface mode: **Operate**. Azelux is a planning workspace, not a landing page. One bold
thing, the comparison stage, sits inside a quiet, disciplined tool. Tokens:
`src/theme/tokens.css`; base elements: `src/theme/global.css`; faces: `src/theme/fonts.css`.

## Direction

The lunar night lit by earthshine: cool blue-ink surfaces, and pale "regolith" for the
primary action. **Hue is only for data** (TRD 7.6):

| Meaning | Token |
| --- | --- |
| Base / surfaces | `--color-bg` #0b1019 → `--color-surface` #111827 → `-2` #172033 → `-3` #1f2a40 |
| Text | #ecf0f7, muted #a7b2c7, faint #8794ad (all ≥ 4.5:1 on every surface) |
| Primary action, current nav | `--color-action` #e8e2d4 (regolith), with ink text |
| Sun / Earth | amber #f2b544 / blue #5fa8ff |
| Plan A / Plan B | teal #2fd0b9 / violet #b49cff, as "A"/"B" tags, ring outlines and serif letters |
| Verdict | green / amber / red, always with the word (sentence case) |
| SYNTHETIC | amber on #2b2208 |

## Type

Two families (TRD 7.6), self-hosted under the SIL OFL 1.1 with the latin subset. Licences and
sources are in `src/theme/fonts/README.md`.

- **Gloock** (high-contrast display serif) is the display voice: page and section titles, the wordmark,
  verdict words, delta values, and the A/B ring letters. Numbers in the display serif are
  the type treatment that carries the page.
- **Schibsted Grotesk** (variable weight 400–800) is used for every UI label, body text, table
  and code chip, with `tabular-nums` on data.

Avoided on purpose: all-caps labels (except the mandated SYNTHETIC label), eyebrows,
middle-dot meta strings, and a monospace face for small data.

## Layout

```
[ wordmark ]        ( Compare | Best date | Methods | Report )        [ Simple | Expert ]
+ input rail (sticky, own scroll) +  Result title, SYNTHETIC, exports ----------------------+
| preset segmented control        |  synthetic-result note                                 |
| Plan A card                     |  verdict A | verdict B                                 |
| Plan B card                     |  B compared with A (serif delta numbers)               |
| Pick on map (lazy)              |  STAGE: "The sky above each site"                      |
| thresholds                      |     sky ring A    sky ring B     (shared scale)        |
| [Compare A and B] pinned        |     timeline lanes + scrubber + at-time readout        |
+---------------------------------+  panoramas, metrics, sources and method, raw (Expert)  |
```

Everything is left-aligned. One column below 64 rem; no horizontal scroll at 375 px.

## The stage (focal point)

`SkyRing` unrolls each site's horizon around a circle:

- Azimuth runs clockwise from north at the top.
- Elevation on the shared y scale runs inward.
- The skyline band is shaded.
- Sun and Earth tracks are solid when visible and dotted when below the skyline.
- The markers follow the shared scrubber, mapped to each plan's own time (F17).

It is a **schematic data visualization** drawn only from the compare response. It is not
terrain imagery, not georeferenced and not a 3D model, and it does not bypass the 3D gate.

## Motion

Motion appears only for state changes and one authored moment:

- **New result:** blocks rise in order (260 ms, ease-out, 40 ms stagger).
- **Scroll:** the sky rings tip from a ground-level perspective to flat as they enter
  view. This uses CSS scroll-driven animation as progressive enhancement, with no
  GSAP/Lenis dependency.
- **Buttons:** 140 ms press.

Never applied: scrubbing and keyboard actions are instant. `prefers-reduced-motion`
removes the scroll tilt and the reveal. Print removes all motion.

## Print

Light paper. App chrome and the mock-variant select are hidden. Scroll regions expand,
long text cells wrap, and figures and table rows stay unbroken.
