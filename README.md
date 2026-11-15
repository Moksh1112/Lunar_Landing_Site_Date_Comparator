# Azelux - lunar landing site and date comparator

Azelux compares two lunar south-pole landing plans by site and/or date, showing when the Sun and Earth clear the local horizon with sourced terrain where available.

A NASA Space Apps 2026 hackathon project. **Live demo:** `<to be added>` (not deployed).

## Why it matters

Near the lunar south pole, low-angle Sun and Earth directions make local terrain important. A ridge can interrupt sunlight or obstruct the line of sight toward Earth.
Changing the site or landing date changes those windows across a mission.
Azelux makes that difference visible, while keeping illumination separate from predicted power and Earth visibility separate from a guaranteed communications link.

## Four product pillars

- **Difference first:** compare Plan A and Plan B with deltas defined as **A minus B**.
- **Find a better date:** search landing days at one site and load a candidate as Plan B.
- **Proof built in:** inspect Methods, validation artifacts and each result's source labels.
- **One tool, two audiences:** freely switch between Simple and Expert displays.

## Implemented today

| Area | Available behavior |
| --- | --- |
| Site selection | Ten primary-source-backed library entries, coordinate entry, polar/global 2D maps and comparison presets. |
| Computation | Local SPICE ephemerides, sourced polar terrain skylines and explicit terrain/coarse/geometric modes. |
| Results | Sun, Earth and both-visible windows; hours/percentages, longest gaps, countdowns and editable threshold verdicts. |
| Exploration | Horizon panoramas, sky views, aligned timeline/shared scrubber, hover/focus inspection and optional terrain 3D with 2D alternatives. |
| Best Date | Candidate-date search, ranked results and an explicit Load as Plan B / Compare flow. |
| Gap analysis | Longest visibility-gap focus, deterministic interval explanations and event jumps. |
| Presentation | Simple/Expert, light/dark themes, an introductory tour and an optional mission simulator. |
| Evidence and export | Methods/provenance, CSV, JSON, browser print/report and a standalone offline HTML briefing. |

The library includes an intended target and an impact reference; it is **not ten actual landings**.
The offline briefing replays one computed snapshot; it cannot calculate new missions offline.
No runtime AI/ML, database, authentication or uploads are required by the current app.
See the [F1-F25 ledger](docs/MVP_VERIFICATION.md) for evidence and incomplete acceptance items.

### Where to explore

| Route | Purpose |
| --- | --- |
| `/` | Default tour landing page, including an illustrative A/B Moon scene. |
| `/compare` | Two-plan comparison workspace. |
| `/best-date` | Landing-date search. |
| `/terrain` | Dedicated 3D Terrain Analyser, sky/horizon and timeline views. |
| `/methods` | Methods, sources, validation and limitations. |
| `/report` | Printable comparison report. |
| `/learn/simulator` | Optional Mission Planning Simulator. |
| `/learn/tour` | Alternate tour entry. |

Legacy `/landing` opens the simulator; `/landing/tour` and `/tour` redirect to the tour.
These routes describe the integration branch. Use the [takeover instructions](docs/TAKEOVER_CURRENT.md) for revision and startup checks.

## How it works

```text
Plan A / Plan B -> SPICE positions -> local skyline -> visibility windows -> metrics -> threshold verdicts
```

The React/Vite client sends plans to FastAPI. SPICE supplies runtime Sun/Earth directions;
LOLA terrain supplies the skyline where coverage exists. Runtime visibility uses each body's **centre**.

- `terrain`: near-field tile plus usable far-field DEM.
- `terrain_coarse`: far-field DEM only.
- `geometric`: explicitly labelled **geometric horizon only**, without terrain obstruction.

JPL Horizons is used only by offline validation tools, never as the runtime ephemeris.
Results retain REAL/SYNTHETIC, horizon mode, DEM, kernel/ephemeris, sample step and manifest provenance.
The [API contract](docs/CONTRACT.md) defines coordinates, UTC times, units and limits.

## Data sources and credits

