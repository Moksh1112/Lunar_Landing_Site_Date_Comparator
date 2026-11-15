# P1 takeover verification - 15 November 2026

Scope: P1 repository/tooling/CI/docs and independent integration checks. No backend
or frontend implementation was edited; no owner acceptance, stage pass or release
decision is impersonated. Current work assignments are in [PROGRESS.md](PROGRESS.md).

## Exact source and hosted CI

`git fetch origin` succeeded. Initial tracked/untracked status was clean. Existing
human Git identity and `scripts/hooks` configuration were preserved. During work,
untracked `.codex/config.toml` appeared; it is preserved and excluded from this milestone.
Only the integration worktree existed at takeover.

| Ref | Exact SHA | Hosted CI |
| --- | --- | --- |
| P1 `feat/p1-s0-integration` | `38f72b7e21a453e8b5e7c51dd9e64185ffb9f2f6` | [43698317379](https://github.com/Moksh1112/Lunar_Landing_Site_Date_Comparator/actions/runs/43698317379), seven jobs success |
| P2/P3 `feat/p2-p3-backend-terrain` | `7d6ac5554182a262991ff2369e9babb3534edf0a` | [43687231193](https://github.com/Moksh1112/Lunar_Landing_Site_Date_Comparator/actions/runs/43687231193), seven jobs success |
| P4/P5 `feat/p4-frontend-s0` | `414e7dd405af489f0162c622309cc9409ee77982` | [43695763208](https://github.com/Moksh1112/Lunar_Landing_Site_Date_Comparator/actions/runs/43695763208), seven jobs success |
| Preserved `frontend-landing` | `72de2893a031a8f34d3e90c943aef8c3524d114c` | [43692392641](https://github.com/Moksh1112/Lunar_Landing_Site_Date_Comparator/actions/runs/43692392641), Actions API reports success |

`git merge-base --is-ancestor <owner-ref> HEAD` returned 0 for all three owner refs.
No merge was needed or performed. The Actions REST listing was used because the
connector's commit-run tool filters to PR-triggered runs. The latest P1 and P2 job
lists were separately read through the GitHub connector. P1 CI at `38f72b7` is the
published baseline, not evidence for this uncommitted diff's new CI step.

All four source PDFs/kit ZIP matched their bytes and SHA-256 in
`docs/specs/MANIFEST.json`. Read the current handoffs, contract and canonical PDF
text, including Playbook 4.3/5.2 human review, 7 integration and 9 release preparation.
PDF visual layout was not audited; supplied PDFs were not modified.

Kush / [kushpagariya](https://github.com/kushpagariya) is the likely all-rounder,
based on backend/terrain `d5c137b`/`0856c14` and frontend `9901476`. GitHub's public
commit API maps `d5c137b` to that login. Recent heads are authored Moksh1112, so
history does not establish current editing activity. The user will relay coordination;
no external teammate messages were sent.

## Setup correction and clean clone

Host: Windows, Node 22.19.0, npm 11.12.1, uv-selected Python 3.12.15. Existing venv
and SPICE/rasterio imports work here; target mode was not needed on this host.
CI continues to target Node 20 and test venv/target startup.

Original `npm run setup` failed because uv refused an existing `.venv`.
The one-line P1 change adds `uv venv --allow-existing`; locked/hash-checked dependency
sync remains unchanged. `uv venv --help` documents preservation of existing files.
Setup then passed. A subsequent main-checkout setup overlapped active Python data
downloads and Windows refused to replace the running executable; no destructive
clear/rebuild or OS-policy change was attempted. Stop checkout-specific processes
before setup. Repeating setup in the idle fresh clone with the P1 patch passed.
CI now runs setup twice in both startup matrix modes; hosted verification awaits review,
commit and push. Target-mode repeat is not claimed locally.

Clean-clone commands (isolated under ignored `work/`, same existing branch name):

```powershell
git clone --branch feat/p1-s0-integration https://github.com/Moksh1112/Lunar_Landing_Site_Date_Comparator.git work/takeover-clean-clone
cd work/takeover-clean-clone
npm run setup
npm run hooks
npm run check:setup
npm run check:fixtures
npm run check:startup
```

The pristine published clone's first setup succeeded. Only `scripts/setup.mjs` was
then overlaid with the proposed P1 patch to check repeat setup; no owner source,
runtime configuration, dependencies or data were copied from the original checkout.
Hooks, syntax and all 15 SYNTHETIC fixtures passed. Startup reported backend HTTP
200/status ok and frontend HTTP 200/module shell; graceful shutdown released both
ports. This checker forces SYNTHETIC transports. It does not assert a browser journey.

## Local code/tool checks

| Command | Actual result |
| --- | --- |
| `npm run hooks` | PASS, repo-local hook setup |
| `npm run check:setup` | PASS, 35 baseline Python files and Node script syntax |
| `npm run check:fixtures` | PASS, all 15 SYNTHETIC fixtures and deterministic arithmetic/geometry checks |
| `npm run check:dependencies` | PASS, locked runtime/dev imports, partial handoff rejection, lock unchanged |
| `npm --prefix frontend run lint` | PASS |
| `npm --prefix frontend test -- --run` | PASS, 17 files / 142 tests |
| `npm --prefix frontend run build` | PASS, strict TypeScript plus Vite build |
| `node scripts/python.mjs -m ruff check backend` | PASS |
| `npm run check:startup` in both main and fresh clone | PASS, SYNTHETIC startup/shutdown only |
| `AZX_USE_MOCK=true; npm run check:backend` | PASS, baseline backend startup/health only |

Backend suite command from the repository root:

```powershell
$env:AZX_USE_MOCK = 'true'
$env:AZX_DATA_DIR = 'R:/azelux-data'
node scripts/python.mjs -m pytest -c backend/pyproject.toml backend/tests -q -rs --basetemp=work/takeover-pytest-kernels-20261115 -o cache_dir=work/takeover-pytest-kernels-cache
```

Result with acquired kernels/near tiles but no far DEM/maps: **513 passed, 38 skipped**.
Skips identify missing far DEM, PGDA maps and cached skylines; no skip is a science
pass. A no-dataset run passed 501 with 50 skips. Initial command discovery accidentally
collected the nested clone and failed; explicitly naming config/tests fixes the command.
An initial sandbox run also hit Windows temp permissions; the recorded successful run
used workspace-local temporary/cache directories and permitted native-library access.
No backend source was changed for those environment/command failures.

Remaining advisories: Starlette/httpx deprecation; frontend eslint deprecation during
install; third-party Rollup annotation warnings; initial main JS ~687 kB (now ~703 kB
after the concurrent frontend update) and Three module
~753 kB exceed Vite's 500 kB chunk advisory. Build success is not 4G/slow-device QA.

## Independent source acquisition and real HTTP observations

The documented acquisition scripts were executed against NASA sources with
`--data-dir R:/azelux-data`, an absolute non-cloud directory outside Git. All five
kernels, the NASA SVS context image and near-field COG crops were acquired. Kernel
DE440s matched the pinned NAIF MD5; other hashes were recorded without inventing
published upstream checksums. Near crops explicitly do not verify the full 2.7 GB
upstream raster checksum. Dataset preparation completion is recorded below.

The fresh clone was started with explicit shell settings (no untracked config):

```powershell
$env:AZX_DATA_DIR = 'R:/azelux-data'
$env:AZX_USE_MOCK = 'false'
$env:VITE_USE_MOCK = 'false'
$env:VITE_API_URL = 'http://127.0.0.1:8000'
npm run dev:all
```

Actual partial-data HTTP response summaries, full request bodies, statuses,
request IDs and source metadata are prepared in
[TAKEOVER_HTTP_2026-11-15.json](evidence/TAKEOVER_HTTP_2026-11-15.json).
Bulk series/skyline arrays are omitted; reproduction uses the saved request object
with `Invoke-RestMethod -Method Post -ContentType application/json -Body ($request | ConvertTo-Json -Depth 20)`
against the corresponding `/api/v1/compare` or `/api/v1/sweep` route.
The saved health response reports mock=false, five loaded kernels, near tile names,
contract 1.1 and manifest hash `2bfeff7d3cb9d02035687d894ea718c0a009579f8a23e480651fdb9e4a30a172`.
That is a transient partial-data identity; further acquisition changes the manifest.

Observed checks:

- REAL geometric Apollo 11 comparison, A=2027-03-01 / B=2027-03-15, 240 h, 10 min:
  A sunlight 0 h, B 240 h; A-minus-B sunlight -240 h, longest-dark +240 h. All numeric
  deltas agreed with A-minus-B at output precision; undefined mean-up delta was null.
  Empty A sunlight windows and B's full-mission doubly censored window were checked.
- Exact pole and longitude 360: HTTP 400 INVALID_INPUT. Unknown field: 400.
  Mission 8761 h and two 8760 h scenarios at 10 min (>60,000 samples): HTTP 413
  RANGE_TOO_LARGE. These checks do not exhaust every date/mission boundary.
- Geometric skyline endpoint: HTTP 422 NOT_IN_COVERAGE.
- REAL geometric Apollo 11 sweep, 2027-03-01 through 2027-04-29, 240 h: 60 days,
  initial request observed 493.59 ms and cached repeat 11.79 ms. These are single-host
  end-to-end timings, not server-only or full-terrain performance acceptance.
  A range through 2027-08-31 (>183 days) returned HTTP 413.
- Custom (-85, 180 E), outside installed near tiles while far terrain was absent:
  HTTP 500 INTERNAL, human-readable unavailable-terrain error, no fabricated result.
  An initial probe expected 422; actual 500 is retained rather than rewritten.
- Near-only Athena API challenge: B=2027-03-01 RED, B=2027-03-14 GREEN, +210.0 h
  both-visible time for B. This is API evidence with near-only provenance, not the
  owner's +210.1 h near+far browser run or a safety assessment.

**Owner issue: partial-data mode mismatch.** `backend/app/terrain/real.py` `_plan`
returns `terrain` when a near tile exists even if `far is None`; `_dem_name` then
omits the far source. The real HTTP result confirms this state. The adopted contract
defines terrain as 20 m near plus 160 m far. P1 made zero owner-code fixes; the
backend owner must resolve behavior or request Coordinator clarification. No mode
definition or science threshold was changed. Completed acquisition does not erase
this partial-data startup defect.

Source audit: all ten library coordinates match their opened primary sources;
[review and breadth limits](evidence/SITE_SOURCE_REVIEW_2026-11-15.md).
V4's existing FAIL and V6 owner qualitative scope were not altered or reclassified.

## Complete runtime terrain reproduction

The 189,158,392-byte NASA 80 m source completed acquisition with SHA-256
`82030dcbdd7c4bb0c7d858e9b4b293b9f2cda5a543ba31ec0f42784bd6beee5a`.
This matches the earlier repository evidence snapshot; it is not presented as an
upstream-published checksum. The documented preparation command succeeded:

```powershell
node scripts/python.mjs scripts/prepare_dems.py --data-dir R:/azelux-data --far --hillshade
```

It produced the 3800x3800 far DEM (36,909,329 bytes), SHA-256
`43e014ebbc6ee794cfd8ed02767c36fb2f8b70b21e00827b9639acfa9d7ca68a`,
matching the earlier derived snapshot, and a 2048 px polar hillshade plus metadata.
The documented remote crop script acquired Athena, intended-site and LCROSS tiles;
the original whole-source 20 m checksum remains explicitly unverified.

The isolated preview was restarted after far preparation with the same explicit
real environment settings. Full-terrain HTTP checks are in `full_terrain_checks`
in the linked evidence JSON, separate from the preserved partial-data observations:

- Health: mock=false, contract 1.1, five kernels, far_160m.tif and all three near
  tiles. Recorded manifest identity at that point:
  `392049a4d518072835eb4176f86589de33fe2511fc712c483b7c1548a63e8880`.
- Athena, fixed 240 h, unchanged thresholds: B=2027-03-01 RED; B=2027-03-14 GREEN,
  +210.1 h both-visible for B. Both scenarios explicitly identify REAL and
  `LDEM_80S_20MPP_ADJ tile im2-athena + far_160m`. This independently repeats the
  API outcome, not the frontend owner's browser journey.
- Two polar sites (Athena and intended target), March 15 2027, 708 h, 10 min:
  HTTP 200 with REAL near+far provenance, observed 464.29 ms end-to-end.
- Athena 60-day terrain sweep, March 1-April 29 2027, 240 h: HTTP 200, 60 days,
  REAL near+far, observed 479.89 ms. Top order: March 14, 15, 13, 16, April 12.
  One-host timing does not certify slow-device/network performance.
- Frontend module shell also returned HTTP 200. No browser behavior is inferred.

The real preview uses `work/takeover-clean-clone`, frontend 5173/backend 8000,
started through `npm run dev:all`; logs are in ignored `work/takeover-real-server.log`.
Confirm live process identity before stopping it. Runtime data is external at
`R:/azelux-data`. A later data-manifest change is normal as PGDA references arrive;
the recorded response identities remain historical evidence of those exact calls.

Acquisition finished with `ALL KERNELS OK` and `ALL DEM/MAP FILES OK`. The optional
`download_dems.py --inspect` recorded 7600x7600 float32 DEM metadata and both
5058x5058 int16 PGDA reference maps. All 16 completed entries' hashes were checked
against actual local file bytes. Review snapshot:
[TAKEOVER_DATA_MANIFEST_2026-11-15.json](evidence/TAKEOVER_DATA_MANIFEST_2026-11-15.json).
The review snapshot encodes non-finite raster nodata as a string for strict JSON
and records the raw runtime manifest hash separately; the runtime file is unchanged.
The final actual health manifest identity after inspection was
`ee45596102b1783824c8806a6c22045104bf193fa3e2845387e118e366abc0cb`, independently
equal to SHA-256 of the external manifest bytes. This is source provenance, not a
new V4 result or scientific acceptance.

Final backend suite after completed data acquisition: **551 passed, 6 skipped**,
25.12 s. Same command as above with `--basetemp=work/takeover-pytest-complete-20261115`
and `-o cache_dir=work/takeover-pytest-complete-cache`. All six skips state that
cached skylines for test sites are absent; no missing-data skip is counted as a pass.
No test was rerun merely to manufacture the previous host's count.

## Concurrent owner publication and final baseline

The final fetch discovered frontend `6310e183bd0dfae672eca4e1fc6128594e248d4a`,
already merged by the owner as P1 `37211307b248da9b7c3e679a263afe0bbeb6d4b7`.
Backend remains `7d6ac55`. Source run
[43701473118](https://github.com/Moksh1112/Lunar_Landing_Site_Date_Comparator/actions/runs/43701473118)
and integration run
[43702841533](https://github.com/Moksh1112/Lunar_Landing_Site_Date_Comparator/actions/runs/43702841533)
both passed all seven jobs; their job lists were read through the connector before
fast-forwarding. `git merge --ff-only origin/feat/p1-s0-integration` updated the main
and isolated checkouts with local P1 edits preserved. No new merge commit or owner
source edit was made by this takeover.

Reviewed change: 11 frontend source files, nav/buttons/copy/style and vendored React
Bits components. No backend, contract, thresholds, package file or lockfile changed.
SYNTHETIC and training-safety text remain in source; source review is not rendered
acceptance. The licence note is present but a final third-party licence inventory
and fresh navigation/keyboard/mobile/reduced-motion/browser checks remain pending.
Local lint, 142 frontend tests and strict TypeScript/production build passed again
on `3721130`. Main bundle is now ~703 kB; Three module ~753 kB retains the advisory.
The earlier real API/data evidence remains scoped to unchanged backend `7d6ac55`;
it is not reclassified as visual acceptance for the new frontend.

## Boundaries and publication status

No current browser/physical-device/assistive-speech/alternate-browser/slow-device
test or outside-team usability walkthrough is claimed. No fresh export/print browser
acceptance is inferred from API checks. No main merge, tag, deploy or submission.

The concrete P1 diff requires human review before commit under AGENTS.md and
Playbook 4.3/5.2. The published checkpoint is now `3721130`; no CI is
claimed for the new diff. Preserve untracked local config and all owner branches.
