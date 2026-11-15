# Simulator beginner journey: verification and fixes (frontend owner, 15 Nov 2026)

Branch `feat/p4-frontend-s0`, based on integration `c20bc5d` (which contains frontend-landing
`72de289` and the controller fix `0851855`). Preserved: the six-lesson demonstration, guide and
control layout tracks, pulled-back console camera, direction-aware date controls, and the
disabled/explained qualification controls.

## Defects fixed

1. **Duplicate requests.** Two fast Compare clicks (3D or HTML) could both pass the React
   `busy` check, which reads stale state, and send two requests and record two attempts. A
   synchronous in-flight ref now drops the second click.
2. **Dead end in qualification.** If attempts errored, or the user wanted to stop, there was no
   path to the debrief or handoff. Added "End challenge and see the debrief"; the debrief says
   when no attempt was scored.
3. **Request failure copy.** The error now says the settings are kept and to press COMPARE to
   try again.
4. **Training wording.** "Qualified" became "Training challenge passed … a learning outcome,
   not a landing-safety assessment".
5. **Synthetic expectation up front.** Qualification states, before any attempt, that mock
   data cannot pass the challenge.
6. **Reset camera.** Available in every 3D level (demonstration, practice, qualification,
   debrief), not only the demonstration.

Also added `World.screenPoint(control)`: the projected position of a physical control. It is
exposed on `window.__azxWorld` in dev builds only (absent from the production bundle) so that
real mouse events can be verified.

## Evidence

Headless Edge over CDP against the mock dev server (SYNTHETIC). Scripts:
`C:/azx/sim_check.mjs` and `C:/azx/sim_3d.mjs` (local, not committed).

**Journey:** boot → briefing → 6 lessons → practice → qualification → debrief → Open in the
comparator.

- `/` received Plan A 2027-03-01 and Plan B 2027-03-16 (the last attempt), the result sentence,
  the timeline section and the SYNTHETIC label, with the scrubber at mission start.
- Browser Back returned to the simulator boot screen.

**Practice:** a wrong control gives "Not yet: Turn SITE to IM-2 Athena."

**Physical 3D controls**, using real mouse events at projected positions:

- Site advanced.
- Date with Shift moved back 3 days; plain clicks moved forward 11 days.
- Mission went 240 → 480 → 708; Plan flipped A → B.
- Compare entered qualification.
- A wrong 3D control gives a hint.
- In qualification, 3D Site and Plan explain why they are fixed, and 3D Date advances Plan B.

**HTML twins:** the same steps work. In qualification, Site, Mission and Plan are disabled;
Date ± and Compare are active.

**Request handling:**

- **Double click:** the double-click to qualification sent one transition, and a retry
  double-click recorded one attempt (attempts left 3 → 2).
- **Failure** (`?mock=compare:error`): attempts were unchanged, all inputs were kept, and the
  retry message appeared. Removing the error variant and pressing Compare succeeded.
- **Redraw:** two viewport resizes changed neither state nor hint.

**Pause:** Esc opens the dialog with focus on Resume, and Resume closes it.

**Layout** (320×568, 375×667, 375×560, 768×1024, 1440×900, 1440×600; long error hint
shown): no horizontal overflow, the checklist and hint never overlap the controls, and the
controls are fully in view. The canvas is small on short phones (128 px at 320×568); the
HTML controls carry the task there.

**Reduced motion:** reaches practice with instant camera cuts.

**No WebGL** (`--disable-3d-apis`): the boot screen states 2D mode, and practice works through
the HTML controls.

**Links:** every internal target (`/`, `/best-date`, `/methods`, `/report`, `/landing`,
`/landing/tour`) is a defined route. The comparator works without the simulator.

**Checks:**

- `tsc` and `eslint` clean; `vitest` 17 files / 141 passed; production build OK.
- impeccable detect `[]`.

## Not verified / limitations

- No physical phone, tablet or screen-reader testing.
- Real-backend qualification was not re-run in this pass. The earlier real practice compare
  is P1-recorded. At IM-2 Athena a real server without DEMs returns the honest
  terrain-unavailable error.
- Qualification uses a single date-shift site; synthetic attempts can never pass, by design.
- V4 still fails its scientific target; V6 is an owner qualitative spot check. Methods copy
  is unchanged.

## Real-backend qualification RED (investigated 15 Nov 2026)

**Inputs** (REAL backend at 127.0.0.1:8000, never fixtures):

- IM-2 Athena (−84.7906, 29.1957); `date_shift`; step 10 min; observer 2 m.
- Thresholds: sun ≥50 %, earth ≥50 %, dark gap ≤48 h, blackout ≤72 h.
- Plan A 2027-03-01; Plan B days 2027-03-01..31.
- Probe script: `C:/azx/qual_probe.py`, local, not committed. Saved responses are in
  `C:/azx/qual/compare_{708,240}h_B{14,19,20}.json`.

**Response provenance:** `data_label` REAL, `horizon_mode` terrain, DEM
`LDEM_80S_20MPP_ADJ tile im2-athena + far_160m`, SPICE DE440, contract 1.1, manifest
`1dcb16ff…5175`.

**Results:**

- **708 h:** every Plan B day 2027-03-01..30 is red, failing `sun_pct_min`, `dark_gap_h_max`
  and `blackout_h_max`.
  - Sun 35.5–39.7 %. That is below the near band (40 % = 0.8 × 50), so these days are red
    rather than amber.
  - Longest dark 209.6–413.2 h; blackout 87.3–122.3 h.
  - Example, 2027-03-15: sun 38.8 %, dark 411.6 h, blackout 122.3 h.
  - Day 31 returned 429: the probe exceeded the 30/min rate limit.
- **240 h:**
  - 2027-03-13..16: green. Example, 2027-03-15: sun 100 %, earth 84.9 %, dark 0 h,
    blackout 36.3 h.
  - 2027-03-17: amber. All other days: red.

**Cause:** the backend verdicts follow TRD 5.3 and are expected. The defect was in the
challenge design. A 708 h mission is one full lunar day, and at this polar site the Sun is up
less than half of it whatever the start date, so "find a GREEN Plan B" had no answer.

**Fix:**

- The qualification uses a fixed 240 h mission (`QUALIFY_HOURS`).
- Plan B starts at Plan A's day, so the user has to search.
- The challenge copy explains why 240 h.
- The debrief now shows each plan's mode, data label and DEM.
- Unchanged: thresholds, verdict rule, contract and backend. No date is hard-coded.
- Regression test: `levels.test.ts`, "uses a solvable 240 h mission…".

**Browser check:** in-app browser, dev build of this branch with a same-origin Vite proxy to
:8000 (local config, not committed).

- Practice compare succeeded.
- Qualification attempt 1, B 2027-03-01: red. Attempt 2, B 2027-03-14: green.
- Debrief: "Training challenge passed".
  - Plan A: red (terrain, REAL, DEM …).
  - Plan B: green (terrain, REAL, DEM …).
  - Plan B has 210.1 h more with both Sun and Earth in view.

**Moon window:** the front-wall opening is now x ±3.3, y 0.5–2.9, about 70 % of the wall.
Checked visually at 799×595 and 1440×900.
