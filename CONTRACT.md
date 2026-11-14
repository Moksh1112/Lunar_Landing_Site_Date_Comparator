# API Contract v1.0
Status: owner decision issued by Codex acting for Person 2 at user request,
14 November 2026. Team acknowledgment pending; this is not a claim of teammate approval.
Person 1 records shared files. Person 2 owns future changes. No API implementation
or astronomical correctness is established by this document.

## Request
POST /api/v1/compare, application/json, exactly `{ "scenarios": [A, B] }`.
Each scenario has exactly id, label, latitude_deg, longitude_east_deg, start_utc,
duration_hours, step_minutes. Canonical machine schemas: docs/contracts/.
Unknown fields rejected at every object level; JSON numbers must be finite.
IDs: distinct, 1-40 ASCII letters/digits/underscore/hyphen. Labels: 1-80 characters,
not whitespace-only; labels may repeat. Latitude [-90,90], longitude east-positive
[0,360]; normalize 360 to 0 at provider boundary but echo original input.
South-pole examples are focus, not an additional latitude rejection rule.
Start: valid calendar UTC `YYYY-MM-DDTHH:mm:ssZ`, whole seconds, years 2000-2100;
end must also be before 2101-01-01. Reject offsets, fractional seconds and leap seconds
in v1 rather than silently coercing. Duration integer hours [1,720]; step integer
minutes [1,60]. At most 1441 samples per scenario. Body cap 16 KiB (16384 bytes).
Sample at start + n*step before end, and always include end; last interval may be
shorter. Sample count = ceil(duration_hours*60/step_minutes)+1.

## Success (HTTP 200)
Exact fields, types and enums: response.schema.json. See fixtures/compare.ok.json.
Response contract_version is "1.0"; preserve request scenario order and echo inputs.
Each result: scenario, source, mode, provenance, samples, summary.
Source is synthetic_fixture, jpl_horizons_live or jpl_horizons_cached. UI must show
SYNTHETIC for fixtures, live/cached attribution for real data. No silent fallback.
Provenance records acquisition UTC (original acquisition for cached), two sanitized
upstream URLs and two raw body SHA-256 hashes in Sun/Earth order for real source;
fixtures use empty arrays. Never include credentials in URLs. Processing version
identifies implementation revision. Terrain product is null for geometric-only,
otherwise verified product/file/version identifier; no unverifiable terrain mode.
Scenario echo provides observer location, sample interval and UTC convention.

## Geometry and summaries
Azimuth is degrees clockwise from local north [0,360); elevation is target-center
angle above geometric local horizontal [-90,90]. Horizon is skyline elevation at
that target azimuth in the same frame. geometric_only uses zero horizon and must
be labelled "geometric horizon only". lola_terrain needs verified footprint/CRS,
units and skyline settings in a linked provenance record.
Visible iff elevation_deg > horizon_deg; equality is not visible.
No refraction, partial-disk, hardware, watts or link budget model is implied.
Samples must be complete, strictly increasing and match the requested grid for
both targets. Do not fill gaps with zero or synthetic data; return an error.
Duration sums each interval length when its LEFT sample is visible. The terminal
sample has zero weight. Use unrounded values internally; serialized hours may be
rounded to 6 decimal places (tolerance 0.000002 hours for checks).
Next-set is the first in-range sample that is not visible after a visible sample;
it is a sampled crossing estimate, never an exact event time. If initially below,
only a later visible-to-not-visible crossing counts. Null means no such sampled
crossing in this interval, not indefinite visibility.
Deltas are B minus A in hours, using unrounded summaries then rounding. Different
durations/steps are allowed; UI must warn these are absolute, unnormalized totals.

## Errors and health
Error object exactly `{ "error": { "code": "...", "message": "...", "details": [] } }`.
Optional details entries are objects with exactly field (path string) and issue
(readable string), never stack traces or raw provider payloads.
422 VALIDATION_ERROR; 413 PAYLOAD_TOO_LARGE; 502 NO_DATA for empty, missing or
inconsistent upstream samples; 504 UPSTREAM_TIMEOUT; 503 UPSTREAM_UNAVAILABLE;
503 TERRAIN_UNAVAILABLE if an advertised verified terrain calculation fails;
500 INTERNAL_ERROR for unexpected failures. No partial success in v1.
Empty fixture is an HTTP 502 error, not successful zero visibility.
Unverified/no terrain coverage uses labelled geometric-only mode. Current request
has no terrain selection field; do not add one without a contract change.
GET /health -> HTTP 200 exactly {"status":"ok"}; liveness only, no upstream promise.

## Interpretation and change policy
Always display source, horizon method, sample step and limitations. Never claim
certified safety, power in watts, guaranteed communications or real fixture values.
Renames/removals/meaning changes after v1 acceptance require a breaking version
and coordinated consumer updates; optional additions require a minor version.
This v1 replaces unapproved S0 proposals. Implementation owners must acknowledge
schema and fixture changes before integration. No product slice is implemented here.
