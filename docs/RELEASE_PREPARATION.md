# Release preparation draft - 15 November 2026

This is review material, not authorization to deploy, merge main, tag, submit or
accept the MVP. Moksh retains those decisions. Current blockers and owners are
maintained only in the top of [PROGRESS.md](PROGRESS.md); feature evidence is in
[MVP_VERIFICATION.md](MVP_VERIFICATION.md).

## Current deployment readiness

Use the deployment-readiness checkpoint at the top of [PROGRESS.md](PROGRESS.md). Local Lighthouse passes at source 01f99c2. Human/device evidence, final real-data smoke on the nominated build, host/data/CORS configuration and redistribution-notice review remain before authorization. Deployed rehearsals and deployed performance checks follow authorization. Project licence is deferred; ten-site library retained.

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

The current candidate code is the `feat/p1-s0-integration` SHA recorded at the top of
[PROGRESS.md](PROGRESS.md), with its hosted CI link. No release candidate has been nominated;
that is Moksh's decision.

Product additions since the original MVP, explicitly authorized:

- the gap-first comparison;
- deterministic "Explain this interval" text from canonical windows;
- a downloadable standalone HTML briefing (schema `azelux.briefing` v1). It replays a computed
  snapshot; it cannot compute new sites or dates offline.

## Local rehearsal and eventual deployed acceptance

Use the unchanged PRD 13.3 journey, first locally with full datasets, then twice
on the deployed URL only after deployment authorization:

1. Open `/` (Home), then `/compare`; verify real health/network/provenance. Warm the backend.
2. Compare the two curated IM-2 polar points on the same date for 708 h. Check
   both near+far terrain sources, verdicts, signed deltas and source labels.
3. Scrub to a sunset; inspect windows, countdowns, censored edges and date alignment.
4. Select same site / shifted date, move B two weeks and compare again.
5. Open Best Date for a 60-day range; load a best day as B and recompute.
6. Toggle Simple/Expert, open optional 3D and fallback, visit Methods, download
   CSV/JSON and print the report. Inspect the actual new files and provenance.
7. Inspect the Visibility gap (Inspect A/B gap, Explain this interval, an event jump),
   download the offline briefing, open the file with the network off and scrub it.

Record exact URL, commit, UTC time, request IDs, input dates/duration, source modes,
manifest identity, device/browser and result for each run. Local HTTP checks and
owner-reported browser runs do not count as two deployed rehearsals.

Optional simulator demonstration: `/learn/simulator`, fixed 240 h qualification, Athena,
A=2027-03-01; search B rather than changing thresholds. Owner-reported B=2027-03-14
is GREEN with +210.1 h both-visible time under full terrain. Independently repeat
with complete near+far data before using that exact figure in release media.
The training result is not landing-safety qualification.

## Known limitations to retain in release material

- **PGDA validation:** V4 (the body-centre rule) is a recorded FAIL, 6.299 pp against ≤ 5.
  - V4b, the reference's any-visible-fraction disc rule sampled hourly, passes 10/10. Moksh
    adopted it as the acceptance basis on 15 Nov 2026.
  - V4b validates a different definition from the runtime's, so it does not show that
    centre-based results match PGDA within 5 pp.
  - The reference DEM, epoch, observer height and ephemeris are not fully comparable (see
    `backend/docs/V4_DECISION_2026-11-15.md`).
- **V6** is an owner-reviewed qualitative spot check, not independent certification.
- **What visibility means:** it uses body centres. Earth in view does not guarantee a radio
  link, and sunlight does not predict watts. Terrain resolution and coverage limit the detail.
- **Missing far terrain:** when the far DEM is absent, points inside the 20 m tiles return an
  honest TerrainUnavailable error (`fd38ce5`); they are not labelled `terrain`.
- **Library:** ten sourced entries, including an intended target and the LCROSS impact
  reference. That is not ten actual landings, and international and commercial breadth is
  partial (F1 decision pending).
