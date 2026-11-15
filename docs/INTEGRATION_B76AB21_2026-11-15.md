# Ten-commit integration - 15 November 2026

The user requested integration and a local commit of the ten incoming shared-branch
commits. The merge containing this report preserves both parents:

- Local `c542e0b36c9a29780eab2a85e62173e817a43d76` (UI fixes, prior merge and watcher).
- Published `b76ab2193af36334cf9b4e7daab4d46f662e497e` (frontend `101e801`, backend `c116ceb`).

Exact incoming [CI 43728281474](https://github.com/Moksh1112/Lunar_Landing_Site_Date_Comparator/actions/runs/43728281474)
passed all seven jobs, checked independently. No combined hosted CI is claimed:
the user permits local commits only. Both owner heads are ancestors of the combined
revision; no source milestone was rebased, reset or re-merged separately.

## Changes and resolutions

- Incoming `62ffd0c`: deferred HomeMoon scene loading/texture decoding/shader compilation,
  plus an eager shared AppShell. The user's tour still owns `/`; no duplicate Home index
  route is restored. Owner Home Lighthouse results do not measure this combined tour.
- Local texture-load rendering and cleanup guard are carried into `moonScene3d.ts`:
  bitmap completion renders once shaders are ready; completion after cleanup closes the
  bitmap without rendering. The reduced-motion still frame no longer relies on `tex.onUpdate`.
  Updated regression tests exercise the moved implementation.
- Incoming `47642ae`: API and basemap share `resolveApiBase`; an explicitly empty API URL
  stays same-origin. The notices file is served and linked in the shared app footer.
- Incoming `101e801`: original ClickBurst/MagneticHover replace React Bits, license banners
  remain inline, and generated notices accompany the production build. No dependency or
  lockfile upgrade was made. Generation on this checkout corrected the incoming notices'
  Three version from 0.170.0 to the installed/locked 0.187.0, and includes this local
  landing's Earth/cloud and Moon-height visual credits from the existing asset record.
- Six conflicts resolved: current progress and release preparation, AppShell footer,
  route map, HomeMoon and Vite config. Keep the compact Methods link, third-party notices,
  local terrain/React deduplication setup, theme/navigation, graph inspection and Plan B
  handoff behavior. No Compare-bottom terrain launchers return.
- Deployment configuration is example/review material only. The incoming owner handoff
  says **deployment is STOPPED**; no host, service, public URL, main merge, tag, submission
  or final acceptance was created. GSAP 3.12.5's older licensing-terms uncertainty remains
  attributed to the owner; this integration is not legal clearance.

The watcher was stopped after verifying its PID/command before merging. It is restarted
after the local commit. Source updates arriving later remain a separate integration.
AI assisted the actual review, resolution and tests under the user's request; the existing
human Git identity is retained, without invented authors/coauthors or generated footers.

## Checks on the combined code

- `npm --prefix frontend run test -- --run`: **201 passed, 29 files**.
- `npm --prefix frontend run lint`: PASS.
- `npm --prefix frontend run build`: strict TypeScript/production build PASS. Large
  visual-chunk and upstream Zod annotation warnings remain.
- `npm run test:watch-integration`: eight Git scenario subtests PASS (nine with parent).
- `npm run check:setup`, `npm run check:fixtures` (15 SYNTHETIC fixtures),
  `npm run check:backend`: PASS. The last checks baseline startup/health, not full product acceptance.
- Backend Ruff: PASS. Full backend pytest with `AZX_DATA_DIR=R:/azelux-data` and ignored
  workspace `--basetemp`/`cache_dir`: **556 passed, 6 cached-skyline skips**.
- `node scripts/third_party_notices.mjs`: 24 bundled packages, none missing license text;
  regenerated output is byte-identical across two runs. No old React Bits imports remain.
- `AZX_WEB_URL=http://127.0.0.1:5183 node scripts/check-ui-review.mjs`: all **nine** existing
  isolated Chrome regressions PASS. Actual comparison provenance: REAL / terrain_coarse.
  [Development browser evidence](evidence/INTEGRATION_B76_DEV_2026-11-15.json).
- Isolated **loopback-only** production proxy `:5184`, fresh backend `:8015`, build with
  `VITE_USE_MOCK=false` and `VITE_API_URL=''`: **eight** additional browser checks PASS:
  tour remains Home; same-origin health/compare/map metadata and a loaded 2048x2048 basemap;
  notices route/link; a newly downloaded real briefing replays/scrubs offline and reloads
  with **zero HTTP requests**; white print media; real mouse motion/click burst; reduced
  motion plus native Enter activation; production terrain deep link and first frame.
  No uncaught errors. [Production browser evidence](evidence/INTEGRATION_B76_PROD_2026-11-15.json).
- A fresh REAL near+far Athena API smoke through that same-origin proxy reproduced
  A=2027-03-01 RED, B=2027-03-14 GREEN, 240 h, both-hours 0 / 210.1, A-minus-B **-210.1 h**.
  Health: mock=false, contract 1.1, five SPICE kernels, far DEM and three near tiles;
  response identifies `tile im2-athena + far_160m` and manifest `ee455961...abc0cb`.
  [Real response summary](evidence/INTEGRATION_B76_REAL_2026-11-15.json).
- Initial test-harness adjustments: async GPU cleanup assertion waits for shader completion;
  the native keyboard probe sends the Enter character event. These were test timing/input
  corrections, not claimed product defects. Original local servers were preserved; the
  isolated test stack was stopped after checks.
- Conflict markers, whitespace, documentation links and parent-history checks: PASS.

Reproduction uses documented external data acquisition (`NON_RELEASE_HANDOFF.md`), a
normal real dev stack for the checked-in nine-check script, and the same-origin topology
in `DEPLOYMENT.md` on loopback for production. No other person's data/config/probe is
needed for startup. Raw browser results are committed; screenshots/runtime data are not.

Original V4 remains **FAIL ~6.299 pp**; adopted validation-only V4b does not validate the
runtime centre rule. V6 is still qualitative owner evidence. No new scientific sweep,
clean-clone acquisition, Lighthouse score, physical-device, spoken-screen-reader or human
usability acceptance is claimed. Those pending items remain in [PROGRESS.md](PROGRESS.md).
