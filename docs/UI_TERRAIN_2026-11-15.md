# Final local UI milestone - 15 November 2026

Implementation commit: `50b14ea` on `feat/p1-s0-integration` (local, unpushed).

> Scope: Implementation checkpoint: `50b14ea`. Later commit `63bf0af` replaces the height buttons with a continuous slider, adds gray height encoding and Earth-motion controls, and preserves camera transforms during scaling. Earlier counts and checks below remain checkpoint evidence. Current instructions: [TAKEOVER_CURRENT.md](TAKEOVER_CURRENT.md); status: [PROGRESS.md](PROGRESS.md).

This user-directed milestone follows local merge `ad2ac2e` (parents `28b56e3` and
owner redesign `47d8a58`). The user requested local commit after implementation and
exploration. No push, hosted integration CI, release or acceptance gate is claimed.
Implementation and automated review were AI-assisted; existing human git identity
and owner histories are preserved. Earlier UI_POLISH/UI_RECOVERY notes are dated
intermediate observations, superseded by this layout where they differ.

## Delivered behavior

- `/terrain`, **3D Terrain Analyser**, sits beside Best Date in the shared navbar.
  It reuses a matching current comparison or computes valid current plan inputs on
  direct entry. Invalid inputs lead back to the editor; failures retain retry.
  3D, sky/horizon and timeline views share the response and time state.
  Compare's old bottom terrain launcher/fallback buttons have been removed.
- Terrain uses compact segmented plan/scale controls, Reset view, playback, a larger
  viewport, neutral viewing light and readable Sun/Earth markers with a landing-point
  legend. Camera framing accounts for relief exaggeration and narrow screens. Tile
  sides/base frame the finite model; measured DEM top-surface values are unchanged.
  Marker rays originate at the observer. Data label/mode/site/date remain visible.
- Terrain errors distinguish React-hook initialization, lazy-code download and graphics
  failures. The fallback explicitly opens sky/horizon graphs or the timeline in the
  analyser. The two-attempt boundary and three-second first-frame gate are retained.
- Simulator shares the app navbar and theme switch. Its debrief scrubber now changes
  time. Pause uses a native modal dialog, restores focus and excludes paused time from
  the challenge clock. Mobile menu Escape closes navigation without opening Pause.
- Landing light is brighter neutral white, including the fill. Earth has NASA surface
  and historical cloud textures; Moon uses LROC color and a subtle separate LOLA height
  preview. Overlay credits and repeated illustration caveats moved to Methods; original
  attribution and scientific limits remain there. REAL/SYNTHETIC labels are preserved.
- Earlier staged changes remain included: persistent system/saved theme choice, direct
  Simulator nav, quieter Back position, graph-only compact tooltips, 25% marker/tooltip
  easing, reduced-motion handling and Best Date save without surprise navigation.

## Chrome investigation

The user supplied `Cannot read properties of null (reading 'useMemo')`; this is a
React initialization error, not proof of unavailable WebGL. The existing Chrome
window could not be inspected by the computer-use connector. Isolated Chrome and
Brave initially encountered HTTP 504 on a Vite dependency chunk. Process inspection
found active 5173 plus the obsolete task preview on 5188 sharing the same `.vite`
cache; served module and cache metadata hashes differed. The verified old preview
was stopped, then the active server's dependency setup restarted. Fresh Chrome and
Brave loaded real terrain successfully. Vite now explicitly deduplicates React,
ReactDOM and Three, and prebundles the lazy terrain renderer at startup.

These observations establish the stale-module development failure and its recovery;
they do not independently establish the exact original Chrome-profile hook stack.
A hard refresh may be needed in a previously open tab. Do not change graphics settings
merely because a React hook failed. Run one Vite instance per checkout; use a separate
checkout/cache for parallel previews. See Vite's [dependency cache documentation](https://vite.dev/guide/dep-pre-bundling)
and [resolve.dedupe](https://vite.dev/config/shared-options#resolve-dedupe).

## Verification and repeat steps

```sh
npm run lint --prefix frontend
npm run build --prefix frontend
npm run test --prefix frontend -- --run
git diff --check
```

Lint, strict TypeScript/build, **161 tests in 22 files**, and diff whitespace checks
passed. Tests cover error-specific guidance, fitting exaggerated/narrow views, routes,
theme persistence, tooltip easing and shared texture disposal. Existing build warnings
for the lazy Three chunk size and dependency annotations remain.

Isolated headless Chrome 157 and Brave (one Windows host) independently exercised:

1. Direct `/terrain` entry: automatic comparison, REAL coarse terrain response and
   first rendered frame below the unchanged gate. 1x/5x controls, Reset view and
   narrow/desktop framing were checked. Additional Chrome check rendered Plan B at 5x.
2. Deliberately lost WebGL context: error panel, working sky/horizon shortcut,
   four SVG charts, keyboard arrow inspection/tooltip/Escape, timeline shortcut,
   return to 3D and successful retry. This is an induced context-loss test.
3. Simulator's shared six-link nav and active state; full demonstration and practice
   through actual backend requests; qualification pause/resume, no page-control focus
   while modal, debrief slider changes, and mobile menu Escape without Pause.
   Actual simulator responses identified REAL/terrain and SPICE DE440.
4. Bounds at 320/375/768/1024/1440 px across the exercised analyser/simulator layouts;
   no document horizontal overflow. Compare's bottom buttons absent; NASA attribution
   present in Methods; landing overlay credits absent. Screenshots were inspected.

[Actual browser observations](evidence/UI_TERRAIN_BROWSER_2026-11-15.json) record the
versions, modes, timings and assertions. Local screenshots supplement this record;
repeat the steps without them using `npm run dev:all` and documented acquisition in
`NON_RELEASE_HANDOFF.md`. To induce context loss after terrain renders in dev tools:

```js
document.querySelector('[aria-label="Terrain 3D"] canvas')
  .getContext('webgl2').getExtension('WEBGL_lose_context').loseContext()
```

No runtime kernels/rasters/caches were committed. Backend application code, DEM samples,
API contract, scientific thresholds and validation results are unchanged. V4 stays FAIL.
Physical GPUs/devices, spoken screen-reader testing, two independent human walkthroughs
and remaining F1-F25 checks stay open. The revised GREEN simulator challenge remains
owner-reported browser evidence; this pass did not repeat that winning-date journey.
