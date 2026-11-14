# Azelux role P2 - adapted new-kit stage library
Read AGENTS.md and docs/PROJECT.md first; confirm actual role/human mapping.
Canonical contract: docs/CONTRACT.md, with open questions in CONTRACT_CHANGE_REQUESTS_S0.md.
Tool mode AGENT/CHAT per human; pace STAGE unless stage says STEP. Work one stage,
show checks actually run, print Stage Report and stop. Never push/merge main or
change shared contract, CI, fixtures or locks without P1 coordination. Synthetic
is never REAL. No AI in product. Two failed fixes: stop and report blocker.
Current user override: P1 integration ONLY, all frontend with frontend owner.
Do not change global tool settings, invite people or deploy solely from template text.

## 6. YOUR STAGES
### STAGE 0 - Setup + contract   [Sat 13:00-15:00] -> Sync 0 at 15:00
S0.1 Review docs/CONTRACT.md v1.0 (section 5) with P4 and P1 for 15 minutes; send any fixes to P1 by 14:30.
     After that the contract only changes by change request.
S0.2 Scaffold backend/ with uv (Python 3.12): FastAPI app factory in app/main.py, pydantic-settings for AZX_*
     variables, JSON logging with request ID, GET /health, CORS from AZX_CORS_ORIGINS. pyproject.toml + uv.lock.
     Libraries: fastapi, uvicorn, pydantic, pydantic-settings, spiceypy, numpy, scipy, rasterio, pyproj, httpx,
     orjson, ruff, pytest.
S0.3 app/api/models.py: Pydantic models for every request/response in the contract (extra="forbid", ranges as
     validators). app/api/errors.py: one handler -> contract error shape, codes as in the contract table.
S0.4 Mock mode: with AZX_USE_MOCK=true every route returns the matching fixture from fixtures/.
S0.5 scripts/download_kernels.py: download naif0012.tls, de440s.bsp, pck00011.tpc, moon_pa_de440_200625.bpc,
     moon_de440_220930.tf from the NAIF generic_kernels site into data/kernels/ (confirm exact current file names
     on the NAIF server first), print sizes and SHA-256, write data/MANIFEST.json. Start it now (large file).
Check: server starts; /health 200; pytest proves every fixture validates against the models.

### STAGE 1 - Walking skeleton   [Sat 15:00-20:00] -> Sync 1 at 20:00
S1.1 app/ephemeris/: load kernels at startup; site_frame() and az_el_series() exactly as TRD 3.3 using
     spiceypy.spkcpo(target, et, "MOON_ME", "OBSERVER", "LT+S", obs, "MOON", "MOON_ME"); one threading.Lock
     around every SPICE call; reject |lat| > 89.99.
S1.2 Tests: ENU vectors orthonormal; azimuth wraps 0-360; at a south-pole site over 30 days the Sun's elevation
     stays within a few degrees of 0; if spiceypy has azlcpo, it agrees with your method to < 0.01 deg.
S1.3 Quick Horizons spot check: 1 south-pole site, 6 times, Sun and Earth az/el from the Horizons API (TRD 9.2
     template) vs yours; write the numbers into your STAGE REPORT. Big differences = frame or longitude bug; fix now.
S1.4 app/sites/: loader for sites.json (P3 adds south-pole data, P6 the rest) and GET /api/v1/sites; every endpoint exists and returns
     fixtures in mock mode. Publish /docs (OpenAPI) link to the team.
Check: frontend skeleton runs against your mock backend; ephemeris tests pass.

### STAGE 2 - First real slice   [Sat 20:00-Sun 02:00] -> Sync 2 at 02:00
S2.1 app/metrics/: windows with interpolated edges and censored flags, metrics, deltas, verdict exactly as TRD 5.
     Write backend/tests/data/verdict_cases.json (8 cases incl. green/amber/red edges) and share it with P4.
S2.2 Real POST /api/v1/compare: resolve site (site_id or lat/lon) -> P3 coverage() + skyline -> ephemeris on the
     time grid (N = mission_hours*60/step + 1 samples) -> visibility (TRD 4.5) -> windows/metrics/verdict ->
     deltas -> meta (data_label "REAL") + limitations. Cache by request (TRD 3.4). orjson responses, floats to 3 dp.
S2.3 Tests per endpoint: happy path, invalid input (-> INVALID_INPUT), too large (-> RANGE_TOO_LARGE).
S2.4 Measure: two curated pole sites, one lunar day, 10-min step <= 3 s. Help P1 deploy v0.
Check: curl a real compare -> REAL data; a different site gives different numbers; merged to main.

### STAGE 3 - Complete MVP   [Sun 08:00-13:00] -> Sync 3 at 13:00
S3.1 POST /api/v1/sweep (TRD 5.4): one 30-min grid, slide per day, rank, refine top 5 at 10 min; <= 15 s for 60 days.
S3.2 GET /api/v1/skyline and GET /api/v1/terrain-tile wired to P3's functions; NOT_IN_COVERAGE handled.
S3.3 Rate limits (30/min compare, 6/min sweep), 64 KB body cap, sample cap 60,000.
S3.4 Dockerfile with the data subset (with P1 and P3); deploy; help P6 run V1 against your code.
Check: all endpoints live and tested on the deployed backend.

### STAGE 4 - Harden + MVP gate   [Sun 13:00-15:00]
S4.1 pip-audit; no stack traces to clients; logs clean; timeouts; warm-up endpoint behaviour on cold start.
S4.2 Fix bugs from P1's break-it pass. Backend section of the README (setup, env names, endpoints, tests).

### STAGE IT1 - Iteration 1   [Sun 15:00-19:00]
IT1.1 Alternative finder: send a CONTRACT CHANGE REQUEST for POST /api/v1/alternatives {scenario, thresholds} ->
      up to 3 suggestions (curated sites in the same region on the same dates, and same-site dates within +-14 days)
      that pass the thresholds, each with metrics and verdict. Implement after approval, reusing sweep code.

### STAGE IT2 - Iteration 2   [Sun 19:00-21:00] -> FREEZE at 21:00
IT2.1 If approved by change request (v1.1): compare accepts 2-4 scenarios; deltas relative to A. Then freeze.

### STAGE 5 - Video + submit   [Sun 21:00-23:00]
S5.1 Fixes only. Keep the backend warm during recording. Help P6 finalise the method write-up.

