# Frontend handoff: redesign, Best date, Report and export, Methods (acting P4/P5)

| Item | Value |
| --- | --- |
| Branch | `feat/p4-frontend-s0`. Built on `9901476` (the Compare journey); that work is kept. |
| Data | **All results are SYNTHETIC**: mock transport (`VITE_USE_MOCK=true`) and fixtures. No real-mode run. |
| Scope | Frontend only. No changes to `src/api/*`, fixtures, backend, root tooling, CI, lockfiles or `docs/` (P1). |
| Gate | No stage or Sync gate is claimed. P1 integrates. |

## PRD/TRD frontend checklist

| Req | Status | Where |
| --- | --- | --- |
| F1 site library, coordinate source | complete (follow-up) | `SiteSource`: the note, an http(s)-only link and an unverified/SYNTHETIC flag, on Plan cards, the Best-date form and result, and results/report sources |
| F2 custom coordinates, longitude conversion | complete | `compareForm.ts`, `sweepForm.ts` (tested) |
| F3 2D map | **blocked** | Needs the `leaflet` + `react-leaflet` dependency (lockfile, P1) and the Moon/hillshade basemaps (terrain owner). See request R1. |
| F4 A/B scenarios | complete | `/` |
| F5 mission length 1–8,760 h, default 708 | complete | |
| F6 mode presets with linked fields | complete | `ModePresets` (the active preset's hint is now visible text) |
| F7 best-date finder: ranked list, calendar strip, "Load as B" | **complete (new)** | `/best-date`: `features/bestdate/*` |
| F10 "geometric horizon only" label | complete | Source badges, provenance, exports |
| F12 next sunset/Earthset countdown | **complete (new)** | `moment.ts`, `MomentReadout` |
| F13 A−B deltas | complete | Table plus a "B compared with A" strip with better/worse words |
| F14 browser verdict recompute on threshold edit | **complete (new)** | `verdict.ts` (8-case table); the card notes the server verdict |
| F15 panorama | complete | Restyled |
| F16 aligned timeline (calendar / mission day) | complete | Restyled |
| F17 scrubber: all views agree | complete (2D) | Panorama markers, timeline and readout all use the store's `scrubT`; the 3D view does not exist |
| F18 3D view | **blocked** | `three`/`@react-three/fiber` dependencies (P1 lockfile) and the section 12 gate |
| F19 Simple/Expert toggle | complete (follow-up) | Expert adds:<br>• 0.01° precision and the sample step for each plan<br>• run details, including the frame (MOON_ME, a method constant) and tolerances (pending R2)<br>• a skyline readout on pointer hover<br>• raw time-series and skyline tables (`RawData`, first 500 rows, all rows in CSV/JSON) |
| F20 source label on every result | complete | Compare, Best date, Report and the exports |
| F21 loading / empty / invalid / error states | complete | Every async view; inputs kept; focus moves to the first invalid field |
| F22/F23 Horizons and PGDA evidence on Methods | **blocked (empty state)** | `validation/results/*.json` does not exist, and its schema is not in the contract (R2) |
| F24 Methods and sources page | **complete (new)** | `/methods`: method, data products, live `/health` loaded resources, limits, glossary. Linked from every result. |
| F25 CSV/JSON export with provenance; PDF via print of `/report` | **complete (new)** | `features/export/*`, `/report` with print stylesheet. The manifest hash is reported as unavailable (C08). |
| PRD 6.4 glossary on hover | complete (follow-up) | `Term`: opens on hover, or on focus plus Enter/Space; Escape closes it; the definition is announced. Used on solar elevation, skyline, Earthset, libration and DTE. One source shared with Methods (`glossary.ts`). |
| TRD 7.6 design tokens, contrast ≥ 4.5:1 | complete | `frontend/DESIGN.md` |
| TRD 10.3 at 375 px without horizontal scroll | complete | Checked on every route |

## Requests to P1 (not changed here)

- **R1 (dependency/lockfile):** approve `leaflet`, `react-leaflet@5`, `three` and
  `@react-three/fiber@9` for F3/F18. The terrain owner also needs to supply the basemap
  assets and the 80.7°S coverage outline.
- **R2 (contract):** define the `validation/results/*.json` schema (P6) so Methods can
  render the F22/F23 tables. Until then Methods lists the files without interpreting them.
- **R3 (C02/C06):** decide the boundary tolerance for the verdict rule. In IEEE doubles
  `1.2 × 48 = 57.599…`, so a gap of exactly 57.6 h is RED in both TypeScript and Python.
- C03–C09, React 19 and the audit override stay as recommendations in
  `FRONTEND_POSITIONS_S1.md` and are not treated as approved.

## Checks (in `frontend/`)

| Command | Result |
| --- | --- |
| `npx tsc --noEmit` | clean |
| `npx eslint .` | clean |
| `npx vitest run` | 8 files, **89 tests passed** (39 new: verdict, countdown/moment, export, sweep form, validation evidence) |
| `VITE_USE_MOCK=true npm run build` | built. Main chunk 520 kB minified, with the existing Vite >500 kB warning. |
| impeccable `detect` | 0 findings |
| `prettier --check` | 56 files flagged, including untouched files (Windows line endings), so it was **not** run with `--write` |

## Browser checks (built-in browser, mock dev server, port 5181)

- **Compare at 1440:** verdict cards, delta strip, metrics, sources, panoramas, timeline.
  The keyboard scrubber (PageUp) moves the timeline line, the readout and the countdowns
  together.
- **Thresholds:** setting minimum sunlight to 35 % moves B's failures to Earth only
  (AMBER), and the card shows "Recomputed… Server verdict: amber".
- **Best date:** progress text and skeletons, a 14-day calendar (G/A/R letters), day
  detail, and the top-5 table.
  - "Load as Plan B" fills B with site −85.5/30, start 2027-03-04 and 708 h, then
    returns to `/`.
  - `sweep:error` shows an inline field error and Retry.
  - `sweep:empty` shows an empty state with the SYNTHETIC label.
  - Enter submits the form.
- **Compare error (`compare:error`, 768 px):** message, code and Retry; inline field error;
  inputs kept.
- **Invalid latitude + Enter:** focus moves to the invalid field.
- **Report:** plans, verdicts, deltas, charts, provenance, Print, CSV and JSON.
- **Methods:** validation empty state is shown.
- **Widths:** at 375 px, `/`, `/best-date`, `/methods` and `/report` have
  scrollWidth = 375. The 768 px width is also fine.
  - A real overflow bug (a visually hidden span in a scrolled table) was found and fixed.

Screenshots are in `frontend/docs/screenshots/`. Not verified:

- The print preview was not rendered (only the stylesheet exists).
- No real backend was used.
- Downloaded CSV/JSON were checked by unit tests, not opened from a browser download.

## Follow-up: F1 sources, inline glossary, Expert completeness

`verdict.ts`, dependencies and lockfiles were not touched, as P1 asked. Built in worktree
`work/fe-s1` with `npm ci` from the existing lockfile.

Checks:

- `tsc --noEmit` clean; `eslint .` clean.
- `vitest`: 9 files, **98 passed** (9 new: glossary coverage, `findSite`/`safeHref`,
  `skylineAt`).
- `VITE_USE_MOCK=true vite build`: built.

Browser checks (mock):

- **F1:** the source note and `example.invalid` link appear with "Unverified (SYNTHETIC)"
  on the Plan A card, the result sources, the Best-date form and the Best-date result.
- **Glossary:** focus the help button and press Enter: `aria-expanded=true` and the
  definition is announced. Escape closes it.
- **Expert:** hovering the panorama shows "Azimuth 174.0°: skyline 0.56°, blocked at
  42.21 km". Raw data shows 49 series rows, and the skyline shows "First 500 of 720 rows".
- **375 px:** with all glossary tips open, scrollWidth is 375.

Screenshots: `desktop-1440-expert-*.jpg` and `mobile-375-glossary-help.jpg`.
