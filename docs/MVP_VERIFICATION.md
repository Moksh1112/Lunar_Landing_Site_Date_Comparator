# MVP verification ledger — 15 November 2026

## Current F1–F25 status (authoritative, release preparation, 15 Nov 2026)

How to read the Status column:

- **Verified:** complete, with evidence.
- **Fixed:** a demonstrated defect, fixed and checked.
- **Human:** a human or device check is pending.
- **Decision:** an explicit scope or acceptance decision is needed.
- **Limit:** a known limitation kept in the release material.

The evidence uses REAL integrated runs with headless Edge and viewport emulation, unless
stated otherwise. No physical device was used. Owner-reported items stay owner-reported.

| Item | Status | Evidence / what remains |
| --- | --- | --- |
| F1 Library | Verified + **Decision** + Limit | Ten entries match their primary sources (`evidence/SITE_SOURCE_REVIEW_2026-11-15.md`). International and commercial breadth is partial, and two entries are not actual landings. Moksh: accept or extend. |
| F2 Coordinates | Verified | Integrated acceptance: API boundaries and inline UI validation. |
| F3 Map | Verified + **Human** | Sourced assets render. Cross-device touch interaction pending. Map attribution control is off; confirm the basemap credit is shown elsewhere (licence checklist). |
| F4 Two plans | Verified | Real browser journeys (Compare, simulator handoff +210.1 h). The deployed rehearsal waits for authorization. |
| F5 Mission length | Verified | 0 / 1 / 8760 / 8761 h and step bounds (API). |
| F6 Presets | Verified | Date-shift preset applied in the browser. |
| F7 Best Date | Verified + **Human** | 1 / 183 / 184-day bounds; Load as Plan B; single submit. Slow-device run pending. |
| F8 Ephemeris | Verified + Limit | V1/V2 pass. No external scientific certification. |
| F9 Skyline | Verified | Real near+far terrain in Compare and Best Date. |
| F10 Coverage modes | **Fixed** (`fd38ce5`) | Near-only returns TerrainUnavailable; near+far is `terrain`; far-only is `terrain_coarse`; outside coverage is `geometric` (real data). |
| F11 Visibility | Verified + Limit | V3/V5 pass. Runtime uses body centres; see F23. |
| F12 Metrics / countdowns | Verified | Censored windows checked through the API. Gap panel shows censoring in the browser (`HANDOFF_GAP_BRIEFING.md`). Countdowns covered by earlier browser evidence. |
| F13 Deltas | Verified | Every delta equals A − B (real). Gap comparison uses labelled A and B values. |
| F14 Verdicts | Verified | Real red/green. Local threshold re-verdict covered by unit tests. |
| F15–F17 Panorama / timeline / scrubber | Verified | Keyboard scrub syncs the views; gap focus and event jumps move the shared scrubber; mission-day alignment works. |
| F18 Terrain 3D | Verified + **Human** | The no-WebGL fallback renders. Slow-device performance pending. |
| F19 Simple / Expert | Verified + **Human** | Raw-data table and keyboard checks done. Spoken screen-reader session pending. |
| F20 Provenance | Verified | CSV, JSON, report and briefing carry REAL/SYNTHETIC, mode, DEM and manifest. |
| F21 UI states | **Fixed** (`f9a842d`) + Verified | 429, blocked API with Retry, slow network, single submit. |
| F22 Horizons | Verified + Limit | V1/V2 artifacts pass; validation only. |
| F23 PGDA | **Decision recorded** | V4 FAIL 6.299 pp (unchanged). V4b adopted by Moksh, 10/10 within 5 pp, max 4.134843 pp. Runtime stays centre-based; V4b does not validate it. `backend/docs/V4_DECISION_2026-11-15.md`. |
| F24 Methods | Verified (`b2b7cc9`) | Rendered: V4 fail, V4b pass, decision note with limits, no invalid evidence files. |
| F25 Export / report | Verified | Real CSV/JSON; print preview white, 8 charts, REAL. Physical print is not required (TRD: PDF via browser print). |
| Gap / explain / briefing (authorized Iteration-1 extensions) | Verified | `frontend/docs/HANDOFF_GAP_BRIEFING.md`: real data; the downloaded file replayed offline with 0 requests; no-JS view, print and safety tests. |
| Quality bar: Lighthouse ≥ 90 Perf / A11y on `/` | **Fixed** (`62ffd0c`) + Verified (emulation) | Production build, Lighthouse 12.8.2 mobile: 91 / 93 / 94 Performance and 100 Accessibility in three consecutive cold runs (baseline 80). `PERFORMANCE_HOME_2026-11-15.md`. Physical-device performance remains a human check. |
| Usability (2 people), physical devices, second browser | **Human** | `USABILITY_TASKS.md` script and template. |
| Deployed PRD 13.3 rehearsal ×2 | Pending authorization | `RELEASE_PREPARATION.md`. |

