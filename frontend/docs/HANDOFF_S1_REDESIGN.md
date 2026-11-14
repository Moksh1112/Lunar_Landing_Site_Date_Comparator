# Frontend handoff: redesign, Best date, Report and export, Methods (acting P4/P5)

| Item | Value |
| --- | --- |
| Branch | `feat/p4-frontend-s0`. Built on `9901476` (the Compare journey); that work is kept. Integration status: see "Integration status (current)" at the end of this file; earlier per-push notes are historical. |
| Data | **All results are SYNTHETIC**: mock transport (`VITE_USE_MOCK=true`) and fixtures. No real-mode run. |
| Scope | Frontend only. No changes to `src/api/*`, fixtures, backend, root tooling, CI, lockfiles or `docs/` (P1). |
| Gate | No stage or Sync gate is claimed. P1 integrates. |

## PRD/TRD frontend checklist

| Req | Status | Where |
| --- | --- | --- |
| F1 site library, coordinate source | complete (follow-up) | `SiteSource`: the note, an http(s)-only link and an unverified/SYNTHETIC flag, on Plan cards, the Best-date form and result, and results/report sources |
| F2 custom coordinates, longitude conversion | complete | `compareForm.ts`, `sweepForm.ts` (tested) |
| F3 2D map | complete (no basemap) | `features/map/*`: CRS.Simple with polar-stereographic (TRD 4.2) and equirectangular views; clicking sets Plan A/B; curated pins; 80.7°S coverage outline. The map is lazy-loaded. The basemap is explicitly unavailable (see below). |
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
| F22/F23 Horizons and PGDA evidence on Methods | complete (display) | Evidence v1.0 parser and tables handle ok/invalid/unsupported/empty states and keep the SYNTHETIC, spot-check and owner-reported labels. The only evidence so far is a V1 spot check (backend branch). Full V1/V2/V4 results do not exist. |
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

## Follow-up 2: after integration `dee7e9e` (R1–R3 resolved by P1)

Status changes:

- **R1:** Leaflet is used. R2: the approved schema is implemented. R3: P1's verdict
  parity is merged unchanged.
- **Basemap: unavailable.** The map shows a coordinate grid only. Missing:
  - `data/dem/south_pole_hillshade_2048.png` and its CRS/bounds sidecar
    `south_pole_hillshade_2048.json`. `backend/docs/DATA_EVIDENCE.md` says
    `prepare_dems.py --hillshade` produced them, but they are not on this host or in git.
  - A sourced global equirectangular Moon image: no source is recorded anywhere.
  - A delivery route: CONTRACT v1.0 has no basemap endpoint, so serving one needs a v1.1
    decision from P1.
- **Map orientation:** follows the TRD 4.2 hand formula (0°E up). The TRD's "TO VERIFY"
  x/y sign check needs the raster, so the orientation is labelled schematic.
- **3D (F18): not built.** The gate is unmet:
  - three/react-three-fiber are not installed (P1 deferred them until the gate).
  - Only SYNTHETIC terrain tiles exist.
  - PRD 12.2 cuts 3D first.
- **Synthetic note:** Compare, Best date and Report now say a SYNTHETIC result is a fixed
  test response that does not reflect the entered coordinates or dates.

Backend branch `feat/p2-p3-backend-terrain` at `8cc3948`, fast-forwarded to `dee7e9e`:

- `backend/tools/evidence_from_horizons_spot_check.py` adapts the owner's
  `backend/docs/horizons_spot_check_S1.json` into
  `validation/results/V1-horizons-spot-check-S1.json`.
  - It recomputes nothing.
  - REAL, `spot_check`, `owner_reported`, 24 rows, PASS against the PRD 8.3 0.05° target.
