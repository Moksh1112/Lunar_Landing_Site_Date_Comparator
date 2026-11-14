# Security audit and break-it pass - P2 S4 (2026-11-14)

Scope: `backend/` on branch `feat/p2-p3-backend-terrain`, checked against TRD 10.1. Method: dependency audit,
source greps, 340 break-it tests (`tests/test_break_it.py`, mock plus real data), and manual probing of every
endpoint. Real data was in `C:/azelux-data`.

## Verdict per TRD 10.1 item

| Item | Verdict | Evidence / notes |
|---|---|---|
| Secrets | Pass | No keys, tokens or passwords in `app/`, `tests/`, `scripts/`, `Dockerfile`. `.env`/`.env.*` and `data/` are git-ignored (`!.env.example`, names only). The app reads no secret at all. Logs hold request metadata only. |
| Input validation | Pass after fixes | Pydantic models forbid unknown fields; every number/date/id is range checked. Found and fixed 500s (below). NaN/Infinity JSON literals give 400, or 413 for `+Infinity` mission (it is "longer than 8760 h"). |
| Abuse | Partial | 64 KB body cap, 60,000 samples/scenario, 183-day sweep, per-IP rate limits (in-memory, per process). Gap: no request time limit; see A1. |
| CORS | Pass | Exact origins from `AZX_CORS_ORIGINS`; `*` is rejected at startup. Tests: evil origin, `localhost:5173.evil.example`, `null` and a wrong port get no `Access-Control-Allow-Origin`; error responses for an allowed origin carry it. A disallowed preflight returns 400 plain text from Starlette (not the contract shape; harmless). |
| Headers | Host's job (note) | The API sets only CORS and `X-Request-ID`. Not set by the app: `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Content-Security-Policy`, `Referrer-Policy`. Responses are `application/json` only, so risk is low; HSTS and TLS belong to the host/CDN (Render/Railway/Fly terminate TLS). The frontend host owns CSP. |
| Errors | Pass | One handler maps every failure to the contract shape. Tests assert no `Traceback`, file path, `SPICE`, `Toolkit`, `.py` or line numbers in any error body, including a forced unhandled exception. Stack traces go to server logs only. |
| Output | Pass | Responses are JSON (orjson); NaN/Infinity become `null`, never bare tokens. User text (labels, names) is echoed as JSON strings only. `X-Request-ID` from the client was echoed unvalidated (any length); fixed (below). |
| Dependencies | Pass | See D1. |
| Repo | Pass | No secrets or private data tracked; `git ls-files` shows no `.env`, key or pem files. Docker image runs as a non-root user with a HEALTHCHECK. |

## D1 - dependency audit

```
uv export --project backend --locked --no-dev --no-emit-project --format requirements.txt -o C:/azelux-work/req-audit.txt
uvx --python-preference only-system pip-audit -r C:/azelux-work/req-audit.txt --disable-pip
-> No known vulnerabilities found
```

357 lines, hash-pinned, runtime dependencies only. (`uvx pip-audit` with uv's managed Python failed with
"SSL module is not available"; the system Python 3.12 has SSL, hence `--python-preference only-system`.)
No lockfile change is needed.

## Source greps

- `print(`, `eval(`, `exec(`, `pickle`, `subprocess`, `os.system`, `shell=True`, `yaml.load`: none in `app/`.
  `np.load(..., allow_pickle=False)` in the skyline cache is correct.
- No `dangerously` patterns.
- Exceptions reach a client only as the generic contract text. `exc` is logged server-side
  (`terrain provider unavailable`, `kernel loading failed`, `warm-up failed`, unhandled traces). The JSON log
  formatter includes the traceback and paths in the log line, which is acceptable for stderr/host logs; do not
  expose logs publicly.
- Skyline cache files are read from `AZX_DATA_DIR/cache` only; coordinates are floats from validated input, so a
  request cannot choose a path.

## Bugs found and fixed (in `app/api/routes_api.py` and `app/main.py`)

