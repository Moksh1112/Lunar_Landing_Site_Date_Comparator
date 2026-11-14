# Azelux role P6 - adapted new-kit stage library
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
S3.0 Setup: read docs/START_HERE.md; clone; own git identity; `make hooks`; `make dev`; download kernels with
     P2's script. Check: you can import the backend ephemeris functions in Python.
S3.1 validation/v1_horizons.py and v2_frames.py (TRD 9.2): 3 sites (south pole, near side, far side) x 48 hourly
     times, Sun and Earth, Horizons API (format=json, CENTER='coord@301', COORD_TYPE='GEODETIC',
     SITE_COORD='lon_e,lat,alt_km', QUANTITIES='4', APPARENT='AIRLESS', ANGLE_FORMAT='DEG'; confirm parameter
     spelling in the Horizons manual) vs our SPICE values. Save results/v1_horizons.json and v2_frames.json with
     parameters, run time, versions. Pass target: max difference <= 0.05 deg (report the real number either way).
S3.2 v4_pgda.py with P3: 5 south-pole points, our Sun and Earth visibility % over 18.6 years at daily steps vs
     PGDA product 69 average visibility maps; note PGDA counts Earth visible if any part of the disk shows (so it
     can read higher than our centre rule). v6_sanity.py: Sun and Earth stay within a few degrees of the horizon at
     a pole site over a month. Save results JSON.
S3.3 docs/METHODS.md + the /methods page (frontend/src/features/methods/): data products and versions, method
     in plain words, V1-V6 tables rendered from validation/results/*.json, limits (PRD 7.6).
S3.4 Non-polar curated sites in backend/app/sites/sites.json: Apollo 11-17, CLPS landers, other countries'
     landers (e.g. Chandrayaan-3, Chang'e, SLIM), each with an official source URL; verified=true only if the
     coordinate comes from that source. Never invent coordinates.
S3.5 /report page (frontend/src/features/report/) with a print stylesheet (browser print -> PDF): verdicts,
     deltas, panorama, timeline, metrics, provenance (meta + MANIFEST). CSV and JSON export buttons built in the
     browser from the compare response, each with a provenance header.
Check: methods page shows real V1-V6 numbers; report prints cleanly; exports open with provenance.

### STAGE 4 - Harden + MVP gate   [Sun 13:00-15:00]
S4.1 Draft the submission form's "Detailed description" and "NASA data" fields for P1 using only real numbers.
S4.2 Check every claim in the UI and docs against the results; remove anything not backed by a check.

### STAGE IT1 - Iteration 1   [Sun 15:00-19:00]
IT1.1 Plain-English "why" explainer (frontend function + tests): from a compare response, write 1-3 sentences per
      scenario, e.g. "Earth sets behind terrain at azimuth 15 deg (skyline 2.8 deg, 12 km away) on 12 Mar 04:20 UTC
      while Earth is at 1.9 deg." Use skyline elev/block_dist at the body's azimuth at each set event. Never claim
      more than the data shows.
IT1.2 Education mode content for P4: 5-7 short steps with real numbers from a demo scenario.

### STAGE IT2 - Iteration 2   [Sun 19:00-21:00] -> FREEZE at 21:00
IT2.1 Polish methods page; re-run V1 on the release candidate if code changed.

### STAGE 5 - Video + submit   [Sun 21:00-23:00]
S5.1 Fixes only. Final check of data credits (NAIF/JPL, NASA GSFC PGDA, LOLA) in README and the form.
