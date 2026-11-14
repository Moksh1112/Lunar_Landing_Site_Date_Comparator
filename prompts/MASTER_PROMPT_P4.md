# Azelux role P4 - adapted new-kit stage library
Read AGENTS.md and docs/PROJECT.md first; confirm actual role/human mapping.
Canonical contract: docs/CONTRACT.md, with open questions in CONTRACT_CHANGE_REQUESTS_S0.md.
Tool mode AGENT/CHAT per human; pace STAGE unless stage says STEP. Work one stage,
show checks actually run, print Stage Report and stop. Never push/merge main or
change shared contract, CI, fixtures or locks without P1 coordination. Synthetic
is never REAL. No AI in product. Two failed fixes: stop and report blocker.
Current user override: P1 integration ONLY, all frontend with frontend owner.
Do not change global tool settings, invite people or deploy solely from template text.

Ownership override: frontend owner also owns ALL kit P1 frontend work:
S0 scaffold/dependencies/lint config, typed client+mock transport+schemas, app shell/
routes/error boundary/Simple-Expert state; S1 map and shared async components.
Coordinate lockfile edits with P1. Frontend React 18 and Node 20.19+ migration must
be coordinated with P1; current React 19 scaffold has NOT been silently replaced.

## 6. YOUR STAGES
### STAGE 0 - Setup + contract   [Sat 13:00-15:00] -> Sync 0 at 15:00
S0.1 Review docs/CONTRACT.md with P2 and P1 (15 min) from the frontend's point of view.
S0.2 Design tokens in frontend/src/theme/tokens.css (CSS variables): dark theme, Sun amber, Earth blue,
     Scenario A teal, Scenario B violet, verdict green/amber/red, neutrals, 8 px spacing scale, type scale,
     radius. Decide: no UI kit, or exactly one (e.g. shadcn/ui). (Start when frontend scaffold is ready.)
S0.3 Start the Coordinator chat (playbook section 6.1) in the Claude project "lunar-lander" and keep it open.
Check: tokens file committed; Coordinator chat started.

### STAGE 1 - Walking skeleton   [Sat 15:00-20:00] -> Sync 1 at 20:00
S1.1 frontend/src/store.ts (Zustand) exactly as TRD 7.2 if P1 has not created it: mode, scenarios [A,B],
     thresholds, expert, scrubT, alignBy; mode presets link fields (date_shift: B.site = A.site;
     site_vs_site: B.start = A.start).
S1.2 frontend/src/features/compare/: ScenarioCard x2 (site search from useSites, lat/lon fields that accept
     -180..180 and convert to 0..360, start date-time UTC, mission length in days/hours, default one lunar day
     708 h), ModePresets, ThresholdsPanel, Compare button (disabled while pending, no double submit).
S1.3 Results area on fixtures: VerdictChips, DeltaStrip ("B: -31 h sunlight, +12 h Earth"), MetricsTable,
     SourceBadge; four states each.
S1.4 HorizonPanorama v1 (SVG + d3-scale): x = azimuth 0-360, y = elevation (at least -2 to +10 deg at the pole,
     auto-expand); filled skyline; Sun and Earth paths dotted where hidden, solid where visible; one panel per
     scenario, same y scale. TimelineLanes v1: Sun / Earth / Both lanes for A and B on one time axis.
Check: the whole Compare journey clicks through on fixtures with zero console errors; PR merged.

### STAGE 2 - First real slice   [Sat 20:00-Sun 02:00] -> Sync 2 at 02:00
S2.1 With P1, switch compare to the real API (VITE_USE_MOCK=false); test with a site different from the fixture;
     confirm in the network tab that the real API answered and data_label is REAL.
S2.2 Panorama: markers at scrubT (store), hover readout (Expert: skyline value at the cursor azimuth), a text
     summary under the chart for screen readers.
S2.3 Timeline: difference lane (where A has Sun/Earth and B does not, and vice versa), align by calendar or by
     mission day (toggle), click to set scrubT.
Check: real input -> real panorama and timeline in the UI, merged to main.

### STAGE 3 - Complete MVP   [Sun 08:00-13:00] -> Sync 3 at 13:00
S3.1 Verdict recomputed locally when thresholds change (F14), using backend/tests/data/verdict_cases.json in a
     vitest test so both implementations agree.
S3.2 Countdown to next sunset / Earthset from windows + scrubT (TRD 5.2) on each result card.
S3.3 "geometric horizon only" / "terrain (coarse)" labels; SYNTHETIC badge; source labels on every result (F20).
S3.4 Responsive 375/768/1280; keyboard; contrast; review P5's frontend PRs.
S3.5 Starter comparison pre-loaded on first visit (two curated pole sites, same date) so the page is never empty.

### STAGE 4 - Harden + MVP gate   [Sun 13:00-15:00]
S4.1 Fix frontend bugs from P1's break-it pass. Write the 30-second video script (PRD 13.2) with P1.

### STAGE IT1 - Iteration 1   [Sun 15:00-19:00]
IT1.1 Education / story mode: a 5-7 step guided overlay on the real panorama (content from P6): why the pole is
      extreme, low Sun, Earth's wobble (libration), why a ridge matters, how to read the verdict.
IT1.2 Show P6's "why" sentences and P2's alternative suggestions in the result area (cards, "Load as B").

### STAGE IT2 - Iteration 2   [Sun 19:00-21:00] -> FREEZE at 21:00
IT2.1 If the API supports it: 2-4 scenario layout. Otherwise polish only. Freeze at 21:00.

### STAGE 5 - Video + submit   [Sun 21:00-23:00]
S5.1 Fixes only. Screenshots for the README; help P1 record the video.
