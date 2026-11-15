# UI routing and graphics follow-up - 15 November 2026

Local base: `ad2ac2e`, parents `28b56e3` and owner source `47d8a58`. These frontend
changes were explicitly requested by the user. They remain local and await human
diff review under AGENTS.md before a further commit. Nothing was pushed and no
new hosted CI result is claimed.

## Behavior

- Best Date **Load as Plan B stays on Best Date**, retains the calendar and confirms
  the saved date. A separate **Compare A and B** action opens the comparator and
  computes that B against the preserved A and thresholds. The earlier automatic
  transition was intentional, but the user found it surprising; it is removed.
- Theme is now an accessible switch with a moving thumb and sun/moon icon. Keyboard
  Space changes it; the saved/system preference behavior remains shared across routes.
- Sun/Earth markers ease 25% of the remaining drawing distance each animation frame.
  Tooltips retain the exact selected response sample. Reduced motion disables easing.
  A panorama north-seam crossing resets instead of sweeping through unrelated azimuths.
- Earth now uses NASA Blue Marble surface and historical cloud composite textures.
  Moon keeps the 4K LROC color map, with a separate LOLA visualization height preview
  replacing the oversized color-derived bump. Latitude/longitude, lighting, scale
  and cloud presentation in these scenes remain illustrative. Credits, download URLs
  and file hashes are in `frontend/src/features/landing/assets/README.md`.
- Tour framing keeps Earth visible on laptop windows. Scene teardown releases textures,
  materials, geometry and the WebGL context. Simulator reuses the textured models.
- Terrain gets neutral themed scene backgrounds and illustrative fill lighting. A
  graphics failure now collapses to a recovery panel with actual error details and
  one retry. After two failed attempts it directs users to the working 2D views.
  Actual context loss is detected. Pixel density is capped at 1.5 for this viewer.
  The existing three-second first-frame gate and scientific thresholds are unchanged.

## Verified

Commands from repository root:

```sh
npm run test --prefix frontend -- --run
npm run lint --prefix frontend
npm run build --prefix frontend
```

All **158 tests in 21 files**, lint, strict TypeScript and production build passed.
The build still emits the existing lazy Three chunk-size and dependency annotation
warnings. A regression test verifies texture/geometry disposal, including shared maps.

Headless Edge against this checkout at `127.0.0.1:5173`, backend at `127.0.0.1:8000`,
documented external data at `R:/azelux-data`:

- Actual health: `mock=false`, contract 1.1, five kernels. Actual compare and terrain
  HTTP responses were REAL/terrain_coarse; no source mode was inferred from styling.
- Scored 240-hour missions, selected `2026-03-02`, clicked Load as Plan B and remained
  on `/best-date` with the calendar intact. Explicit Compare opened `/compare`; the
  actual returned Plan B series begins at `2026-03-02T00:00:00Z`.
- Terrain started before these edits on this host; **the original user startup error
  was not reproduced**. Denying WebGL deliberately produced the new compact failure
  panel; restoring WebGL and retrying rendered terrain in 199 ms on this warm run.
  Both themes, Plan B and 5x exaggeration rendered. Losing the recovered context
  produced fallback and stopped after the second failure. These are induced graphics
  tests, not evidence identifying the user's original GPU/browser error.
- Four subsequent in-app Home/Compare cycles started terrain at 172/169/179/164 ms.
  These one-host measurements do not establish slow-device performance acceptance.
- Marker drawing had a measured intermediate position before settling; reduced motion
  placed it immediately. Compare widths 320/375/768/1440 had no horizontal overflow.
- NASA image requests returned 200; dark/light model screenshots were inspected.
  Simulator 3D initialized and Start mission worked at 320 and 1440 px without overflow.
  Keyboard Space changed the theme switch. No unexpected JavaScript exceptions.

Machine-readable observations:
[UI_RECOVERY_BROWSER_2026-11-15.json](evidence/UI_RECOVERY_BROWSER_2026-11-15.json).
Screenshots are supplementary local artifacts in ignored `work/ui-recovery-browser/`
and `work/ui-recovery-visual/`; the repeat steps below do not require those files.

## Repeat without local probe files

1. Follow `NON_RELEASE_HANDOFF.md` to acquire runtime data outside Git. Set an absolute
   non-cloud `AZX_DATA_DIR`, disable backend/frontend mocks and run `npm run dev:all`.
   Inspect `/health` and actual `/api/v1/compare` response labels/provenance.
2. Open Best Date, use a short range and 240 h, score it, choose a different day and
   Load as Plan B. Confirm URL/calendar remain unchanged. Click Compare A and B and
   inspect the request and returned B start timestamp in browser Network tools.
3. Open terrain 3D; check both themes, plans, exaggerations and the shared scrubber.
   Drag to orbit. Navigate Home/Compare repeatedly and reopen terrain each time.
4. For an induced context-loss check in browser developer tools, after terrain loads:

   ```js
   document.querySelector('[aria-label="Terrain 3D"] canvas')
     .getContext('webgl2').getExtension('WEBGL_lose_context').loseContext()
   ```

   Confirm compact details/retry, successful retry where graphics remain available,
   and fallback after a second failure. For a natural failure, read Graphics details;
   do not assume the theme background caused it.
5. Hover horizon/ring paths: markers and compact popups should ease toward selection.
   Verify focus/arrows/Escape, reduced motion, saved theme after navigation/reload,
   and simulator startup. Inspect the Moon/Earth imagery credits.

Physical-device GPUs, another browser, spoken screen-reader checks and full F1-F25
acceptance remain pending. Backend science, runtime data, fixtures and the contract
were unchanged. V4 remains FAIL; no release or MVP gate is advanced.
