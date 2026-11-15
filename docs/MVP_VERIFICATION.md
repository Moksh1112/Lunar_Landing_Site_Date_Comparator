# MVP verification ledger — 15 November 2026

## Current local UI evidence - 15 November 2026

Local merge `ad2ac2e` contains source `47d8a58` over `28b56e3`. The subsequent user-directed
UI milestone adds `/terrain` beside Best Date, shared Simulator chrome, improved terrain
framing/controls and clearer 2D recovery. Repeated visual credits/caveats moved into Methods.
**163 frontend tests, lint, TypeScript and production build pass.** Isolated Chrome/Brave
loaded REAL coarse terrain, switched 5x scale, recovered from induced context loss, opened
2D graphs and completed real Simulator practice/debrief interactions. Its pause timer and
debrief slider are fixed. Original Chrome-profile hook error was user-reported; a competing
Vite cache writer and HTTP 504 were independently observed and resolved. No push or hosted
CI is claimed. Details/repeat steps: [UI_TERRAIN_2026-11-15.md](UI_TERRAIN_2026-11-15.md).
This supplements F7/F15/F17/F18/F21 evidence; device, accessibility and science gates stay open.

Latest terrain refinement: gray height encoding only; continuous height slider preserves
orbit/zoom/pan and reuses the mesh. Chrome/Brave rendered Earth positions match the actual
SPICE response within the visual easing tolerance; motion paths/time controls make small
movement inspectable. [Evidence](TERRAIN_MOTION_2026-11-15.md). This is additional F17/F18
interaction evidence, not a new science, device-performance or MVP acceptance gate.

## Redesign integration evidence - 15 November 2026

Moksh's theme/navigation/Home source `47d8a58` is prepared in the integration worktree over `28b56e3`; source CI `43707999082` is successful. Details: [THEME_INTEGRATION_2026-11-15.md](THEME_INTEGRATION_2026-11-15.md). The comparator is now `/compare`; `/` is Home. Existing simulator/tour URLs redirect to `/learn/simulator` and `/learn/tour`.

First combined pass: frontend 148 tests, lint/typecheck/build; backend Ruff and 551 tests with six cache-dependent skips; setup checks and all 15 synthetic fixtures passed. Owner-reported simulator, print and device evidence in `frontend/docs/HANDOFF_MONOCHROME.md` retains owner attribution. V4 remains FAIL; no science or MVP gate advances from this redesign. Physical-device and spoken screen-reader checks remain open.

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

Near-only Athena tiles returned REAL/terrain without a far DEM. This conflicts with
the contract's near+far terrain definition and needs the backend owner. Partial-data
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
Earlier pending V6/export/print entries below are historical, superseded here.


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
| F7 Best date | Prior REAL 60-day API sweeps; current Edge saves B without navigation, explicit Compare computes selected UTC date with REAL/terrain_coarse | Slow-network/device, broader range extremes and UI error acceptance |
| F8 Ephemeris | SPICE runtime; full V1/V2 evidence passes; V6 owner qualitative spot check passed | No external scientific certification is claimed |
| F9 Skyline | Real near-field + far terrain in sweep and Plan B | Scientific V4 discrepancy |
| F10 Coverage modes | Prior coarse/near+far evidence; takeover near-only returns terrain without far DEM | Owner resolves partial-data mode mismatch; complete tile/coverage checklist |
| F11 Visibility | Computed windows; V3/V5 mathematical tests | Scientific V4 discrepancy |
| F12 Metrics/countdowns | Prior browser countdowns; takeover REAL geometric empty/full censored windows verified through API | Complete censored-event browser/countdown checklist |
| F13 Deltas | Prior real headline/table; takeover REAL API A-minus-B arithmetic, null mean-up and opposite signs checked | Complete visual sign and threshold interaction review |
| F14 Verdicts | Real sweep produced different verdicts; threshold tests retained | Fresh keyboard threshold interaction |
| F15 Panorama | Real skylines/paths; current graph-only tooltips and gradual marker movement with immediate reduced-motion positioning checked | Complete scrubber interaction pass |
| F16 Timeline | Real Sun/Earth/both/difference lanes displayed | Fresh date-alignment regression |
| F17 Scrubber | Shared store and regression tests; earlier interaction evidence | Full current cross-view sync check |
| F18 Terrain 3D | Dedicated /terrain route; REAL coarse tile, 5x framing, Reset view and 2D fallback checked in isolated Chrome/Brave on one host | Other hardware and slow-device performance/fallback |
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

MVP acceptance remains OPEN: V4 fails; the remaining acceptance
checks above are incomplete. Deployed demo twice is reserved for release by user.
No Iteration 1/2 features or release tags are authorized by this ledger.
Read NON_RELEASE_HANDOFF.md for real dataset reproduction and historical checks.
