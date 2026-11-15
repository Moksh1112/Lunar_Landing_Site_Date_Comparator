# Acceptance checks — 15 November 2026

Current integrated code: backend 7d6ac55, frontend 016f01d. These supersede earlier
pending export/print and V6 snapshots. Release remains with the user.

## Science

V6: PASS as P2 owner qualitative spot check, not independent certification. Reproduced
708 h at 89 S, 0 E, hourly: Sun -1.7036 to -0.0756 degrees; Earth -5.9596 to 7.4685.
The review checks the PRD's qualitative near-horizon behavior against NASA's polar
visualization. No numerical tolerance is invented. The exact-pole Sun statement is
not applied as a threshold to a site one degree from the pole. Reproduction and the
explicit assessment are in validation/results/V6-sanity.json and the new
backend/tools/validate_sanity.py. Default execution without --review-note remains
incomplete. Four regression cases cover finite data and nonautomatic acceptance.

V4 remains FAIL, 6.2989 pp versus <=5 pp. Official PDS solar label confirms the
reference counts any fraction of the disc; runtime intentionally uses centres.
A separate fixed-radius sensitivity gives 10.066% rather than 7.785%, versus 14.084%
reference. This is diagnostic only, not a replacement pass. Reference averaging
epoch, DEM and disc model are not yet matched. See backend/docs/V4_SOURCE_REVIEW.md.
No repeated coarse/20 m attempt, changed point or relaxed tolerance was used.

## Exports and print

Actual browser controls downloaded and files were opened:
- azelux-compare-real-202611150643.json: REAL, contract 1.1, two request scenarios,
  4249 samples each, manifest hash 1dcb16ff00b027c8e5fbe31ebd468014a7e84f6f64d83ef38c024c8d94b95175.
- CSV review found omitted skyline rows despite Expert's complete-export promise.
  Fixed CSV to include both full skylines and the complete request JSON. Multiline
  plan labels are escaped in their provenance line to preserve file structure.
- Post-fix browser download azelux-compare-real-202611150653.csv was opened: 1440
  skyline rows, 8498 series rows, two complete request scenarios, 708 h mission,
  REAL label, signed A-minus-B convention and the same manifest hash.
- The actual Print button opened native print preview. Its accessibility document
  reported a loaded five-page PDF. All five pages' text was inspected: inputs,
  thresholds, signed metrics, kernel/method details, both panoramas, timeline,
  provenance hash and limitations were present. App nav/actions were excluded.
  One provenance entry spans pages 4/5. This was print-preview verification, not
  a physical print, saved-PDF visual certification or every paper/printer setup.

## Responsive and accessibility

Four routes (/report, /methods, /best-date, /) checked at actual measured CSS widths
320, 375, 769 and 1440. Browser scaling rounded the requested 768 check to 769.
No document horizontal overflow in any of the 16 checks. Each had one h1 and no
unnamed visible button/input/select in the label/ARIA/text DOM sampling.

- Skip to content moved focus to id=main.
- Glossary help closed on Escape and returned to its collapsed trigger.
- Timeline accepted the Right key, updated its time/readout and retained a solid
  focus outline on the range input.
- Earlier real Compare/Best Date/3D checks remain in MVP_VERIFICATION.md.
- Methods browser verification shows V4 Fail and V6 Pass with spot-check and owner
  assessment caveats; the failed scientific evidence is not hidden.

Limits: one Windows Chromium/IAB host, responsive viewport emulation. No claim of
physical phone/tablet, Safari/Firefox, assistive-technology speech or other hardware
performance verification. Two outside-team usability participants remain pending.

## Actual code checks

- Backend: 551 passed, 6 skipped; new runner Ruff checks pass. Existing dependency
  deprecation warning retained; skips are not scientific passes.
- Combined integration frontend: 131 passed; lint, strict TypeScript and production
  build pass. Main ~687 kB / lazy terrain ~957 kB retain Vite's size advisory.
- Owner hosted CI: backend run 43687231193 SUCCESS; frontend 43687180588 SUCCESS.
  Combined published checkpoint CI must be checked separately.

## Concurrent work protected

During verification, frontend worktree acquired uncommitted package/lockfile,
router and landing-folder changes from another process. They were not edited,
committed or integrated by this acceptance task. The clean integration build and
hosted CI verify only the published acceptance commits. Coordinate before changing
that worktree. Root .claude/launch.json remains the user's untracked preview config.

## Remaining gate work

V4 scientific discrepancy; physical-device/browser/assistive-technology checks;
two independent usability runs; remaining edge-case acceptance in MVP_VERIFICATION.
MVP deployed-URL rehearsal twice, final deployment/release/submission remain user
work. No MVP/RC/final tag or gate acceptance is declared.
