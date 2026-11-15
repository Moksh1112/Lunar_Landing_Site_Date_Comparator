# Pull merge recovery - 15 November 2026

The user requested recovery of the interrupted pull on `feat/p1-s0-integration`.
The merge commit containing this report retains both parents:

- Local: `194aa94a77360743a940bebf60edc6da94106aef`.
- Incoming: `89ce28c3905effa7c52abef06f7e5d9dd9f74923`.
- Common ancestor: Moksh's theme source `47d8a58083f5a440d41d20d8a8c5b829cc0300ba`.

Incoming [CI 43721206324](https://github.com/Moksh1112/Lunar_Landing_Site_Date_Comparator/actions/runs/43721206324)
was independently checked: all seven jobs succeeded (frontend, backend, fixtures,
attribution, secrets scan and both startup modes). It validates the incoming SHA,
not this combined local revision. No push, main merge, tag or release is authorized.

## Resolution

Before editing, the conflicted files, index stages, staged patch and worktree patch
were saved under ignored `work/merge-recovery-194aa94-89ce28c`. No history was reset,
rebased or discarded, and no new branch was created.

Nine conflicts were resolved:

- `README.md` and `docs/LANDING_INTEGRATION.md`: retain the local tour-at-Home routes,
  `/terrain` and historical scope, with the incoming offline briefing added.
- `docs/MVP_VERIFICATION.md`, `docs/RELEASE_PREPARATION.md`, `docs/TAKEOVER_CURRENT.md`:
  combine evidence with explicit source attribution; keep the V4 failure and record
  the incoming owner's separate V4b adoption. Update startup transfer instructions
  for a bundle containing the completed merge, which descends from published `89ce28c`.
- `ComparePage.tsx`: preserve the incoming single-flight submission gate and gap-first
  result flow, with the local Plan B handoff revision guard applied to that flow.
  Keep gap analysis and the local sky/horizon section; do not restore the old
  Compare-bottom terrain panel.
- `TimelineLanes.tsx` and `charts.module.css`: retain both gap highlighting and cursor
  tooltips/keyboard inspection, using the existing seconds-based shared scrubber.
- `store.ts`: retain gap focus and alignment behavior, guard both result setters
  against pre-handoff completions, and clear results, scrubber and gap focus on Load B.

The merge also retains automatically merged owner work: backend `c116ceb` (near+far
coverage fix and validation-only V4b), frontend `b2b7cc9` (gap/explanation/briefing,
single-flight requests and Methods wording), and incoming release evidence.
The newer frontend head `62ffd0c` is **not** in `89ce28c`; its Home performance work
is left for a separate exact-SHA/CI review, especially because local `/` is the tour.

Implementation/review used AI assistance under the user's recovery request. Human
Git identity remains unchanged; no generated author/coauthor/footer was added.

## Combined checks

- `npm --prefix frontend run test -- --run`: **197 passed, 28 files**. Includes a new
  regression for a late `showNewCompare` completion after Load B.
- `npm --prefix frontend run lint`: PASS.
- `npm --prefix frontend run build`: strict TypeScript and production build PASS.
  Existing Zod annotation and large visual-chunk warnings remain.
- `node scripts/python.mjs -m ruff check backend`: PASS.
- With `AZX_DATA_DIR=R:/azelux-data`, `node scripts/python.mjs -m pytest backend/tests -q`
  using workspace-local `--basetemp` and `cache_dir`: **556 passed, 6 skipped**.
  The skips require pre-cached skylines. Initial sandbox temporary-directory errors
  were environmental; the rerun used ignored workspace scratch directories.
- `npm run check:setup`: PASS; `npm run check:fixtures`: **15 SYNTHETIC fixtures PASS**.
- `npm run check:dependencies`: PASS after allowing access to uv's existing cache;
  the initial sandbox cache-access denial was not a dependency failure. The check
  installs only into its isolated scratch directory and leaves the lock unchanged.
- Fresh isolated combined stack: frontend `:5182`, backend `:8014`, distinct Vite
  cache and temporary CORS origin. Existing `:5173`/`:8000` services were preserved.
  Both new modules started; health was `mock=false`, contract 1.1, five kernels,
  far DEM plus three near tiles. The test stack was stopped after checks.
- `AZX_WEB_URL=http://127.0.0.1:5182 node scripts/check-ui-review.mjs`: **nine checks PASS**,
  isolated Chrome 157.0.8103.51, no uncaught errors. Actual terrain responses:
  **REAL / terrain_coarse**. New coupled checks verify gap focus/highlight and hover
  coexistence, one POST for same-frame double Compare, and generation of a 419,129
  character offline briefing with provenance/validation. Existing camera, playback,
  chunk recovery, history, stale-result and Escape regressions also pass.
  [Browser evidence](evidence/MERGE_RECOVERY_BROWSER_2026-11-15.json).
- Fresh REAL near+far API smoke on the combined backend: Athena, 240 h,
  A=2027-03-01 RED, B=2027-03-14 GREEN; `both_hours` 0 / 210.1 and A-minus-B **-210.1 h**.
  Provenance identifies SPICE DE440 and `tile im2-athena + far_160m`.
  [API evidence](evidence/MERGE_RECOVERY_REAL_2026-11-15.json).
- Conflict-marker, documentation-link, whitespace and parent-history checks: PASS.

The browser's delayed response, chunk failure and context losses are deliberately
controlled test behavior. The generated briefing was checked in this pass; a new
offline replay/print journey was not repeated. Prior owner replay evidence remains
attributed in `frontend/docs/HANDOFF_GAP_BRIEFING.md`.

Original V4 remains **FAIL ~6.299 pp**; V4b is a different validation-only visibility
definition and does not validate the runtime centre rule. V6 remains qualitative.
No long V4/V4b calculation, new clean-clone data acquisition, Lighthouse rerun,
physical-device, spoken-screen-reader, deployed rehearsal or final acceptance was
performed. Current pending work and coordination are in [PROGRESS.md](PROGRESS.md).
