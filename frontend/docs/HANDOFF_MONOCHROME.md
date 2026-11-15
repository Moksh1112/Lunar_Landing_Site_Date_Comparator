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
  active nav item has a white underline; focus is a 2 px white outline.
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
  (PillNav, whose ring was near-black, was later replaced by SiteNav.)
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

## Navigation flow (second commit on this branch)

Landing → main app, Landing → "What is Azelux?" → tour → app, and Landing → optional
simulator → app. The tour and simulator are optional.

**Routes:** see the route map in `DESIGN.md`.

- `/` is now Home, and the comparator moved to `/compare`.
- Legacy `/landing`, `/landing/tour` and `/tour` redirect with replace, keeping query and hash.
- API routes are unchanged.

**Files:**

- New:
  - `src/app/routes.ts` (rules), `src/app/routeObjects.tsx` (routes, legacy redirect, 404)
  - `src/app/SiteNav.tsx` and `.module.css` (nav, Learn menu, compact menu, Back)
  - `src/features/home/*`
  - `src/app/__tests__/routes.test.ts`
- Edited:
  - `router.tsx`, `AppShell.*`
  - BestDate / Methods / Report / Simulator / tour internal links
  - tour CSS (mobile header)
- Removed: the PillNav component (replaced by SiteNav).

**Simulator handoff:** unchanged logic. It sets the same store state and resets the scrubber,
then navigates to `/compare`.

**Checks:**

- `tsc`, `eslint`: clean. `vitest`: 18 files, 148 passed (6 new route tests). Build: OK.
- **Real-backend journeys** (CDP, `C:/azx/nav_flow.mjs`, health `mock:false`):
  - **Home:**
    - Compare landing plans → `/compare`.
    - What is Azelux? → `/learn/tour` → Open comparator → `/compare`.
  - **Legacy links:**
    - `/landing?mock=compare:error` → `/learn/simulator?mock=compare:error`; Back then skips
      the redirect.
    - `/landing/tour#h-sim` → `/learn/tour#h-sim`; `/tour` → `/learn/tour`.
  - **Back on direct entry:** /methods, /best-date and /report go to /compare. Home has no Back
    control.
  - **Back in the app:** internal Back from Methods goes to /compare. Browser Back then goes to
    /, and Forward to /compare.
  - **Reload:** after reloading /compare, which was reached in-app, Back returns to the earlier
    Azelux page (/report). That is expected; the fallback applies only when there is no app
    entry.
  - **Empty pages:** /report shows its empty state. An unknown path shows the 404 with Home and
    Compare.
  - **Menus:**
    - Learn menu: opens with Quick tour and Simulator; Escape closes it and returns focus to
      Learn.
    - At 375 px the Menu opens with the active page marked; Escape closes it and returns focus
      to Menu. No overflow.
  - **Best Date** (IM-2 Athena) → Load as Plan B → `/compare` showing "Best date 2026-03-01".
  - **State across pages:** the comparison result is the same after Compare → Methods → Compare.
  - **Report:** opened from the results link; print emulation gives a white body, 8 SVGs and the
    REAL label.
  - **Simulator** from Home: qualification passed (240 h, B 2027-03-14 GREEN). "Open in the
    comparator" goes to `/compare` with "Plan B gets 210.1 h more…".
  - **Plain simulator exit** with no result → `/compare` shows the usable comparator.
- **Layout sweep:** 8 routes at 320×640, 375×812, 768×1024, 1440×900, 1440×600 and
  1280×560.
  - Result, 48/48: no horizontal overflow, no clipped controls, black body, no script errors.
  - A visual check at 320 found Back overlapping the brand. Fixed: Back and Menu now sit on a
    second header row.
- **Screenshots** are local, not committed: `C:/azx/shots-nav/` and `C:/azx/shots-nav-sweep/`.
- **Not verified:** physical devices and screen readers.
