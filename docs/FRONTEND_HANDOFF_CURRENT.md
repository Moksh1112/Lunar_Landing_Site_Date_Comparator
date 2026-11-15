# Current frontend integration handoff - 15 November 2026

Current implementation is local commit **`63bf0af552ca54c2abf26ad5f2d0f24d6da8d15c`**
on `feat/p1-s0-integration`, after `50b14ea` and merge `ad2ac2e`. Moksh's theme source
`47d8a58` is included. These UI milestones are committed, not pushed. The last
verified published baseline is `28b56e3`. No hosted CI is claimed for the local UI.

The frontend owner retains general frontend ownership. The user explicitly asked
P1 to implement these specific UI changes. User relays coordination; current owner
editing activity is unknown. Do not push, overwrite another worktree or re-merge an
already integrated source. Inspect status/ancestry and coordinate an exact owner SHA
before the next integration. Final release actions remain separately authorized.

## Current behavior to retain

- Home `/` is the tour. Compare is `/compare`; Briefing opens Simulator through the
  legacy `/landing` redirect. Main nav includes Best Date, 3D Terrain, Simulator and
  Methods. Simulator reuses the shared app header.
- Best Date Load as Plan B preserves A/thresholds and stays on the search page. Its
  confirmation offers explicit Compare A and B; this computes the selected UTC date.
- `/terrain` owns the 3D analyser, sky/horizon and timeline views. Compare has no bottom
  terrain launchers. Gray brightness encodes DEM height; the 1x-5x slider has 0.1 steps,
  reuses mesh geometry and preserves orbit/zoom/pan. Reset view or another tile reframes.
- Earth uses the existing NASA texture, actual response directions and an optional
  motion path. The mission clock/scrubber and playback/replay expose small movement.
- Compact graph-only inspectors and markers ease toward selection and honor reduced
  motion. The shared theme switch persists system/saved choice. Print stays light.
- Landing illumination is brighter white. Visual credits/limits are in Methods;
  source labels and export provenance remain. Simulator pause excludes paused time
  and restores focus; its debrief timeline changes time.

## Recorded checks and remaining work

At `63bf0af`: **163 tests / 22 files**, lint, strict TypeScript and production build
pass. Isolated headless Chrome/Brave verify REAL coarse terrain, exact rendered Earth
endpoint, grayscale vertices, fractional/keyboard scaling, unchanged camera transforms,
working Reset view, replay and responsive bounds. Prior real Simulator practice/debrief
and induced context-loss/fallback checks are recorded separately. This is not a repeat
of the owner's winning March 14 GREEN browser challenge or a physical-device check.

Evidence: [UI_TERRAIN_2026-11-15.md](UI_TERRAIN_2026-11-15.md),
[TERRAIN_MOTION_2026-11-15.md](TERRAIN_MOTION_2026-11-15.md), and the
[F1-F25 ledger](MVP_VERIFICATION.md). Current pending work is maintained only in
[PROGRESS.md](PROGRESS.md). Full cross-view/date alignment, threshold/countdown/error
journeys, spoken screen-reader work, physical devices, slow GPUs, current exports/print
where affected, and independent usability walkthroughs remain open.

Run one Vite server per checkout. An obsolete task preview on 5188 was stopped after
it competed with 5173 for dependency-cache chunks. Verify a process before stopping
it; do not depend on an old preview port/PID. React dependencies are deduplicated and
the renderer prebundled. An older tab may need a hard refresh. The original user's
Chrome-profile hook stack was not captured independently.

## Historical owner checkpoint (before current UI milestones)

The following record retains its original source/check scope. Old source/preview/push
instructions below are historical and do not override the current no-push instruction.

# Frontend ownership handoff — 15 November 2026

User returned frontend implementation to the frontend owner. P1 now owns integration
only. Latest frontend source: frontend-landing 72de289; controller fix 0851855.
See actual integration history for whether the final layout is merged.

Done: six self-paced demo lessons with Previous/Next, explanations and highlighted
controls; separate guide/canvas/control layout; pulled-back console camera; date
minus/plus respect direction; disabled/fixed challenge controls explained. Fixed an
implicit React effect return which wrongly invoked the pick callback on cleanup.
World pick registration now returns no function; pointer-down state clears on release.

Checks: 141 tests, strict TypeScript/build/lint pass; design detector no findings.
Browser: Site, Date minus/plus, Mission and Plan A/B update correctly. Physical 3D Site
dial tested. Six demo lessons completed; main-app practice configured Athena, A
2027-03-01, B 2027-03-15, 708 h and sent a REAL comparison (HTTP 200, 724 ms), then
entered qualification. Full qualification/debrief/manual handoff still needs review.
Final layout at 320/375/1440 CSS px had no horizontal overflow, guide/canvas overlap
or guide/control overlap. Physical devices/screen readers remain unverified.

Latest optional preview: 5176 from work/landing-review. Main app: 5173; backend 8000.
Do not terminate an unverified process. No release or scientific gate was passed.

Frontend owner: preserve work, fetch origin, use a separate worktree if needed and
merge current integration into feat/p4-frontend-s0. Include frontend-landing if its
latest commit is not yet contained. Do not reset either owner's worktree. Do not
rebuild the simulator or add dependencies just to apply a skill. Finish qualification,
pause/resume, fallback, mobile and keyboard checks, fix actual defects and push green
milestones. P1 integrates; no direct integration/main changes by frontend owner.
