# Landing site camera fix - 15 November 2026

User-reported issue on local parent `61d6811`: Home's illustrative simulation lost
the Moon after selecting B, until zoom/resize. Independently reproduced for A and B.

`landAt` changed the orbit target and camera position without updating the camera's
orientation. The first animation render also happened before that move. Apply
`controls.update()` and frame the camera before rendering the landing animation.
No scientific data, coordinates, lighting or thresholds changed; this view is SYNTHETIC.

Validation:

- `npm --prefix frontend run test -- --run`: 201 passed, 29 files.
- `npm --prefix frontend run lint`, `npm --prefix frontend run build`: PASS.
- `node --check scripts/check-ui-review.mjs`, `git diff --check`: PASS.
- `node scripts/check-ui-review.mjs`: ten scoped checks PASS in isolated Chrome,
  including B/A/B switching at 1440 and 375 px with both normal and reduced motion.
  All 12 captures show the Moon without a wheel/resize event after selection.
  The rendered neutral-bright pixel fraction was below 0.5% before the fix and
  above 22% after it (the regression threshold is 5%). Before/after images were also
  inspected locally. [Evidence](evidence/LANDING_CAMERA_2026-11-15.json).
- The existing Compare browser probe now waits for its lazy page and captures the
  button once before double-clicking; its first run hit a test timing error.

AI assisted this user-authorized fix and validation; the existing human Git identity
is retained. No push, new hosted CI, backend suite, physical-device or scientific
acceptance is claimed. The watcher was paused for edits and resumed after the commit.