- **Offline briefing:** it replays one snapshot only. Event times carry the sample step's
  interpolation precision. Its source links need internet; viewing it does not.
- **Windows setup:** managed Windows may block the default venv launcher (Application
  Control). Use the documented `AZX_PYTHON_MODE=target` setup.
- **Bundle size:** Vite warns about large chunks (main and the lazy 3D chunks).
- **Unverified so far:** performance on physical and slow devices. Emulated Lighthouse mobile scores 91 / 93 / 94 (`PERFORMANCE_HOME_2026-11-15.md`).
- **Pending human checks:** physical devices, a second browser, spoken screen-reader use,
  slow-device 3D and two independent usability walkthroughs (`USABILITY_TASKS.md`).
- **Not done:** no deployment, MVP/RC/final gate, release tag or submission.

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
| Other resources / licences | See the licence and attribution checklist below; list only resources actually used. |
| AI-use disclosure | Required by Space Apps and answered **on the form only**. The repository never credits an AI (Playbook 7.3, PRD 13.1). An honest draft for Moksh to complete is kept outside the repository. The team must add every tool and use for the whole project, including earlier implementation and document drafting. |
| Event-period originality | Each teammate confirms what was built during the event, reused components and their rights; do not infer from Git author names alone. |
| Final project links | Authorized public deployment URL and repository; test without login/incognito and on a physical phone. No URL is invented here. |
| Demo media | <=30 s video with English subtitles; <=7-slide alternative/backup deck, backup recording and seven-slide PDF. Record the frozen, warmed, authorized deployment. Media is not yet produced. |
| Team / portal verification | Confirm all members at the same Local Event, current terms and deadline; user authorizes Submit for Judging and records the real confirmation. |

**Video storyboard (≤ 30 s, PRD 13.2; record on the frozen, warmed, authorized
deployment with real data):**

| Seconds | Shot |
| --- | --- |
| 0–4 | Home: the 3D Moon. "Compare lunar landing sites and dates." |
| 4–12 | Compare: Athena, Plan A 2027-03-01 against Plan B 2027-03-14 (date shift, 240 h). A RED, B GREEN; "Plan B gets 210.1 h more…". |
| 12–20 | Visibility gap: Inspect A gap; the explanation; an event jump moves the timeline and panorama. |
| 20–26 | Best Date: Load as Plan B. Then the offline briefing opened from the file. |
| 26–30 | Methods: V1/V2 pass against JPL Horizons; V4 FAIL shown, with V4b (any-fraction) adopted. |

Each figure must come from that recorded run. Keep a backup recording and the
≤ 7-slide deck. Judge answers should cover:

- methods and source modes;
- the disc-rule difference and V4b's scope;
- limitations and provenance;
- original versus reused work.

**Screenshot list** (capture on the release build; screenshots are not committed): Home;
Compare with the REAL result; Visibility gap and explanation; Best Date; Report print preview;
the offline briefing; Methods validation; the simulator debrief; a 375 px phone view.

## Licence and attribution checklist

| Item | Licence / credit | Status |
| --- | --- | --- |
| Schibsted Grotesk font | SIL OFL 1.1 (`frontend/src/theme/fonts/README.md`, OFL text bundled) | Recorded |
| Moon texture | NASA SVS CGI Moon Kit (SVS 4720), public domain; credited in Home, tour and simulator | Recorded |
| React Bits (Magnet, ClickSpark) | Removed in `101e801`: its Commons Clause forbids redistributing the components. Replaced by original MagneticHover and ClickBurst | Done |
| SPICE kernels, LOLA/PGDA DEMs and maps, Horizons | NASA/JPL/GSFC public data; cited in Methods and the data manifest; not in Git | Recorded |
| Polar and global map assets | NASA LOLA/PGDA 90 hillshade and SVS 4720 context; the citation is visible and linked on the map when imagery loads (checked 15 Nov) | Done |
| npm and Python dependencies | `THIRD_PARTY_NOTICES.txt` is generated from the 24 bundled frontend packages with their licence texts (`scripts/third_party_notices.mjs`). The full inventory is in `evidence/DEPENDENCY_LICENSES_2026-11-15.json`. Python packages run server-side and are not shipped to browsers | Done; regenerate when dependencies change |
| GSAP 3.12.5 | GreenSock notice kept in the bundle (legal comments) and vendored in the notices. The Standard licence permits web-application use; the pre-2025 terms for 3.12.5 were not retrieved | Kept; optional upgrade to ≥ 3.13 for the current terms (Moksh) |
| Project licence | Deferred by Moksh; no LICENSE added | Not a current engineering blocker; third-party terms remain |

