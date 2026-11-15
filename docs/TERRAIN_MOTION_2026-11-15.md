# Terrain height and motion refinement - 15 November 2026

Implementation commit: `63bf0af` on `feat/p1-s0-integration` (local, unpushed).

Follow-up to `50b14ea`, requested by the user. AI-assisted implementation and automated
verification; existing human git identity retained. No push or hosted CI is claimed.

The final design keeps gray height shading only: lower DEM elevations are darker,
higher elevations lighter, with neutral white viewing light and a meter legend.
Top-surface samples and terrain resolution are unchanged; crater detail is limited
by those samples. The continuous 1x-5x slider uses 0.1 steps and scales existing mesh
geometry rather than rebuilding it. OrbitControls remain mounted. Height changes
preserve camera position, rotation, zoom and pan; only Reset view or another tile
resets framing.

An initial real-data probe confirmed Earth was moving before these changes, but the
small displacement over several hours was easy to miss. The marker now reuses the
NASA Blue Marble globe, with response-derived motion paths and eased updates. A
mission UTC clock/scrubber supports inspecting the entire stay. Playback clamps
to the selected mission, reaches its endpoint and can replay from the start. No
artificial orbit or ephemeris/threshold change was introduced. Earth texture orientation
and marker scale remain visualization choices documented in Methods.

## Checks

- `npm run lint --prefix frontend`: PASS.
- `npm run build --prefix frontend`: strict TypeScript and production build PASS;
  existing large lazy Three/visuals chunk and dependency annotation warnings remain.
- `npm run test --prefix frontend -- --run`: **163 passed / 22 files**.
- `git diff --check`: PASS.
- Isolated headless Chrome and Brave: actual REAL/terrain_coarse responses; rendered
  Earth changed during playback, and the final marker matched the position calculated
  from returned Earth azimuth/elevation and the tile grid-bearing offset within 0.0002
  display units after easing. Textured Earth map loaded at 2048 px.
- Every one of the 65,536 surface vertices has grayscale RGB values with equal channels;
  minimum/maximum shade differ. Unit checks cover height normalization/flat tiles and
  clamping when switching missions.
- Changed height to 3.4x, then 3.5x with keyboard: rendered group scale changed and mesh
  geometry identity stayed constant. Actual pointer orbit/zoom (Chrome), plus pan
  (Brave), followed by slider input kept camera transforms exactly unchanged. Explicit
  Reset view changed the camera as intended.
- Motion-path toggle, reduced-motion positioning, endpoint replay, light theme and
  responsive bounds at 320/375/768/1440 px passed without unexpected exceptions.

[Machine-readable observations](evidence/TERRAIN_MOTION_2026-11-15.json).

## Repeat

Start the real modules and external data as documented in `NON_RELEASE_HANDOFF.md`.
Open `/terrain`; drag to orbit, scroll to zoom, right-drag to pan. Move Height scale
and confirm that the view stays continuous while relief changes. Reset view should
reframe. Check gray elevation shading against the meter legend. Play the mission,
drag its time slider, toggle paths and inspect Earth/Sun at different times. At the
end, Play mission should restart. Repeat in Chrome/Brave and with reduced motion.

Physical devices/GPUs, full screen-reader work and independent human walkthroughs
remain open. Backend code, runtime data, contract and scientific results are unchanged;
V4 remains FAIL. No MVP/release gate is advanced.
