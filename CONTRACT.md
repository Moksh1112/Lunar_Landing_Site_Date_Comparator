# Contract handoff - supplied requirements + Person 2 decisions pending
Person 2 owns contract changes. Person 1 records the supplied requirements only.

## Fixed requirements
- POST /api/v1/compare accepts exactly two scenarios, each containing exactly:
  id, label, latitude_deg, longitude_east_deg, start_utc, duration_hours, step_minutes.
- ISO UTC time; degrees; Moon longitude east-positive. PRD ranges: latitude [-90,90], longitude [0,360].
- Response: per-scenario timestamped Sun/Earth azimuth/elevation, horizon,
  visibility, source/mode, sampled durations, next-set values and deltas.
- Errors: {"error":{"code":"...","message":"...","details":[]}}.
- GET /health returns {"status":"ok"}.
- Geometric-only mode is always labelled. Fixtures are SYNTHETIC.

## Approval needed from Person 2 before S1
The request envelope {scenarios:[...]} and response field names in fixtures are
PROPOSED, not an approved v1 contract. Confirm envelope, response schema,
limits, UTC offset handling, unique IDs, sample endpoint inclusion, visibility
threshold, sampled interval weighting, next-set semantics, delta direction,
HTTP statuses and empty-result policy. Empty fixture proposes a NO_DATA error.
No compare endpoint is implemented in S0 to avoid taking Person 4's slice.
