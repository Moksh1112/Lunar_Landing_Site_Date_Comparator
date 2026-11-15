# Release checks resumed — 15 November 2026

Source checkpoint: `42148f6`. This check does not authorize release.

## Completed

- Integration worktree fast-forwarded to the handed-over commit; existing previews and worktrees preserved.
- Real backend `127.0.0.1:8012/health` checked: mock false, five kernels, far DEM plus three local tiles, contract 1.1 and manifest `1dcb16ff00b027c8e5fbe31ebd468014a7e84f6f64d83ef38c024c8d94b95175`.
- Real-mode production frontend build passed. Existing large-chunk and upstream annotation warnings remain.
- Map attribution source review: `SiteMap.tsx` displays a NASA heading, method and linked citation above the map when imagery is loaded. Disabling Leaflet's attribution control does not remove this separate credit. Rendered verification remains to be done.
- Dependency inventory generated: 298 npm lock entries, all with declared licences; 41 locked Python packages. 35 Python records use installed matching-version metadata; six use exact-version PyPI metadata. Inventory is evidence, not legal clearance; full third-party notices and licence obligations still need review. Vendored React Bits, fonts and imagery are separately listed in the release checklist.

Reproduce the inventory with `node scripts/python.mjs scripts/inventory_licenses.py` after setup; network access is required for missing locked metadata. Output: `docs/evidence/DEPENDENCY_LICENSES_2026-11-15.json`.

## Lighthouse: performance gate still open (superseded: met in emulation after `62ffd0c`; see PERFORMANCE_HOME_2026-11-15.md)

Lighthouse 12.8.2, local production preview `http://127.0.0.1:5193/`, mobile simulated throttling, Edge headless:

- Performance 80 / 100; required bar 90 is NOT met.
- Accessibility 100 / 100; automated accessibility alone is not a spoken screen-reader test.
- FCP 2.3 s; LCP 3.4 s; total blocking time 360 ms; layout shift 0.063; transfer 1,392 KiB.
- Largest content element was the Home heading; report attributes most delay to rendering. Home imports Three.js and constructs its decorative WebGL scene immediately. This is a candidate to profile, not a proven sole cause.

A development-server run was also performed, but it is not used for the release score. Summary evidence: `docs/evidence/LIGHTHOUSE_HOME_2026-11-15.json`. Full raw report stays outside Git at `C:/Users/ASUS/Documents/Codex/azelux-lighthouse-production.json`.

Command: `npx --yes lighthouse@12.8.2 http://127.0.0.1:5193/ --only-categories=performance,accessibility --chrome-flags="--headless --no-sandbox" --output=json --output-path=<external-report.json> --quiet`, with `CHROME_PATH` pointing to Edge. Build and serve the production output before auditing. Port 5193 is a temporary production preview, not the real API acceptance URL.

## Decisions and remaining work

Moksh chose to retain the ten-site library without adding a new public warning. Existing coordinate/source truth and accurate release documentation remain. A project licence was not selected; no LICENSE file was added.

Next frontend-owner task: profile initial Home JS/WebGL work and defer nonessential initialization where justified, preserving Moon appearance, navigation and fallback; remeasure the same production audit and check meaningful journeys. Do not hide animation or alter the audit only to obtain a score.

Still human-owned: physical phone/tablet, second browser, spoken screen reader, two independent usability participants, slow-device 3D/fallback; record evidence or explicit user waiver. Project licence and full redistribution-notice review remain. Final authorization, deployment, two deployed rehearsals and submission remain pending.
