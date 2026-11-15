# Home performance: investigation and fix (15 Nov 2026)

Supersedes the earlier blocker note (`PERFORMANCE_BLOCKER_2026-11-15.md`, two reverted
attempts). Fix commit: `62ffd0c` on `feat/p4-frontend-s0`. Evidence summary:
`docs/evidence/LIGHTHOUSE_HOME_FIX_2026-11-15.json`. Raw reports and traces are kept outside
Git.

## Environment (same settings as the recorded baseline)

- **Tool and browser:** Lighthouse 12.8.2, default mobile settings, headless Edge.
- **Throttling:** simulated; 150 ms RTT, 1.6 Mbps down, 4× CPU slowdown.
- **Viewport:** 412×823 at DPR 1.75.
- **Server:** a production `vite build` (`VITE_USE_MOCK=false`,
  `VITE_API_URL=http://127.0.0.1:8012`) served by `vite preview` on `127.0.0.1:5194`.
  Port 5193 was held by another process. No development-server output was audited.
- **CLS note:** the backend at :8012 does not allow this origin (CORS), so Home shows the
  "API unreachable" notice, as in the baseline. That notice is the 0.063 CLS. A deployment
  with a reachable API would not show it.

Command (from `frontend/`):

```
VITE_USE_MOCK=false VITE_API_URL=http://127.0.0.1:8012 npx vite build
npx vite preview --port 5194 --strictPort --host 127.0.0.1
npx lighthouse@12.8.2 http://127.0.0.1:5194/ --only-categories=performance,accessibility --chrome-flags="--headless=new" --output=json
```

## Measured cause (trace and report evidence)

- **The LCP element is the Home `<h1>`, not the Moon.** Its LCP was 86% render delay, with no
  load time.
- **In the unthrottled trace the h1 painted at 216 ms,** before any WebGL work.
- **The simulated 3.5 s LCP came from the dependency graph.** Home statically imported
  three.js, so Vite preloaded the 189 KB bundle before Home rendered. Lighthouse therefore
  counted its download against the h1.
  - Earlier attempt 2 hit the same limit: its dynamic import ran in an effect before the
    browser painted, so three.js still started before LCP.
- **FCP waited on a serial request chain:** HTML, then `index.js`, then the lazy AppShell and
  HomePage chunks. At the simulated request latency each serial step costs about 0.6 s.
- **TBT came from WebGL work after paint, not from parsing three.js.** Two
  `requestAnimationFrame` tasks did it:
  - the first render (shader compile and link): 80–141 ms unthrottled;
  - decoding and uploading the 4096×2048 texture: 103 ms, of which 27 ms was main-thread
    image decode.

## Fix (`62ffd0c`)

1. **Scene module:** the three.js scene moves unchanged into `moonScene3d.ts`. HomeMoon
   imports it after two animation frames, which is after the first paint. That is not an
   arbitrary delay, and unmounting cancels the pending work.
2. **Shaders:** compiled with `renderer.compileAsync` (parallel compile where supported).
   Animation starts once they are ready.
3. **Texture:** the same texture is decoded off the main thread with `ImageBitmapLoader`,
   flipped at decode, so it keeps the same orientation.
4. **Lifecycle:**
   - GPU resources are released only after a pending compile settles. Disposing mid-compile
     made three's poll throw; a lifecycle test found this and it is fixed.
   - `forceContextLoss` runs on unmount.
   - The WebGL-availability probe context is released immediately. The baseline leaked one
     context per Home visit.
5. **Bundling:** AppShell and HomePage now ship in the entry bundle (one fewer serial request).
   The entry bundle grows from 101 to 139 KB gzip.

## Results (mobile unless noted; each run a fresh cold load)

| Run | Perf | A11y | FCP | LCP | TBT | CLS |
| --- | --- | --- | --- | --- | --- | --- |
| Baseline `89ce28c` | 79 | 100 | 2497 ms | 3506 ms | 335 ms | 0.063 |
| Step 1: post-paint import | 81 | 100 | 2177 ms | 2895 ms | 461 ms | 0.063 |
| Step 2: + async compile, off-thread decode | 90 | 100 | 2181 ms | 2900 ms | 152 ms | 0.063 |
| Step 3: + eager shell and Home | 94 | 100 | 2032 ms | 2433 ms | 133 ms | 0.063 |
| **Final 1** | **91** | 100 | 2035 ms | 2434 ms | 238 ms | 0.063 |
| **Final 2** | **93** | 100 | 1953 ms | 2433 ms | 188 ms | 0.063 |
| **Final 3** | **94** | 100 | 2031 ms | 2433 ms | 135 ms | 0.063 |
| Desktop (supporting) | 100 | 100 | 465 ms | 553 ms | 0 ms | 0.027 |

Three consecutive final mobile runs: 91, 93 and 94; all three are reported. TBT varies
(140–240 ms), so run 1 is close to the 90 line. A slower host could fall below it.

## Visual and functional parity

- **Real-GPU render, browser pane, 1440 px:** baseline `89ce28c` and `62ffd0c` show the same
  textured Moon, lighting, terminator, orbit ring, satellite, size and placement.
- **Headless software render** (CDP, reduced motion) at 320×640, 375×812, 768×1024, 1440×900
  and 1440×600:
  - the moon box size and position are identical in both builds;
  - the page differs only by the timing of the environment's "API unreachable" notice.
  - The software renderer draws the Moon dark in both builds, so the texture was compared on
    the GPU render instead.
- **Lifecycle** (headless, production build):
  - 6 Home visits and 5 navigations away during initialization: 1 canvas, **1 live WebGL
    context**, no orphan canvases and **0 errors**. The baseline accumulated contexts.
  - The animation runs, the reduced-motion frame stays still, and the canvas resizes to its
    box.
  - Back, Forward and direct refresh of `/compare` work.
  - Without WebGL (`--disable-3d-apis`) the image fallback loads.
- **Routes:** Home → Compare, Tour and Simulator all render, and Back returns to Home with one
  canvas.
- **Checks:** strict TypeScript, ESLint, 178/178 tests and the production build pass.

## Limitations

- Browser emulation only. No physical phone or slow-device measurement, which is still a
  human check.
- The run-to-run TBT variance is shown above.
- The bundle-size warning for the lazy three.js chunk remains; it is no longer on the Home
  critical path.
- No real-backend comparison was re-run for this change. It touches only Home and route
  loading; comparison, Best Date, report and briefing code are unchanged.
