# Human and device checks: test URL, task script, results

Not yet run. This needs two people who did not build Azelux, plus a moderator. Use the
integrated build with a REAL backend (see README "Real data"). Each session takes about 20
minutes. Do not help the participant beyond reading the task. Record what they do and say,
not what they "should" do.

## Before you start

- **Device:** a laptop (1440-ish px) for one participant and a phone or tablet for the other.
  Record the browser, OS, device and screen size.
- **Starting state:** open `/` in a fresh private window.
- **Script to read out:** "Azelux compares two plans for landing on the Moon. Please think out
  loud. You can't break anything."

## Tasks (read one at a time)

1. "Find out what Azelux is for, in your own words." Success: they mention comparing two
   landing plans for Sun and Earth visibility.
2. "Compare the two plans that are already filled in. Which plan keeps the Sun and Earth in
   view together for longer?" Success: they read the result sentence or the deltas.
3. "Change Plan B to land two weeks later at the same site, then compare again." Success: they
   use Edit plans or the Date shift preset and get a new result.
4. "Use Best Date to find a good landing day at IM-2 Athena in March 2027 for a 240-hour
   mission, and load it as Plan B." Success: Load as Plan B, then they are back on Compare.
5. "At what time during the mission is Earth first out of view for Plan A?" Success: they use
   the timeline or scrubber, or the countdowns.
6. "Save the comparison so you could send it to someone." Success: Export CSV or JSON, or the
   report's Print / PDF.
7. Optional: "Try the simulator and see how far you get in 5 minutes."

## Record per task

- **Completed?** Yes, with difficulty, or no.
- **Time taken.**
- **Errors and wrong turns.**
- **Words they didn't understand:** e.g. horizon mode, terrain coarse, delta, verdict.
- **Quotes.**

Afterwards ask:

- "What was confusing?"
- "What did you expect that wasn't there?"
- "Would you trust the result? Why?"

## Reporting

Add one row per participant to `docs/MVP_VERIFICATION.md` (Usability), anonymised (P-A, P-B),
with the device, browser, completion per task and the top three issues. Fix issues through the
normal owner branches. Never fill this section without real participants.

## Test URL

- **No deployed URL exists yet.** Deployment needs Moksh's authorization.
- **Until then, local:** follow README "Real data". Run `npm run setup` (on managed Windows,
  `AZX_PYTHON_MODE=target`), set an absolute `AZX_DATA_DIR`, run `npm run dev:all`, then open
  **http://127.0.0.1:5173/**. Check http://127.0.0.1:8000/health first: it should show
  `mock:false`, 5 kernels, `far_160m.tif` and the tiles.
- **Phones and tablets on the same network:** use the host's LAN address and add that origin to
  `AZX_CORS_ORIGINS`. Record the exact URL you used.
- Record the integration SHA you tested (`git rev-parse HEAD`).

## Device and accessibility checks (each recorded separately)

For each device or browser, run tasks 1–6 above and check that the layout stays usable:

- no sideways scrolling and controls reachable;
- the menu opens and closes;
- the timeline scrubber works by touch or keyboard.

**Screen reader** (NVDA or Narrator on Windows, VoiceOver on macOS/iOS), on `/compare`:

- Landmarks and headings make sense.
- The result sentence is announced after Compare.
- Errors are announced.
- The scrubber announces its time.
- The Learn menu and Escape work.

## Results (status: passed / failed / pending)

| Check | Tester (anonymised) | Device / OS / browser | URL + SHA | Status | Notes / issues |
| --- | --- | --- | --- | --- | --- |
| Usability participant P-A | | | | pending | |
| Usability participant P-B | | | | pending | |
| Physical phone | | | | pending | |
| Physical tablet | | | | pending | |
| Second browser (Firefox or Safari) | | | | pending | |
| Screen reader | | | | pending | |
| Deployed rehearsal 1 (PRD 13.3) | | | | pending | Needs deployment authorization |
| Deployed rehearsal 2 (PRD 13.3) | | | | pending | Needs deployment authorization |
| Physical paper print (optional) | | | | pending | Not required by contract; browser print preview is already evidenced |

Fill in one row per check. A failed check links to an issue or fix commit. Never mark a row
passed without a real person and device.
