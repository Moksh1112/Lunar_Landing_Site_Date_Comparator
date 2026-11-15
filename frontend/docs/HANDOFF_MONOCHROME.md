# Unified monochrome theme: handoff to P1 (15 Nov 2026)

Branch `codex/unified-monochrome-theme`, based on integration `3721130`. Presentation only:
no backend, API contract, verdict, threshold, dataset, dependency, lockfile or real/mock
configuration change. Do not merge from here; P1 integrates after green CI.

## Ownership (proposed; no other agent session was reachable to confirm)

- **This branch (frontend owner):** frontend theme files only:
  - `src/theme/tokens.css`, `src/theme/global.css`
  - `src/app/AppShell.*`, `src/components/states.module.css`
  - `src/features/{compare,report,landing,sim}` CSS
  - `SimulatorPage.tsx` (spark colour only)
  - `DESIGN.md`, this note
- **Not touched:**
  - backend, `docs/` (P1)
  - CI, root tooling, lockfiles
  - every other frontend source file
- **Overlap:** none. P1's checkout had no uncommitted frontend changes when the branch was
  created.

## What changed

- **Tokens:** black #000 canvas, #111/#1A1A1A surfaces, #F5F5F5/#B8B8B8 text, neutral
  #3A3A3A/#737373 borders.
- **Buttons:**
  - Primary: white with near-black text.
  - Secondary: transparent, neutral border, white text.
  - Disabled: dashed border plus reduced opacity.
- **States that don't rely on colour:** the selected segmented control inverts to white; the
  active nav item is a filled white pill; focus is a 2 px white outline, including PillNav
  (`--pn-ring`).
- **Data hues kept:** Sun, Earth, Plan A/B, verdicts and SYNTHETIC are lifted for contrast on
  black (DESIGN.md table, measured). A/B tags use black letters on screen and white in print
  (`--color-tag-ink`).
- **Simulator and tour:** their scoped palettes now mirror the tokens. The Moon, textures,
  terrain, stars, room, lighting and camera are unchanged.
- **Report:** dark sheet on screen. `@media print` restores white paper, dark text and
  print-safe hues.

## Checks run (theme worktree)

- `tsc -b`, `eslint src`: clean. `vitest`: 17 files, 142 passed. `vite build`: OK.
- **Route sweep (CDP, headless Edge, mock data):**
  - Routes: /landing, /landing/tour, /, /best-date, /methods, /report and a 404.
  - Viewports: 320×640, 375×812, 768×1024, 1440×900, 1440×600.
  - Result, 35/35: no horizontal overflow, no control clipped off-screen, black body, no
    script errors.
- **Real-backend smoke (health `mock:false`, manifest `1dcb16ff…`, contract 1.1), REAL
  responses:**
  - **Simulator:** practice → qualification (240 h) → pause dialog (focus on Resume) → B
    2027-03-14 GREEN.
    - Debrief lines show "terrain, REAL, DEM LDEM_80S_20MPP_ADJ tile im2-athena + far_160m".
    - Handoff to `/` reads "Plan B gets 210.1 h more…".
  - **Best date:** IM-2 Athena, 2026-03-01..14 at 708 h gives 14 red terrain days. "Load as
    Plan B" returns to Compare.
  - **Compare → Report:** the screen is a dark sheet. Print emulation gives a white body and
    sheet, ink #17181C, 5 charts, SPICE provenance and the REAL label.
- **Keyboard:** Tab order is skip link, brand, then nav. The focus outline is 2 px white.
  The PillNav ring was near-black before this fix, so it is fixed here.
- **Reduced motion:** the tour hero renders fully visible.
- **impeccable detect:**
  - One low-contrast flag on PillNav's hidden hover label: a false positive, since it only
    shows over the white hover fill.
  - Existing layout notes left as is: Methods line length, the Report empty-state box, and
    the tour's large h1 and nested panels.

Screenshots and the print PDF are local, not committed:

- `C:/azx/shots-mono/` (route sweep)
- `C:/azx/shots-mono-flow/` (journeys, focus, `report-print-filled.jpg`, `report.pdf`)

Scripts: `C:/azx/mono_sweep.mjs`, `C:/azx/mono_flow.mjs`, `C:/azx/mono_print.mjs`.

## Not verified

- Physical phones and tablets, and screen readers.
- Native print dialogs in other browsers.
- Map tiles' appearance beyond the sweep.
- The Export menu click in the scripted run: the script's selector missed the disclosure. The
  Export control is visible on Compare and Report.
- This is a styling check only; it is not scientific or real-data acceptance.
