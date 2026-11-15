# Usability task script (two independent participants)

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
