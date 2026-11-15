# User-requested flow and chart fixes - 15 November 2026

> Scope: This is an intermediate flow/graph snapshot. Its original automatic Best Date navigation and per-chart inspection sliders were superseded: Load as Plan B now stays on Best Date, and graph inspectors are compact hover/focus popups. See the current handoff for final behavior. Current instructions: [TAKEOVER_CURRENT.md](TAKEOVER_CURRENT.md); status: [PROGRESS.md](PROGRESS.md).

Scope expressly authorized by the user on top of Moksh's prepared `47d8a58` merge.
This authorization covers these frontend changes; it does not transfer general
frontend ownership or authorize pushing. Backend, contract and science are unchanged.

## Result

- `/` opens the complete tour previously reached through `/landing/tour`.
  The same tour remains at `/learn/tour`; legacy links continue redirecting.
  A **Briefing** button next to **Compare two plans** links to `/landing`, opening
  the existing simulator at `/learn/simulator`. Best Date remains a third action.
- Best Date's **Load as Plan B** updates B, preserves A and thresholds, clears
  stale results/time, opens `/compare` and automatically computes the new plans.
  The arrival marker is consumed with replace so browser Back does not replay it.
  Errors keep the selected plans and offer the existing retry behavior.
- Horizon panoramas and sky rings: nearest actual Sun/Earth sample inspection on
  hover/tap, a keyboard-accessible sample slider, UTC time, direction, elevation,
  actual visibility and skyline elevation. **Follow shared timeline** restores the
  normal shared-time markers after local inspection.
- Timeline: hover readout and crosshair; tap moves shared time. Text explains
  visibility bars, gaps, Both and Difference; the inspector distinguishes times
  outside a plan's mission. Long mission axes use fewer ticks. Each bar also has
  its time/duration title.
- On small screens, readouts sit below the chart so overlays do not obscure it.
  Desktop tooltips appear on the chart; Escape dismisses them. Print omits the
  interactive controls/readouts. Report now has a working timeline scrubber that
  also updates its horizon markers.

No inference, new data, server request per hover, backend threshold or window
calculation was introduced. Inspected samples come from the response; timeline
state comes from existing windows and marks out-of-mission time explicitly.

## Verification

- Frontend typecheck, lint, production build: PASS.
- Vitest: **19 files / 152 tests PASS**, including new handoff/state preservation,
  root-page mapping, nearest-path sample and censored/outside-window regressions.
- Headless Edge, real backend: Home shows the tour; Briefing reaches the simulator.
- Real Best Date journey selected 2026-03-02, then Load as Plan B opened `/compare`
  and sent a new compare automatically. HTTP 200 returned REAL/terrain_coarse;
  Plan B's first epoch exactly matched the selected date at UTC midnight.
- Horizon hover showed a UTC/value tooltip; Right arrow changed the inspected
  sample from 1922 to 1923. Emulated touch updated the inspector after finger lift.
- Compare had no horizontal document overflow at widths 320, 375, 768 and 1440.
  Desktop and phone-width chart screenshots were inspected.
- In-app navigation to Report preserved the computed comparison; Right arrow on
  its timeline changed the scrubber. A full document reload still intentionally
  clears in-memory results; that is not represented as persistent storage.
- No JavaScript exceptions were recorded in the completed journey. Physical-device
  and spoken screen-reader acceptance remain open. Vite's lazy Three chunk size
  advisory and pre-existing dependency warnings remain. The 21st CLI is absent;
  no 21st automated review result is claimed.

The user's usual preview at `http://127.0.0.1:5173/` now runs this integration
checkout with real backend at `:8000` and external data at `R:/azelux-data`.
The prior preview was verified as the old clean-clone process before replacement.
Local review artifacts are under ignored `work/flow-charts-browser/`.
Actual browser observations are recorded in
[UX_FLOW_CHARTS_BROWSER_2026-11-15.json](evidence/UX_FLOW_CHARTS_BROWSER_2026-11-15.json).

These changes and the preceding merge await human diff review before a local
commit under AGENTS.md. Nothing was pushed. V4 remains FAIL; no MVP gate is passed.