| # | Repro | Before | Fix |
|---|---|---|---|
| B1 | compare/sweep with year 1800, 2200 or 9999 | 500; SPICE `SPKINSUFFDATA` in the log | `_check_start_utc` / `_check_sweep_span`: 400 `INVALID_INPUT`, field `scenarios[i].start_utc` or `range_start`/`range_end`. Span 1970-01-01 .. 2149-12-31 inclusive, whole mission must fit. |
| B2 | year `0001-01-01` (sweep or compare) | **200 with wrong data**: SPICE reads year 0001 as 2001 while the time grid uses year 1 | Same span check. |
| B3 | `start_utc` `20270301T000000Z` (basic ISO) | 500 (`SPICE(UNPARSEDTIME)`); the model accepts it | Strict regex `YYYY-MM-DDTHH:MM:SS[.f{1,9}]Z` in the route. |
| B4 | `site: {"site_id": ""}` in compare or sweep | 500 (`None > float` in terrain) | `site_id` must match `[A-Za-z0-9._-]{1,64}` or 400. Also stops 3,000-character ids being echoed back in the 404 text. |
| B5 | `X-Request-ID` of 10,000 characters or odd bytes | echoed in the response and written to logs | Only `[A-Za-z0-9._:-]{1,64}` is kept; otherwise a UUID is generated. |
| B6 | compare with any start before 1970 on Windows | 500 `OSError` from `datetime.fromtimestamp(negative)` in `app/metrics/windows.py::_iso` (not my file) | Worked around by the 1970 lower bound (constant `EPHEMERIS_FIRST_DAY`). **Proposed real fix** in `app/metrics/windows.py`: `return (datetime(1970, 1, 1, tzinfo=UTC) + timedelta(seconds=round(t_unix))).strftime(...)` (same for any other `fromtimestamp` on a possibly negative value), then set `EPHEMERIS_FIRST_DAY = date(1900, 1, 1)`. Apollo-era dates (1969) are the only user-visible loss. |

The B1-B4 checks run before the mock/real switch, so mock mode behaves identically.

## Findings reported, not changed

- **A1 (medium, abuse):** one valid request, `step_minutes=1`, two 999 h scenarios (59,941 samples each) took
  **30.6 s** and returned 5.4 MB, with the SPICE lock held the whole time, so every other compare/sweep waits.
  The 30/min per-IP rate limit does not help against a single heavy request. Options: lower the sample cap
  (contract proposal C04 sets 60,000; 20,000 would be about 10 s), add a per-request time budget, or vectorise
  `az_el_series` (`app/ephemeris/spice.py` calls `spkcpo` once per sample, about 1.3 s per 4,250 samples under
  load; `spkpos` accepts arrays in spiceypy 6). Owner of `app/ephemeris` and the contract.
- **A2 (low):** `site` may carry both `site_id` and `lat_deg`/`lon_east_deg`; `site_id` wins silently. Propose a
  `Site` validator in `models.py`: reject when `site_id` is set together with coordinates.
  `Site` also accepts `site_id: ""` at model level; B4 covers it at the route, a model rule
  (`min_length=1, pattern=...`) would be cleaner.
- **A3 (low):** lax coercion in the models: `"step_minutes": "10"` and `true` are accepted (`true` becomes 1),
  `mission_hours: "24"` is accepted, `lat_deg=1_0` in a query string is read as 10. Harmless (valid values
  result), but `ConfigDict(extra="forbid", strict=True)` on request models would be stricter. Not changed: the
  frontend may rely on query strings being parsed leniently.
- **A4 (info):** repeated query keys (`lat_deg=1&lat_deg=2`) use the last value, duplicate JSON keys use the last
  key; no crash, no ambiguity beyond that. `/docs` and `/openapi.json` are public; fine for an open API, disable
  with `FastAPI(docs_url=None, openapi_url=None)` if wanted.
- **A5 (info):** the rate limiter is in-memory per process and keyed by IP. Behind a proxy it needs
  `AZX_TRUST_FORWARDED_FOR=true`, otherwise all users share one bucket; with several workers each has its own.
- **A6 (info):** `/health` lists loaded kernel and DEM file names (contract requirement); no paths.

## Cold start (first real compare, two curated pole sites, one lunar day = 708 h)

Machine was busy (another process was writing DEM tiles), so absolute numbers are about 1.5-2x the idle
figures in the S2/S3 report (warm compare 1.1 s idle, about 1.8-2.0 s here). Process-start-to-ready times
(`import app.main` + kernels) were 1.5-2.7 s on top of the figures below.

| Case | First compare | Steady compare |
|---|---|---|
| No warm-up (`AZX_WARM_UP=false`), request right after start | 5.8 s (cpu 5.3 s) | 1.8 s |
| Warm-up (as shipped in S3), request 10 s after start | 2.2 s | 1.8-2.0 s |
| Warm-up (S4: adds a 1 h two-site compare), request 10 s after start | 2.0-2.4 s | 1.8-1.9 s |

Where the one-time cost goes (measured in-process): `import rasterio/pyproj` plus opening the far DEM
1.5 s idle (up to 4.8 s under load); numpy 0.2 s, pydantic 0.15 s, fastapi 1.1 s, spiceypy 0.1 s, kernels 0.3 s,
compare/sweep module import 0.02 s; the first SPICE call, skyline cache read and response-model validation are
about 0.01 s each. So the cost is GDAL/DEM start-up, which the background warm-up already hides; the S4 mini
compare adds only about 10 ms and no measurable gain. Remaining budget risk: a request arriving *during* the 2-5 s
warm-up waits for it (the terrain lock) and then pays the steady 1.1 s compute; on an idle host that is about
3 s worst case, on a busy one more. `/health` is not blocked by warm-up.