## Review and publication sequence

Human reviews the concrete P1 diff before commit (AGENTS.md; Playbook 4.3/5.2).
Use the existing human Git identity, no AI trailers/footers, no protection changes,
no branch deletion or force-push. Publish only the reviewed P1 milestone to
`feat/p1-s0-integration`, then inspect the exact hosted SHA and all seven jobs.
Moksh separately decides deployment, main merge, tags, submission and final acceptance.

## Release candidate checklist (15 Nov 2026)

Do these in order. Items marked **Moksh** need the user's explicit decision or action.

1. **Integration CI:** confirm hosted CI is green on the final integration SHA (`PROGRESS.md`).
2. **Clean clone:** `git clone --branch feat/p1-s0-integration …`.
   - On managed Windows, set `AZX_PYTHON_MODE=target`, then run `npm run setup`.
   - Set an absolute non-cloud `AZX_DATA_DIR` (data from `NON_RELEASE_HANDOFF.md`).
   - Check `/health`: `mock:false`, 5 kernels, `far_160m.tif` + tiles, and the manifest hash.
3. **Demo script** (about 5 minutes, REAL backend):
   1. Open `/`. Point out the explanation and the three options.
   2. Choose **Compare landing plans**, then select **Date shift** and set IM-2 Athena for
      Plan A (2027-03-01) and Plan B (2027-03-14), 240 h.
   3. Compare. Expected: A RED, B GREEN, "Plan B gets 210.1 h more…".
   4. Scrub the timeline and point out the provenance (terrain, DEM, REAL).
   5. Open Best Date at Athena for March 2027, choose **Load as Plan B**, then compare.
   6. Open Report, then Print preview (white paper). Show the Export CSV and JSON.
   7. Visibility gap: Inspect A gap, read the explanation, jump to an event; then
      download the offline briefing and open it.
   8. Methods: V1/V2/V3/V5 pass, V6 is a qualitative owner review, **V4 is FAIL** and **V4b
      (adopted) passes**. Explain the difference.
   9. Optional: open Learn → Simulator and pass the 240 h challenge.
4. **Evidence list:**
   - `MVP_VERIFICATION.md` (integrated acceptance), `TAKEOVER_VERIFICATION_2026-11-15.md`
   - `frontend/docs/HANDOFF_MONOCHROME.md`, `frontend/docs/HANDOFF_SIMULATOR.md`
   - `backend/docs/V4_DECISION_2026-11-15.md`, `validation/results/*`
   - Screenshots are kept locally (`C:/azx/accept/*`, `C:/azx/shots-nav*`). Regenerate them on
     the release machine; images are not committed.
5. **Go / no-go:**
   - **Go** needs all of these:
     - green integration CI;
     - clean-clone real `/health` and the demo result reproduced;
     - V4 decision recorded (done: V4b adopted, V4 FAIL disclosed);
     - every row in `USABILITY_TASKS.md` marked passed, or explicitly waived by **Moksh**
       (a physical print is optional).
   - **No-go** if any of these happen:
     - a REAL/SYNTHETIC label or horizon mode does not match the data actually used;
     - V4 is presented as passing, or V4b as validating the runtime's centre rule;
     - anything claims safety certification, wattage or a guaranteed radio link.
6. **Moksh only:** nominate the release candidate SHA, authorize the deployment, run the
   deployed rehearsal twice, then merge to main, tag, submit and accept the MVP.
