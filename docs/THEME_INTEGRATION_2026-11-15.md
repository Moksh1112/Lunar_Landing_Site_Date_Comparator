# Monochrome redesign integration - 15 November 2026

P1 baseline: `28b56e34803c08860a68c4069efa8fc6722d7678`.
Owner source: `codex/unified-monochrome-theme` at
`47d8a58083f5a440d41d20d8a8c5b829cc0300ba`, containing `4812d1c`, `d2e6860`,
`2fddcb0` and `47d8a58`. Exact source hosted CI:
[43707999082](https://github.com/Moksh1112/Lunar_Landing_Site_Date_Comparator/actions/runs/43707999082), SUCCESS.

`git fetch --all` retrieved the owner branch. Initial working tree had only the
user's untracked `.codex/`; preserved. `git merge --no-ff --no-commit
origin/codex/unified-monochrome-theme` applied without conflicts. No owner code was
edited by P1. The merge is pending human diff review before commit under AGENTS.md;
current user instruction is commit locally only, with no push. There is no hosted
integration run for the prepared merge.

## Subsequent user-requested fixes

The later user instruction authorizes scoped frontend fixes on top of this prepared merge: default tour landing page, Briefing link, Best Date automatic comparison and interactive chart inspection. See [UX_FLOW_CHARTS_2026-11-15.md](UX_FLOW_CHARTS_2026-11-15.md). The byte-for-byte owner-source checks below describe the earlier merge checkpoint, before these authorized edits. The merge remains uncommitted pending human review.

## Integrated behavior and P1 work

- Home `/`: decorative NASA-textured Moon/satellite, primary Compare action and
  prominent optional simulator card. Satellite remains labelled illustrative.
- Comparator `/compare`; Best Date `/best-date`, Methods `/methods`, Report `/report`.
  Tour `/learn/tour`; simulator `/learn/simulator`.
- `/landing`, `/landing/tour`, `/tour` redirect to new learning routes using replace
  and preserve query/hash. Simulator and Best Date handoffs now target `/compare`.
- Monochrome theme, mobile/desktop navigation, Learn menu and app Back behavior.
  Report print styles retain white paper. Owner report/print/simulator journeys in
  `frontend/docs/HANDOFF_MONOCHROME.md` remain attributed to Moksh.
- P1 updated README, current progress, takeover, alignment, release demo routes and
  the F1-F25 evidence scope. Backend, scientific contract, fixtures, dependency and
  lockfile contents are unchanged. Existing setup repeat fix is preserved.

## First combined test pass

- Frontend lint, strict TypeScript/production build: PASS.
- Vitest: 18 files, **148 passed** (six route tests added by owner).
- Backend Ruff: PASS; pytest with acquired data: **551 passed, 6 skipped**.
  All skips identify absent cached skylines, not scientific passes.
- `npm run check:setup`: PASS; `npm run check:fixtures`: all 15 SYNTHETIC fixtures PASS.
- Main build entry is now approximately 318 kB; lazy Three module remains about
  753 kB with Vite's chunk advisory. Existing third-party annotation/deprecation
  warnings remain. Build success is not device performance certification.

## Independent browser integration evidence

P1 used an isolated headless Microsoft Edge instance through CDP, at actual CSS
widths 320, 375, 768, 1024 and 1440 (900 px height), with the merged source served
at `http://127.0.0.1:5188` and separate real backend at `http://127.0.0.1:8008`.
The backend allowed exactly the preview origin. No running owner preview was modified.

Commands to reproduce the isolated services from the integration checkout, in
separate PowerShell terminals after setup:

```powershell
$env:AZX_DATA_DIR='R:/azelux-data' # substitute an acquired absolute non-cloud data directory
$env:AZX_USE_MOCK='false'
$env:AZX_CORS_ORIGINS='http://127.0.0.1:5188'
node scripts/python.mjs -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8008
```

```powershell
$env:VITE_USE_MOCK='false'
$env:VITE_API_URL='http://127.0.0.1:8008'
node frontend/node_modules/vite/bin/vite.js frontend --host 127.0.0.1 --port 5188 --strictPort
```

Observed:

- Eight routes at five widths (40 page views): no document horizontal overflow
  and no JavaScript exceptions. This is not a claim of exhaustive visual acceptance.
- Screenshots at 1440 and 320 inspected: normal Moon/orbit fits its canvas; at
  1440 the prominent simulator card fits in the left column. The 1024 canvas also
  fits the viewport by DOM measurement. Long phone pages scroll vertically.
- All three legacy redirects preserve query/hash; Home's primary action reaches
  `/compare`. A real browser Compare request returned HTTP 200 with both scenarios
  labelled REAL / terrain_coarse; actual metadata and signed deltas were inspected.
- With WebGL disabled before page load, Home renders the loaded 4096 px NASA image
  and no canvas. This confirms the no-WebGL image fallback.
- Learn and mobile Menu close with Escape, set aria-expanded=false and restore
  focus to their trigger. Direct-entry Methods Back reaches `/compare`.
- New complete simulator qualification/handoff and print/export journeys were not
  independently repeated in this pass; owner evidence is not relabelled P1 evidence.
- The 21st CLI is not installed, so no `21st review` result is claimed. Playwright
  import failed in the available REPL; standalone Edge/CDP provided the actual checks.

## Frontend issue found - reduced-motion Moon texture

**Reproduced:** set prefers-reduced-motion=reduce before loading Home and wait for
the image download. Home shows an untextured dark sphere, unlike the textured Moon
under normal motion. The page remains usable; this is a visible regression in the
new decorative scene, not a scientific computation defect.

Source: `frontend/src/features/home/HomeMoon.tsx`. In reduced motion, one render
occurs before the asynchronous texture load completes. `tex.onUpdate` runs on GPU
upload during a render; it does not schedule a render when image loading finishes.
The static branch has no animation loop to pick up the image. The frontend owner
should render on texture-load completion and verify reduced-motion resize/context
failure behavior. P1 did not edit owner source or claim this issue fixed.

Local review artifacts: ignored `work/theme-browser/home-1440.png`, `home-1024.png`,
`home-320.png`, `home-reduced.png`, `results.json` and `supplement.json`. The steps
above describe reproduction without depending on those local files or owner scripts.
Actual DOM measurements, exceptions, real-response metadata and supplemental
results are also recorded in
[THEME_BROWSER_2026-11-15.json](evidence/THEME_BROWSER_2026-11-15.json).

## Second test pass and review status

After route-documentation integration and browser verification: frontend lint,
148 tests and strict TypeScript/production build passed again. Backend passed
551 tests with the same six cached-skyline skips (34.52 s). `npm run check` passed.
Documentation links and code fences passed checks. Exact source CI's seven jobs
were individually verified through the GitHub connector.

`git diff --cached --check` identifies one imported extra blank line at EOF in
`frontend/src/app/AppShell.module.css`; it is a whitespace finding, not represented
as a passing check. Owner source was retained byte-for-byte. The local merge and
P1 documentation are prepared for human diff review; no new commit or push yet.

V4 remains FAIL at about 6.2989 pp versus <=5 pp; V6 remains owner qualitative.
Partial-data terrain-mode labeling, physical devices, spoken screen-reader use,
slow-device 3D and independent usability remain open. No MVP/release gate is passed.
