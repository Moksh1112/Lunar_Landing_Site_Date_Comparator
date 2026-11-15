# Final-build real smoke — 15 Nov 2026

Performed by the main session (frontend and release owner) with headless Edge over CDP, viewport
emulation only. No physical devices were used. Script: `C:/azx/smoke_final.mjs`, kept outside
Git. Downloaded files and screenshots are kept outside Git (`C:/azx/smoke/`).

## Build and environment

- **Source:** integration `729f228` for the smoke run. The two later code changes were
  re-checked separately (see "Later changes").
- **Backend:** `uvicorn app.main:app` from the same tree on 127.0.0.1:8013, with
  `AZX_USE_MOCK=false`, `AZX_DATA_DIR=C:/azx/data` (absolute, outside the cloud-synced folder)
  and `AZX_CORS_ORIGINS=http://127.0.0.1:5196`.
- **Frontend:** a production `vite build` (`VITE_USE_MOCK=false`,
  `VITE_API_URL=http://127.0.0.1:8013`) served by `vite preview` on 127.0.0.1:5196.
- **`/health`:**
  - `mock:false`, contract 1.1;
  - kernels naif0012.tls, de440s.bsp, pck00011.tpc, moon_pa_de440_200625.bpc,
    moon_de440_250416.tf;
  - DEMs far_160m.tif, im2-athena.tif, im2-intended.tif, validation-0.tif;
  - manifest `1dcb16ff00b027c8e5fbe31ebd468014a7e84f6f64d83ef38c024c8d94b95175`.
- **CORS:** the preflight from `http://127.0.0.1:5196` is allowed; another origin gets 400.
- **Routing:** a direct load of `/methods` returns 200.

## Journey (REAL responses: 200 /health, /api/v1/sites, /api/v1/compare, /api/v1/sweep)

| Step | Input | Result |
| --- | --- | --- |
| Home → Compare | starter plans | Answer shown ("Plan B gets 13.7 h more…") |
| Athena date shift via Edit plans | Date shift preset; Plan A IM-2 Athena 2027-03-01 00:00, 240 h; Plan B 2027-03-14 00:00, 240 h | "Plan B gets 210.1 h more with both Sun and Earth in view than Plan A." Provenance: REAL, terrain, DEM "LDEM_80S_20MPP_ADJ tile im2-athena + far_160m", SPICE DE440, 10 min. The timeline switched to mission time. |
| Gap and explanation | default focus | Inspect A gap pressed. "This gap has 2 parts… only the Sun below 228.7 h; both below 11.3 h." |
| Event jump | 2nd event | Scrubber moved to 2027-03-01 11:18 UTC (mission day 1, +11.3 h) |
| Best Date | Athena, 2027-03-01..14, 240 h | "14 days … 2 green, 0 amber, 12 red. Best day: 2027-03-14." |
| Load as Plan B → Compare | — | `/compare`, "Best date 2027-03-14"; recomputed answer +210.1 h |
| Report | from the results link | Print emulation gives a white page, 8 SVG charts, REAL and the Visibility gap section |
| Methods | — | V4 fail, V4b pass, decision note and "does not show that Azelux…" limit; 0 invalid evidence files |
| Tour | `/learn/tour` | Hero renders; Open comparator → `/compare`, Back to home → `/` |
| Simulator | practice → qualification (240 h) | Debrief: A 2027-03-01 red, B 2027-03-14 green (terrain, REAL, DEM tile im2-athena + far_160m); "Challenge passed". Handoff → `/compare` with "Plan B gets 210.1 h more…" |

## Downloads (from the Athena comparison)

- **CSV** (214 KB, 4,352 lines): data label REAL, horizon terrain, the Athena DEM, the manifest
  hash and the longest-gap lines.
- **JSON** (443 KB):
  - keys `provenance`, `result`, `visibility_gaps`;
  - both plans REAL/terrain/"tile im2-athena + far_160m";
  - A − B both = −210.1 h; starts 2027-03-01 and 2027-03-14.
- **Offline briefing** (168 KB, SHA-256
  `99e98d3d53658d4527ffb1625e885e8b7a98369c3db568a9c153d0bf658d9202`):
  - REAL label, the V4/V4b wording and a `default-src 'none'` CSP.
  - Opened as a file with the network emulated offline, then reloaded: the replay renders,
    the arrow keys move the scrubber (+120.0 h → +120.2 h), and the jumps work.
  - **0 non-file requests.**

## Later changes (after `729f228`), checked separately

- **`47642ae`, same-origin basemap fix and notices link.**
  - A production build with `VITE_API_URL=` behind a local proxy emulating the documented nginx
    routing (127.0.0.1:5197 → backend :8013) works end to end: `/health`, `/api/v1/sites`,
    `/api/v1/compare`, `/assets/lunar/south-pole-hillshade.json` and `.png` all come from the
    same origin, and the polar hillshade loads with its citation.
  - Deep link `/report` and `/THIRD_PARTY_NOTICES.txt` return 200.
  - No `127.0.0.1:8000` remains in the bundle. Tests: 181 passed.
- **Lighthouse with a reachable API** (same-origin build, mobile, one run): Performance 95,
  Accessibility 100, CLS 0 (one 0.0001 shift). The earlier 0.063 CLS was the "API unreachable"
  notice in a setup without CORS.

## Notes

- Two script issues were found and corrected during the run; they were not product defects:
  - B's mission length must be set explicitly in date-shift mode.
  - Icon-only Date ± buttons are matched by `aria-label`.
- **Map citation:** with imagery loaded, the polar view shows "NASA LOLA hillshade… PGDA product
  90" (linked) and the whole-Moon view "NASA whole-Moon context… SVS 4720" (linked).
