# Release preparation draft - 15 November 2026

This is review material, not authorization to deploy, merge main, tag, submit or
accept the MVP. Moksh retains those decisions. Current blockers and owners are
maintained only in the top of [PROGRESS.md](PROGRESS.md); feature evidence is in
[MVP_VERIFICATION.md](MVP_VERIFICATION.md).

## Architecture and reproducibility

Browser (React/Vite) -> FastAPI -> local SPICE ephemeris and terrain skyline ->
visibility windows -> metrics, A-minus-B deltas and threshold verdicts. Best Date
ranks candidate days and refines the top five. Shared mission-relative playback
drives panorama/timeline/optional 3D. CSV/JSON and report retain source provenance.
Horizons is offline validation only. No runtime AI/ML, database, auth or uploads.

Dependency authority: backend pyproject/uv.lock and frontend package-lock.
Runtime kernels, rasters and acquired imagery are external to Git. Follow
[NON_RELEASE_HANDOFF.md](NON_RELEASE_HANDOFF.md), then inspect health resource
lists and every result's REAL/SYNTHETIC, horizon mode, DEM and manifest identity.
An `ok` health response alone does not establish that all datasets are present.
NASA SVS imagery is visual context only; it never supplies visibility calculations.

The current published baseline is P1 `3721130`, containing backend `7d6ac55`
and frontend `6310e18`; no release candidate is declared. Both source and integration
CI passed seven jobs; the new UI still needs fresh browser acceptance. The prepared takeover
diff awaits human review and has no new hosted CI. Refresh source SHAs and record
the final integration run before nominating a release candidate.

## Local rehearsal and eventual deployed acceptance

Use the unchanged PRD 13.3 journey, first locally with full datasets, then twice
on the deployed URL only after deployment authorization:

1. Open `/` and verify real health/network/provenance. Warm the backend.
2. Compare the two curated IM-2 polar points on the same date for 708 h. Check
   both near+far terrain sources, verdicts, signed deltas and source labels.
3. Scrub to a sunset; inspect windows, countdowns, censored edges and date alignment.
4. Select same site / shifted date, move B two weeks and compare again.
5. Open Best Date for a 60-day range; load a best day as B and recompute.
6. Toggle Simple/Expert, open optional 3D and fallback, visit Methods, download
   CSV/JSON and print the report. Inspect the actual new files and provenance.

Record exact URL, commit, UTC time, request IDs, input dates/duration, source modes,
manifest identity, device/browser and result for each run. Local HTTP checks and
owner-reported browser runs do not count as two deployed rehearsals.

Optional simulator demonstration: `/landing`, fixed 240 h qualification, Athena,
A=2027-03-01; search B rather than changing thresholds. Owner-reported B=2027-03-14
is GREEN with +210.1 h both-visible time under full terrain. Independently repeat
with complete near+far data before using that exact figure in release media.
The training result is not landing-safety qualification.

## Known limitations to retain in release material

- V4 remains FAIL, approximately 6.2989 percentage points against <=5. Reference
  disc semantics, averaging epoch and DEM differ; no tolerance or point is changed.
  V6 is a P2-owner qualitative spot check, not independent certification.
- Partial-data startup can report `terrain` with only a near tile; owner resolution
  is pending. Verify far terrain presence rather than relying on the mode alone.
- Current ten-entry library includes an intended target and LCROSS impact reference;
  it is not ten actual landings. International/commercial breadth remains partial.
- Visibility uses body centres. Earth visible does not guarantee a communications
  link; sunlight does not predict watts. Terrain resolution/coverage limit detail.
- Physical devices, other browsers, spoken screen-reader use, slow-device 3D and
  two independent usability walkthroughs remain unverified. Bundle-size warnings
  remain; a local 3D measurement does not establish all-device performance.
- No final deployment, MVP/RC/final gate, release tag or submission is claimed.

## Submission fields prepared for human completion

These requirements are transcribed from the supplied PRD 13 and Playbook 9.2.
The event portal's current requirements, deadline and team eligibility have not
been independently revalidated; confirm them before submission.

| Field / deliverable | Draft or required completion |
| --- | --- |
| Project name | Azelux |
| High-level summary | Compare two lunar site/date plans using NASA SPICE and LOLA terrain, with aligned visibility windows and traceable source evidence. |
| Detailed description | Browser comparison of Sun/Earth visibility, terrain horizons, windows, A-minus-B metrics and threshold verdicts; Best Date explores landing dates. Include the validation outcomes and known limits above without a safety or radio-link claim. |
| NASA resources | JPL NAIF SPICE/DE440; Horizons for offline cross-checks; LOLA/PGDA 90 terrain; PGDA 69 validation maps; NASA NSSDCA/LROC/NTRS site sources; NASA SVS visualization context. Do not claim Artemis region coordinates were verified. |
| Other resources / licences | Verify the final dependency/image/font licence inventory and credits on the frozen revision; list only resources actually used. |
| AI-use disclosure | Codex assisted this takeover's repository inspection, tooling and documentation. The team must add the actual tools and uses for earlier implementation/document drafting; this draft is not a complete historical disclosure. Preserve any required media watermarks. |
| Event-period originality | Each teammate confirms what was built during the event, reused components and their rights; do not infer from Git author names alone. |
| Final project links | Authorized public deployment URL and repository; test without login/incognito and on a physical phone. No URL is invented here. |
| Demo media | <=30 s video with English subtitles; <=7-slide alternative/backup deck, backup recording and seven-slide PDF. Record the frozen, warmed, authorized deployment. Media is not yet produced. |
| Team / portal verification | Confirm all members at the same Local Event, current terms and deadline; user authorizes Submit for Judging and records the real confirmation. |

Storyboard draft: 0-4 s polar panorama; 4-12 s compare two plans; 12-20 s signed
metrics and aligned timeline; 20-26 s Best Date; 26-30 s Methods with truthful V4
FAIL and V6 owner-review scope. Avoid presenting diagnostic or illustrative numbers
as certified outcomes. Judge answers should cover methods, source modes, disc
semantics, limitations, provenance and original versus reused work.

## Review and publication sequence

Human reviews the concrete P1 diff before commit (AGENTS.md; Playbook 4.3/5.2).
Use the existing human Git identity, no AI trailers/footers, no protection changes,
no branch deletion or force-push. Publish only the reviewed P1 milestone to
`feat/p1-s0-integration`, then inspect the exact hosted SHA and all seven jobs.
Moksh separately decides deployment, main merge, tags, submission and final acceptance.