- `backend/tests/test_evidence_adapter.py`: 4 passed (run with `--noconftest`, because
  the shared conftest needs `orjson`, which isn't installed on this host).
- The output was not validated with `jsonschema` (not installed). The test checks required
  and extra fields only.

Frontend checks:

- `tsc` clean, `eslint` clean, `vitest` 11 files / **114 passed**.
- `npm run build` and the mock build succeed. The map chunk is 47 kB gzipped and lazy.

Browser checks (mock):

- **Map clicks:** right of the pole → −82.50°, 89.79°E; above → 0.36°E; the marker lands
  on the click point. In the global view, 3/4 width → 278.9°E.
- **Methods:** the V1 evidence card shows 24 rows (using a local, uncommitted copy of the
  backend-branch file).
- **Downloads:** the real button path, intercepting `createObjectURL`, gives
  `azelux-compare-synthetic-*.csv` (provenance header, 98 series rows) and `.json`
  (`provenance.data_label` SYNTHETIC; the request keeps the entered site).
- **Print:** headless Edge `Page.printToPDF` of a populated `/report` (via CDP) gives
  5 pages. Fixed in print: scroll-clipped tables, whole-section page breaks, the
  mock-variant select, and table overflow. Pages are in `docs/screenshots/print-report-page*.png`.
  An interactive browser print dialog was not opened.
- **Widths:** at 375 px, Compare with the map and Methods with evidence have
  scrollWidth = 375. 768 px is fine.

**P1 action (historical):** integrate backend `8cc3948` and frontend `dbd4349`. This is done; see "Integration status (current)".

## Follow-up 3: "earthshine" visual refinement (frontend/DESIGN.md)

**References** (look and feel only; no content, layout, artwork or code taken):

- pluto-drone, idr-tech and elites-ivory were opened and scrolled in the built-in browser.
  - IDR needed about 10 s to get past its loader. Its font is Sometype Mono, which was
    not adopted.
- The second link list was not reviewed in depth.

**Skills read on this machine:**

- impeccable 4.7.0: launcher context, `craft-floor`, `operate` and the `detect` command.
  - The detector first flagged Instrument Sans/Serif as overused; I switched to Gloock and
    Schibsted Grotesk.
  - It now reports `[]`.
- emil-design-eng: the animation decision framework.
  - Motion is limited to state changes plus one scroll moment.
  - Nothing animates on scrubbing or keyboard actions.
  - Reduced motion is respected.
- web-design-guidelines: rules re-fetched earlier. Already met: focus first invalid field,
  `scroll-padding`, `…` ellipses, `touch-action`.
- design-taste-frontend: read. Its marketing-site rules (no captions under visuals, one
  section per screen) conflict with the required chart text summaries, so the
  requirements win.
- Anthropic `frontend-design`: installed to `~/.claude/skills/frontend-design` from
  github.com/anthropics/skills. Applied:
  - two distinct families
  - no all-caps labels, eyebrows or middle-dot meta strings
  - one bold element (the stage)
- GSAP and Lenis: not used. A planning workspace keeps native scrolling, the single scroll
  moment is pure CSS, and there are no dependency or lockfile changes.

**What changed:**

- **Palette:** earthshine ink palette, with a regolith primary action and pill navigation.
- **Fonts:** self-hosted OFL Gloock (display) and Schibsted Grotesk (UI), latin subset,
  about 73 kB.
- **Delta signs:** set in the sans so a minus sign is never faint.
- **Verdict words:** sentence case in the display serif.
- **Compare stage:** a new focal block under the verdicts and deltas.
  - `SkyRing` per plan: the horizon unrolled around a circle, the skyline band shaded,
    Sun and Earth tracks solid or dotted, markers at the scrubber time.
  - The timeline, scrubber and at-time readout sit in the same block.
  - The rings tip from a ground-level perspective to flat as they scroll into view
    (CSS `animation-timeline: view()`, off under reduced motion and in print).
  - The rings are **schematic data visualizations** of response data, not terrain imagery,
    a georeferenced view or a 3D model. F18 stays gated.
- **F17 fix:** panorama and ring markers now map the scrubber to each plan's own time
  (`absoluteTime`). Before, in mission-day mode the panorama received a raw offset.
- **New results:** a staged 260 ms reveal.
- **Inputs:** a sticky desktop rail with the Compare button pinned.

**Checks:**

- `tsc` clean, `eslint` clean, `vitest` 12 files / **118 passed** (new: sky-ring mapping).
- `npm run build` and the mock build succeed. impeccable `detect`: `[]`.
- **Headless Edge renders** (CDP; `docs/screenshots/`) at 1440 / 768 / 375, plus the
  loading and error states:
  - scrollWidth is 375 on `/`, `/best-date`, `/methods` and `/report`.
  - At 768 px, scrollWidth is 753 against a 768 px viewport.
- **Keyboard:** focus the scrubber and press ArrowRight ×6. The readout moves from
  mission start to 00:06 UTC.
- **Reduced motion** (emulated): ring `animationName` and `transform` are both `none`.
- **Print:** `Page.printToPDF` of a populated `/report` gives 5 pages.
- **Screenshot timing:** `desktop-1440-best-date.jpg` was captured before the last tweak
  that removed tabular figures from the Best-date stats (it shows wider spacing).

**Still limited:**

- No sourced lunar basemap.
- 3D/WebGL gated: needs three.js in the lockfile (P1) and real terrain tiles.
- All data SYNTHETIC except the owner-reported V1 spot check (backend branch).

## Integration status (current)

- P1 integration `918d973` contains frontend `dbd4349` and backend `8cc3948` plus the
  backend fix `d0f81b6`. It is merged into `feat/p4-frontend-s0` with the redesign
  (`a9ee826`) preserved.
- With the integrated `validation/results/V1-horizons-spot-check-S1.json`, the Methods page
  renders that owner-reported V1 **spot check** at build time. This is not complete
  scientific validation.
- **Fonts:** OFL licence texts and source references are in `src/theme/fonts/` (`README.md`, plus one `*-OFL.txt` per family).
- **Still outstanding:**
  - full terrain 3D (F18 gate, three.js/lockfile, real terrain tiles)
  - real lunar basemaps (sourced imagery, georeferencing and a delivery route)
  - complete scientific validation (full V1/V2, V3 and V4 evidence)
- Data shown in the app remains SYNTHETIC.

## Follow-up 4: "night almanac" redesign (supersedes earthshine; see DESIGN.md)

Changes:

- **Compare** is rebuilt as an almanac spread:
  - A sticky plan slip (A/B perforated segments with Site / Point / Landing / Mission
    rows; map and thresholds in disclosures; touch-docked action).
  - Results in a deliberate order: a one-sentence conclusion (derived only from the A − B
    `both_hours` delta, tested), verdict pair, visibility diagram + scrubber + countdowns,
    schematic sky plates, panoramas, deltas, metrics, then sources and limits.
  - The starter example is computed on first visit (PRD 6.2).
- **Best date** is a numbered workflow (1 Site, 2 Landing days, 3 Mission, then 4 Pick a
  landing day) with large weekday-labelled day cells and a lifted focused day.
- **Methods** is editorial: a sticky contents rail and one reading column.
- **Report** is a paper document on screen, matching print.
- **New theme:** ink ground with ivory print, ruled structure in place of card stacks, and
  an earthshine atmosphere on the page background (atmosphere only).
- **Navigation** link transitions were removed, so the active state paints instantly.

Skills applied:

- **impeccable:** context, `new-work`, concept-seed roll and challenger raises, craft-floor,
  operate, detect `[]`. Wrote `PRODUCT.md` (inferred from PRD/TRD; no interview held).
  The `surface-brief write` command failed with a path error, so the direction contract is
  recorded in `DESIGN.md` instead.
- **emil-design-eng:** no motion on high-frequency actions; one staged reveal;
  reduced motion respected.
- **web-design-guidelines:** rules re-applied.
- **Anthropic frontend-design:** one bold element; no default treatments.
- **design-taste-frontend:** marketing-page rules conflict with required chart summaries,
  so the requirements win.
- **Not used:** GSAP, Lenis and component libraries (no need, no dependency).

References: pluto-drone, idr-tech and elites-ivory were reviewed earlier this session (the
mobile pass was skipped at the user's request), plus the awesome-design-md `spacex` entry.
Other listed galleries were not reviewed.

Checks:

- `tsc` and `eslint` clean; `vitest` 13 files / **122 passed**; `npm run build` and the
  mock build succeed; impeccable detect `[]`.
- Headless Edge (CDP) at 1440 / 768 / 375:
  - At 375 px, `/`, `/best-date`, `/methods` and `/report` all have scrollWidth = 375.
  - Keyboard scrubbing moves the readout.
  - Reduced motion turns ring motion off.
  - The error state shows the inline field error and the alert.
- Print: `/report` gives 5 pages. Screenshots are in `docs/screenshots/`.

Still limited:

- No real lunar basemap.
- Terrain 3D gated.
- Validation is only the owner-reported V1 spot check.
- All app data is SYNTHETIC.