- [NASA/JPL NAIF SPICE](https://naif.jpl.nasa.gov/naif/): runtime kernels and observation geometry.
- [NASA GSFC PGDA product 90 / LOLA](https://pgda.gsfc.nasa.gov/products/90): polar terrain DEMs and hillshade.
- [PGDA product 69](https://pgda.gsfc.nasa.gov/products/69): polar illumination/Earth-visibility validation reference.
- [JPL Horizons](https://ssd.jpl.nasa.gov/horizons/): independent ephemeris reference for offline checks.
- [NASA SVS CGI Moon Kit](https://svs.gsfc.nasa.gov/4720/): LROC color mosaic and LOLA height visualization.
- [NASA Blue Marble](https://science.nasa.gov/earth/earth-observatory/the-blue-marble-true-color-global-imagery-at-1km-resolution/): illustrative Earth surface/cloud imagery; NASA Goddard, Reto Stockli and Robert Simmon.

Visualization textures do not supply the numerical terrain/visibility calculations.
[Asset credits and hashes](frontend/src/features/landing/assets/README.md),
[site-source review](docs/evidence/SITE_SOURCE_REVIEW_2026-11-15.md) and
[third-party notices](frontend/public/THIRD_PARTY_NOTICES.txt) retain detailed attribution.

## Validation status

The following are committed evidence records, with their own coverage and owner attribution, not independent scientific certification.

| Check | Recorded outcome |
| --- | --- |
| [V1](validation/results/V1-ephemeris.json) | **PASS:** SPICE/Horizons directions, three test positions over 48 hourly epochs. |
| [V2](validation/results/V2-ephemeris.json) | **PASS:** Horizons east-positive coordinate/header parity. |
| [V3](validation/results/V3-regressions.json) | **PASS:** synthetic mathematical skyline-geometry regressions. |
| [V4](validation/results/V4-illumination.json) | **FAIL:** largest difference about **6.299 percentage points**, against a target of at most 5. |
| [V4b](validation/results/V4b-any-fraction.json) | **PASS, separately adopted:** ten any-visible-fraction rows within 5 points; maximum about 4.135 points. |
| [V5](validation/results/V5-regressions.json) | **PASS:** synthetic mathematical windows/metrics/verdict regressions. |
| [V6](validation/results/V6-sanity.json) | **PASS as an owner-reviewed qualitative spot check**, not independent certification. |

**V4 remains a failure.** V4b uses a different, validation-only disc-visibility definition and hourly sampling;
it does not establish that the runtime's body-centre rule matches PGDA within 5 points.
Reference terrain, epoch and observer-height comparability also remain limited.
Read the [V4/V4b decision record](backend/docs/V4_DECISION_2026-11-15.md) and [evidence interface](validation/README.md).
Green CI does not establish scientific, MVP or release acceptance.

## Quick start

Requirements: Node 20.19+, npm, uv and Python 3.12 (3.11 supported).

```sh
npm run setup
npm run hooks
npm run dev:s0
```

Open http://127.0.0.1:5173/; backend health is http://127.0.0.1:8000/health.
`dev:s0` explicitly selects **SYNTHETIC** frontend/backend fixtures. Their fixed responses do not reflect submitted inputs. Ctrl+C stops both modules.

### Real-data mode

A clone contains **no runtime kernels, DEM rasters or acquired basemaps**.
Set `AZX_DATA_DIR` to your own absolute, non-cloud directory outside the repository,
then follow [documented acquisition and preparation](docs/NON_RELEASE_HANDOFF.md).
Small licensed visualization textures are vendored separately; they are not computation data.

After acquiring the required resources, explicitly select real mode, for example in PowerShell:

```powershell
$env:AZX_USE_MOCK = 'false'
$env:VITE_USE_MOCK = 'false'
npm run dev:all
```

Check actual `/health` kernel/DEM lists and comparison provenance; `mock=false` alone does not prove terrain readiness.
A near tile without a usable far DEM returns TerrainUnavailable, not full terrain coverage.
See [.env.example](.env.example) for configuration names and use exact CORS origins.

### Managed Windows fallback

Stop this checkout's Python/Vite processes before setup; Windows can lock their files.
Run one Vite dev server per checkout, or use an isolated cache/worktree for another preview.
If policy blocks generated venv launchers, use the documented target mode:

```powershell
$env:AZX_PYTHON_MODE = 'target'
npm run setup
npm run dev:s0
```

Target mode isolates dependencies without changing OS protections.
Setup preserves an existing venv, records the selected interpreter and needs no manual activation.
Backend dependencies are governed by [pyproject.toml](backend/pyproject.toml) plus [uv.lock](backend/uv.lock); frontend dependencies use [package-lock.json](frontend/package-lock.json). Setup uses locked, hashed installs.

## Checks and shared-branch workflow

```sh
npm run check:setup
npm run check:fixtures
npm run check:dependencies
npm run check
npm --prefix frontend run lint
npm --prefix frontend test -- --run
npm --prefix frontend run build
npm run check:backend
npm run check:startup
npm run test:watch-integration
```

With the real-data dev app/backend running, `npm run check:ui` runs the scoped Chrome checks in an isolated profile. The launcher enables WebSocket on Node 20; `BROWSER_PATH` and `AZX_WEB_URL` can override the browser and frontend URL.

Stop previews before `check:startup`; it needs ports 5173/8000 free and checks synthetic startup/shutdown.
`check:backend` is a baseline health check. Full backend lint/tests use:

```sh
node scripts/python.mjs -m ruff check backend
node scripts/python.mjs -m pytest -c backend/pyproject.toml backend/tests -q -rs
```

CI has seven jobs, including synthetic startup in venv/target modes. Dataset-dependent skips are not passes.
The teammate pushes on shared `feat/p1-s0-integration`; integration review/testing is requested separately.

```sh
npm run watch:integration
npm run watch:integration -- --once
npm run watch:integration -- --interval 120
```

The [watcher](docs/INTEGRATION_WATCHER.md) polls every 60 seconds by default and only fast-forwards clean checkouts.
Divergence is fetched for manual integration. It never commits, stashes, resets or pushes.
Keep it running in a terminal; Ctrl+C stops it. Stop it before manual Git work; it is not a boot task.
Preserve owner branches and local edits. Human review precedes commits; push only with explicit user authorization.
Never commit secrets, actual env files, runtime kernels, rasters or caches.

## Limitations and safety

- Planning and education aid only; **not a safety certification**.
- Sunlight is **not a power or wattage prediction**.
- Earth in view is **not a guaranteed radio/direct-to-Earth link**.
- Fixtures, mock results and schematic illustrations are labelled **SYNTHETIC**.
- Geometric no-terrain mode is shown explicitly; terrain resolution/coverage limits detail.
- Green/amber/red verdicts compare user thresholds, not landing safety.
- Full human usability, physical-device, spoken-screen-reader and slow-device checks remain pending.
- Owner Lighthouse scores for the earlier Home do not certify the current tour landing.

Deployment is stopped. No public demo, final MVP acceptance, release tag or submission is claimed.
[Current progress](docs/PROGRESS.md) and [release preparation](docs/RELEASE_PREPARATION.md) retain the remaining requirements;
[deployment examples](docs/DEPLOYMENT.md) are review material only. Final release actions require Moksh's explicit authorization.

## Roadmap - planned, not implemented

Finalized future scope, outside the current release:

- **Private saved missions:** save, reopen and manage personal scenarios and comparisons.
- **Team workspaces:** share mission plans, results and notes with invited collaborators.
- **Restricted datasets:** control access to private or organization-provided data, subject to its usage terms.
- **Account permissions:** authenticated users with owner, editor and viewer access.

Authentication, persistent storage and access controls will support these future features.
Simple/Expert remains a freely selectable display mode, separate from account permissions.
The current app remains usable without login. These are roadmap commitments, not implemented capabilities.

Later iterations, also not implemented:

- A richer causal "why" explainer beyond today's deterministic interval explanations.
- An alternative-site finder.
- Expanded education/story-mode journeys beyond the existing tour and simulator.
- Three/four-scenario comparison, extending the current two-plan A/B workflow.
- Slope readouts.

## Team and roles

| Role | Responsibility |
| --- | --- |
| P1 integration | Repository coordination, shared tooling, CI, integration, progress/evidence and release preparation. |
| P2/P3 backend and terrain | API/contract implementation, SPICE, terrain/data preparation and validation tools. |
| P4 and frontend roles | Client, map, comparison views, Best Date, simulator, accessibility and exports. |
| Moksh / Coordinator | Scope/contract decisions and explicit final release authorization. |

The [ownership record](docs/PROJECT.md) assigns backend/terrain and general frontend work to the all-rounder;
role numbers describe responsibilities, not necessarily separate people.

## AI assistance disclosure

AI coding assistants were used during development and documentation, with honest submission disclosure required by the team's [event-rules record](docs/EVENT_RULES.md).

## License and notices

The project license is deferred; no project LICENSE has been selected.
Third-party terms still apply: [generated notices](frontend/public/THIRD_PARTY_NOTICES.txt),
[react-three-fiber license](frontend/licenses/react-three-fiber.LICENSE), [GSAP notice](frontend/licenses/gsap.NOTICE)
and [font license](frontend/src/theme/fonts/SchibstedGrotesk-OFL.txt).
The older GSAP 3.12.5 terms uncertainty remains recorded in [release preparation](docs/RELEASE_PREPARATION.md).
Canonical scope is [PRD/TRD/Playbook](docs/specs/), with [alignment overrides](docs/SPEC_ALIGNMENT.md); archived reports are historical.
