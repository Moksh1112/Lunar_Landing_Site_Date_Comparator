# Azelux role P5 - adapted new-kit stage library
Read AGENTS.md and docs/PROJECT.md first; confirm actual role/human mapping.
Canonical contract: docs/CONTRACT.md, with open questions in CONTRACT_CHANGE_REQUESTS_S0.md.
Tool mode AGENT/CHAT per human; pace STAGE unless stage says STEP. Work one stage,
show checks actually run, print Stage Report and stop. Never push/merge main or
change shared contract, CI, fixtures or locks without P1 coordination. Synthetic
is never REAL. No AI in product. Two failed fixes: stop and report blocker.
Current user override: P1 integration ONLY, all frontend with frontend owner.
Do not change global tool settings, invite people or deploy solely from template text.

## 6. YOUR STAGES
(You join on Sunday. Stages S0-S2 were done by the team; start at Stage 3.)

### STAGE 3 - Complete MVP   [Sun 08:00 (or arrival)-13:00] -> Sync 3 at 13:00
S3.0 Setup: read docs/START_HERE.md; clone; set your own git identity; `make hooks`; `make dev`; open the app in
     mock mode. Check: you can run the Compare journey locally.
S3.1 Time scrubber (F17) in frontend/src/features/scrubber/: a slider over the mission time range bound to the
     store's scrubT; play/pause; keyboard arrows; shows the UTC time. Panorama, timeline and 3D read scrubT.
S3.2 Best-date finder page (F7 UI) at /best-date in frontend/src/features/bestdate/: form (site, date range up to
     183 days, mission length, thresholds) -> useSweep -> calendar strip (one cell per day coloured by verdict with
     the word) + ranked list (top 5 marked refined) -> "Load as B" writes into the store and navigates to "/".
     Build on sweep.ok/empty/error fixtures first, then the real API. Show progress while the sweep runs.
S3.3 3D view (F18) in frontend/src/features/view3d/, lazy-loaded (React.lazy) drawer opened from a result card:
     three + @react-three/fiber + @react-three/drei; plane mesh from useTerrainTile (decode base64 float32,
     256 x 256, north-up), vertical exaggeration slider 1-3x; directional light from the Sun's az/el at scrubT;
     an Earth marker on a sky dome at Earth's az/el; play/pause animation over the mission; fallback smooth
     sphere patch when NOT_IN_COVERAGE.
     3D GATE 1 at 11:00: if first render > 3 s or frames drop on a normal laptop, keep 2D default and open 3D only
     on click. 3D GATE 2 at 13:00: if 3D does not work at all, hide it (moves to It.2). Report gate results to P1.
Check: scrubber moves markers in every view; best-date page works on real data; 3D opens (or gate applied).

### STAGE 4 - Harden + MVP gate   [Sun 13:00-15:00]
S4.1 3D performance (<= 3 s first render), reduced-motion respected (no auto-play), responsive best-date page.

### STAGE IT1 - Iteration 1   [Sun 15:00-19:00]
IT1.1 Help P4 with the education mode and alternative-suggestion cards (whatever P4 assigns).

### STAGE IT2 - Iteration 2   [Sun 19:00-21:00] -> FREEZE at 21:00
IT2.1 3D polish: smoother camera, shadows if cheap, labels for Sun and Earth directions.

### STAGE 5 - Video + submit   [Sun 21:00-23:00]
S5.1 Fixes only; help record the 3D shot for the video.

