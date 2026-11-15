# Human and device checks: test URL, task script, results

Not yet run. This needs two people who did not build Azelux, plus a moderator. Use the
integrated build with a REAL backend (see README "Real data"). Each session takes about 20
minutes. Do not help the participant beyond reading the task. Record what they do and say,
not what they "should" do.

## Build and URL under test

- **Build:** the integration SHA in the top section of `docs/PROGRESS.md` (code at `7bc75e8`
  or later). Record the exact SHA you test.
- **Until a deployment is authorized:** run a local REAL preview.
  1. `git clone --branch feat/p1-s0-integration https://github.com/Moksh1112/Lunar_Landing_Site_Date_Comparator.git`.
  2. `npm run setup`; on managed Windows set `AZX_PYTHON_MODE=target` first.
  3. Set an absolute non-cloud `AZX_DATA_DIR` (README "Real data").
  4. `npm run dev:all`.
- **Test URL:** `http://localhost:5173/`.
  - Confirm `http://127.0.0.1:8000/health` shows `"mock":false`.
  - Confirm no "SYNTHETIC DATA" banner is visible.
  - A phone on the same network needs the LAN address and a matching `AZX_CORS_ORIGINS`.
- **After deployment authorization:** use the deployed URL and record it.

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
7. "When does Plan A lose Sun and Earth together for longest, and why?" Success: they find
   the Visibility gap panel and read the explanation or an event.
8. "Download something you could open later without internet." Success: Export → offline
   briefing; it opens from the downloaded file.
9. Optional: "Try the simulator and see how far you get in 5 minutes."

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

## Device, browser and assistive-technology checks

Do each on the same build. These are separate from the participant sessions. Viewport
emulation does not count as a physical-device check.

| # | Check | How |
| --- | --- | --- |
| D1 | Physical phone | Run tasks 1, 2, 6 and 8. Check the menu button, the Back control and no sideways scrolling. |
| D2 | Physical tablet | Same as D1, in portrait and landscape. |
| D3 | Second browser (Firefox or Safari) | Home → Compare → Best Date → Load as Plan B → Report, print preview. |
| D4 | Spoken screen reader (NVDA, VoiceOver or Narrator) | Skip link; navigation; Compare result sentence; the Visibility gap explanation and events; scrubber value announced; Methods V4/V4b text. |
| D5 | Slow device | Home 3D Moon and terrain 3D. The fallback must appear, and the page must stay usable. |
| D6 | Lighthouse (Chrome DevTools) on `/` | Production build (`npm --prefix frontend run build && npx vite preview`). Need ≥ 90 Performance and ≥ 90 Accessibility. |
| D7 | Physical print (optional) | Not required: the TRD defines PDF as browser print-to-PDF. Do it only if wanted. |

**Screen reader (D4) detail**, on `/compare`:

- Landmarks and headings make sense.
- The result sentence is announced after Compare.
- Errors are announced.
- The scrubber announces its time.
- The Learn menu and Escape work.
- The Visibility gap explanation and events are read out.

## Results template (copy one row per check or participant)

Status is exactly one of **passed**, **failed** or **pending**. Never fill a row without
actually doing the check.

| ID | Date (UTC) | Tester (anonymised) | Build SHA | URL | Device / OS / browser / AT | Status | Notes and issues (with task numbers) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| P-A |  |  |  |  |  | pending |  |
| P-B |  |  |  |  |  | pending |  |
| D1 |  |  |  |  |  | pending |  |
| D2 |  |  |  |  |  | pending |  |
| D3 |  |  |  |  |  | pending |  |
| D4 |  |  |  |  |  | pending |  |
| D5 |  |  |  |  |  | pending |  |
| D6 |  |  |  |  |  | pending | Performance __ / Accessibility __ |
| D7 (optional) |  |  |  |  |  | pending | Not required by the contract; browser print preview is already evidenced |
| R1 Deployed rehearsal 1 (PRD 13.3) |  |  |  |  |  | pending | Needs deployment authorization |
| R2 Deployed rehearsal 2 (PRD 13.3) |  |  |  |  |  | pending | Needs deployment authorization |

A failed check links to an issue or fix commit. Never mark a row passed without a real person and device.