## P1 takeover evidence scope - 15 November 2026

Final fetch confirms integration `3721130` contains current owner heads `7d6ac55`
and `6310e18`. Source CI `43701473118` and hosted P1 run
[43702841533](https://github.com/Moksh1112/Lunar_Landing_Site_Date_Comparator/actions/runs/43702841533)
passed seven jobs. The owner had already merged the UI milestone; P1 fast-forwarded
without creating a new merge. Its nav/buttons/copy still need current UI acceptance.
Backend/API evidence below was produced against unchanged `7d6ac55`. New takeover
checks and actual HTTP source modes are recorded in
[TAKEOVER_VERIFICATION_2026-11-15.md](TAKEOVER_VERIFICATION_2026-11-15.md).

The fresh-clone startup check is SYNTHETIC. Separately, real health/network responses
confirm five freshly acquired SPICE kernels and contract 1.1; Apollo 240 h date-shift,
A-minus-B metrics (including null), empty/full censored windows, input rejections and
a 60-day geometric sweep were exercised. These API checks do not certify UI countdowns,
slow-network handling, cross-view synchronization or full terrain performance.

Near-only Athena tiles returned REAL/terrain without a far DEM (historical; fixed by `fd38ce5`, see current status). This conflicted with
the contract's near+far terrain definition. Partial-data
API checks gave RED at B=2027-03-01 and GREEN at B=2027-03-14, +210.0 h both-visible
for B. They do not replace the owner's +210.1 h near+far browser evidence. V4 FAIL
and V6 owner-review scope are unchanged. No feature is promoted to full acceptance.

After documented far-DEM preparation and a fresh restart, P1 independently reproduced
the +210.1 h RED/GREEN challenge result through the REAL near+far API, two polar-site
708 h comparisons, and a 60-day terrain sweep (479.89 ms observed on this host).
This adds complete-data API evidence; browser/device and deployed acceptance remain open.

Current library coordinates match the opened primary source pages; see
[the site-source review](evidence/SITE_SOURCE_REVIEW_2026-11-15.md). International
and separate commercial coverage are absent; the intended target and impact reference
are not two additional actual landings. F1 breadth remains partial.

P1 changes root tooling/CI and integration docs only. Implementation and acceptance
tasks for the all-rounder, P1 and human/device reviewers are assigned in the single
current list at the top of [PROGRESS.md](PROGRESS.md). Earlier dated evidence below
retains its original revision/source scope.

## Latest simulator qualification update — 15 November 2026

Frontend `414e7dd` is integrated by `acbf22a`; hosted CI passed seven of seven jobs on both
the frontend branch (run `43695763208`) and integration (run `43696473842`). The frontend
handoff reports the original training goal was impossible at IM-2 Athena for a 708 h mission:
all Plan B start dates from 2027-03-01 through 2027-03-30 were RED under the unchanged
verdict rules. Reported sunlight was 35.5–39.7%, with longest dark gaps 209.6–413.2 h and
Earth blackout 87.3–122.3 h. This was a challenge-design mismatch, not evidence that the
backend should be relaxed.

The challenge now uses 240 h, initializes Plan B on Plan A's date, and leaves the user to
search for a passing date. No scientific threshold, verdict logic, backend, or API contract
was changed. The frontend owner reports a real-browser run: B=2027-03-01 RED, then B=2027-03-14
GREEN; the terrain-mode debrief reported Plan B had 210.1 h more Sun-and-Earth-both-visible
time. The source handoff identifies REAL data, terrain coverage, the Athena DEM, SPICE DE440,
contract 1.1, and manifest hash `1dcb16ff…5175`. P1 reviewed the code and CI but did not
independently repeat the browser test. Treat this as owner-reported live-path evidence, not a
safety result or final MVP acceptance.

## Prior P1 qualification observation before the 240 h fix — 15 November 2026

P1's earlier real-backend 708 h browser run used Plan A 2027-03-01 and Plan B 2027-03-15,
then 2027-03-16. Both returned RED; the debrief showed A/B Sun/Earth/both durations of
280.7/574.4/210.1 h and 272.8/585.7/202.1 h (A−B both +8.0 h). These results are
consistent with the later diagnosis that the 708 h challenge had no passing Plan B date.
They are historical and do not describe the corrected 240 h challenge.

## Latest acceptance update — 15 November 2026

Backend 7d6ac55 and frontend 016f01d integrated. Read
[ACCEPTANCE_2026-11-15.md](ACCEPTANCE_2026-11-15.md) for exact evidence and limits.
V6 is an explicitly reviewed P2-owner qualitative spot-check PASS; V4 remains FAIL,
with the confirmed reference disc-rule mismatch documented separately. Actual real
CSV/JSON downloads and five-page native print preview were checked. CSV now includes
all skyline rows and the complete request. All four routes passed responsive bounds
and sampled accessible-name checks; keyboard skip/glossary/scrubber checks passed.
Backend 551 passed / 6 skipped; combined frontend 131 tests, lint/typecheck/build pass.
Physical-device, other-browser, screen-reader and two-person usability checks remain
unverified. Concurrent unpublished landing/package/router work was preserved.
## Integrated acceptance — 15 Nov 2026 (60ab2b5 + f9a842d), REAL unless marked

The stack was run from integrated source: backend on port 8010 with `AZX_DATA_DIR` external
(`mock:false`, 5 kernels, `far_160m` + 3 tiles, manifest `1dcb16ff…`), and the frontend
against it. Browser checks use headless Edge over CDP with viewport emulation; no physical
devices were used. Controlled failures used network blocking, not fixtures.

Scripts are local evidence, not committed:

- `C:/azx/accept_api.py` writes `accept/api.json`.
- `C:/azx/accept_ui.mjs` and `accept_ui2.mjs` (browser acceptance).
- `C:/azx/a11y_check.mjs` (accessibility).
- `C:/azx/mono_sweep.mjs` (layout sweep).
- `C:/azx/nav_flow.mjs` (navigation journeys).

| Item | Result |
| --- | --- |
| F2 coordinates | 400 for lat −90, lat −90.5, lon 360 and lon −1. A point within 0.01° of either pole is rejected by the documented guard. The UI blocks lat −95 with an inline error, focuses the field and sends no request. |
| F5 mission/step | 0 h → 400; 1 h and 8760 h → 200; 8761 h → 413; step 0 → 400; step 1 min → 200. |
| F6 presets | The Date shift preset is applied in the browser. |
| F7 Best Date | 1 day and 183 days → 200 (183 days scored); 184 days → 413. Athena → Load as Plan B → `/compare` showing "Best date …". A double click sends 1 sweep. |
| F10 coverage | Athena gives `terrain` with label "tile im2-athena + far_160m". −85.5/45 gives `terrain_coarse` (far_160m). −80/10 gives `geometric`; −80.75/10 gives `terrain_coarse`. Near-only gives TerrainUnavailable (`fd38ce5`, real data). **Defect resolved.** |
| F13 deltas | Every returned delta equals A − B (real date shift at Athena). |
| F14 verdicts | Real A 2027-03-01 red (sun, dark gap), B 2027-03-14 green. |
| F15–F17 scrub | The keyboard range moved the moment readouts from 00:00 to 00:20 UTC for both plans. The mission-day alignment toggle works. The range is named by its "Time: …" label. |
| F19 Expert | The Expert raw-data table opens. |
| F20/F25 export | Real CSV: 9,965 lines with provenance header, manifest, horizon mode and REAL. JSON has `provenance` and `result`, skyline and manifest. The report's print emulation gives white paper, 8 charts and REAL. |
| F21 states | 32 rapid compares → 16 × 200 and 16 × 429. A blocked API shows "Failed to fetch / NETWORK" with Retry, and Retry recovers. A 2.5 s-latency network shows the loading state. A double click sends 1 compare (**defect fixed, `f9a842d`**). |
| Routes | Direct entry, refresh, legacy redirects, Back fallbacks, browser Back/Forward and the 404 all verified (`frontend/docs/HANDOFF_MONOCHROME.md`). |
| A11y | 0 contrast failures across 5,181 rendered text elements on 6 routes. The skip link is the first Tab stop and moves focus to `main`. The Learn and Menu dropdowns close on Escape and return focus. Reduced motion renders all routes. Without WebGL, Home falls back to the Moon image and the simulator and tour still render their content. |
| Layout | 8 routes × 320×640, 375×812, 768×1024, 1440×900, 1440×600 and 1280×560: 48/48 with no horizontal overflow, no clipped controls, a black canvas and no script errors. |
| Tests | Backend with real data: 556 passed, 6 skipped (they need pre-cached skylines). Without data, as in CI: 506 passed, 50 skipped for missing kernels, DEMs or maps. Frontend: 150 passed at `fbe70aa`. |
| F23 PGDA | V4 (centre rule, daily) FAIL 6.299 pp, artifact unchanged. **V4b** (any-fraction disc, hourly) passes 10/10 within 5 pp, max 4.135 pp at Sun (−88, 90 E): `validation/results/V4b-any-fraction.json` (schema v1.0, producer `5723ef8`). **Moksh adopted V4b as the acceptance basis**; V4 stays recorded as a definition-mismatch FAIL. Reference epoch, observer height and ephemeris are unpublished and assumed (`backend/docs/V4_DECISION_2026-11-15.md`). |
| F24 Methods | Methods explains the centre rule against PGDA's any-part rule, V4 FAIL, V4b as the acceptance basis and the terrain caveat (`d60adf1`). All 8 evidence files parse; a test guards this. |
| F25 print | The active contract (`docs/CONTRACT.md`) says: "PDF = browser print of `/report`". That is covered by the print-preview/printToPDF evidence (white paper, charts, REAL). No source readable here requires a physical paper print. The PRD/TRD PDFs use glyph-encoded fonts that could not be text-extracted on this host, so their exact wording is not quoted; a physical print is recorded as optional, not a blocker. |
| Gap/briefing | Integrated `2600664`, owner evidence in `frontend/docs/HANDOFF_GAP_BRIEFING.md` (offline briefing, 0 requests, print, no-JS, 48/48 layout). Not re-run here. |
| Pending (human/device) | Recorded one by one in `docs/USABILITY_TASKS.md`: physical phone, physical tablet, second browser, screen reader, usability participants P-A and P-B, deployed rehearsal. All pending. |

Earlier pending V6/export/print entries below are historical, superseded here.


### Historical ledger (superseded by "Current F1–F25 status" above)

User resumed full-stack engineering. Release remains reserved for the user.
Integrated code: frontend fd7bf03 and stale-result fix 8bd7dd4 (owner CI
43686142434 SUCCESS), backend 79936a5. This is evidence, not MVP gate acceptance.

| PRD feature | Implementation/evidence | Remaining acceptance |
| --- | --- | --- |
| F1 Library | Ten entries in real API; P1 primary-source transcription audit matches all ten (six Apollo, three CLPS, impact reference) | International/commercial breadth; intended target and impact are not actual landings |
| F2 Coordinates | Real custom coordinate comparison/sweep; takeover API rejects exact pole and east longitude 360 with 400 INVALID_INPUT | Complete edge-case and browser checklist |
| F3 Map | Sourced polar and global assets integrated | Final cross-device map interaction pass |
| F4 Two plans | P1 fresh-clone REAL near+far API reproduces revised challenge RED/GREEN and +210.1 h for B; browser evidence remains owner-reported | Independent revised browser journey and user-owned deployed rehearsal |
| F5 Mission length | 240 h and 708 h prior evidence; takeover API rejects 8761 h and aggregate sample overflow with 413 | Full mission/date-limit and browser checklist |
| F6 Presets | Site-vs-site and free-mode handoff exercised; date-shift code/tests present | Fresh browser date-shift regression |
| F7 Best date | Takeover REAL geometric and near+far 60-day sweeps (Mar 1-Apr 29 2027, 240 h); terrain observed 479.89 ms on one host; >183-day rejection | Slow-network/device, broader range extremes and UI error acceptance |
| F8 Ephemeris | SPICE runtime; full V1/V2 evidence passes; V6 owner qualitative spot check passed | No external scientific certification is claimed |
| F9 Skyline | Real near-field + far terrain in sweep and Plan B | Scientific V4 discrepancy |
| F10 Coverage modes | Prior coarse/near+far evidence; takeover near-only returns terrain without far DEM | Owner resolves partial-data mode mismatch; complete tile/coverage checklist |
| F11 Visibility | Computed windows; V3/V5 mathematical tests | Scientific V4 discrepancy |
| F12 Metrics/countdowns | Prior browser countdowns; takeover REAL geometric empty/full censored windows verified through API | Complete censored-event browser/countdown checklist |
| F13 Deltas | Prior real headline/table; takeover REAL API A-minus-B arithmetic, null mean-up and opposite signs checked | Complete visual sign and threshold interaction review |
| F14 Verdicts | Real sweep produced different verdicts; threshold tests retained | Fresh keyboard threshold interaction |
| F15 Panorama | Both real skylines and response paths displayed | Complete scrubber interaction pass |
| F16 Timeline | Real Sun/Earth/both/difference lanes displayed | Fresh date-alignment regression |
| F17 Scrubber | Shared store and regression tests; earlier interaction evidence | Full current cross-view sync check |
| F18 Terrain 3D | Lazy terrain 3D and 2D fallback implemented; one-host first-frame measurement recorded | Other hardware and slow-device performance/fallback |
| F19 Simple/Expert | Implemented; raw tables and method details present | Full keyboard and screen-reader review |
| F20 Provenance | Coarse/terrain source labels visible; actual CSV/JSON downloads and corrected CSV checked | No known open defect; preserve provenance on future changes |
| F21 UI states | Prior fixtures/tests; stale-plan notice now browser-verified | Full break-it pass, slow network |
| F22 Horizons | Full V1/V2 artifacts pass | No external scientific certification |
| F23 PGDA | V4 artifact is displayed honestly as FAIL (~6.30 pp against <=5 target) | Resolve disc/epoch/DEM convention mismatch against authoritative reference; preserve threshold |
| F24 Methods | Versioned V1–V6 evidence integrated; V6 is owner-reviewed qualitative PASS | V4 resolution and final rendered review |
| F25 Export/report | Real CSV/JSON reviewed; native five-page print preview checked | Physical print and device/printer setups unverified |

## Previously recorded checks (per checkpoint)

- Combined fd7bf03 checkpoint: TypeScript/production build, lint, 126 tests passed. The later `414e7dd` frontend commit passed hosted CI run `43695763208`; see the simulator handoff for owner-reported real-backend testing.
- Stale-result fix: 129 tests passed, lint and TypeScript/production build passed;
  Impeccable mechanical detector returned no findings; owner hosted CI green.
- Live health: ok, mock=false, contract 1.1. Live sites count ten.
- Browser: starter Compare returned real coarse terrain; no synthetic banner.
- Live sweep POST /api/v1/sweep: HTTP 200, server duration 770.85 ms.
  Best days March 15/16/17: both-visible 203.7/179.7/155.7 h; green/green/amber.
  Load as Plan B populated site/date/240 h, switched Free mode; Compare recomputed
  Plan B at 203.7 h with 20 m terrain and updated the headline, table and views.
- Export expansion inspected in normal flow; no left clipping or result overlay.
- Measured DOM widths 320/375/769/1440 px: scroll widths 307/363/756/1427 px;
  no document horizontal overflow for the comparison including open 3D. The 768 px
  requested check rounded to 769 in this browser; not represented as exactly 768.
- After changing Plan A name, browser displayed: 'Plans changed. Results below are
  from your previous comparison. Select Compare to update them.' Threshold-only
  changes remain local verdict edits, covered by a regression test.
- Vite main chunk ~685 kB and lazy terrain ~957 kB retain the size advisory.

## Gate status

MVP acceptance is **OPEN** and is Moksh's decision. The engineering items are classified in
"Current F1–F25 status". Open items are the human and device checks, the F1 scope
decision and the two deployed rehearsals. V4 is a recorded FAIL with V4b as the adopted
basis. Three Iteration-1 extensions were explicitly authorized; no other Iteration 1/2 work
and no release tag are authorized by this ledger. Read `NON_RELEASE_HANDOFF.md` for
real-dataset reproduction.
