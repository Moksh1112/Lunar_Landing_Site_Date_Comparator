# Sync 0 - outstanding confirmations

## Person 2 - contract owner
Review CONTRACT.md and every JSON file in fixtures/. Reply with an approved v1
contract and fixtures (or exact edits); none of the proposed fields below are
implicitly approved by the integration scaffold.

1. Request envelope: approve `{ "scenarios": [A, B] }`, exactly two entries,
   reject unknown fields at both levels, and unique non-empty IDs/labels.
2. Validation: approve latitude/longitude endpoints, south-pole-only policy if any,
   string length limits, finite numeric values, duration/step minima and maxima,
   integer versus fractional steps, maximum sample count and request body size.
3. Time: confirm UTC parsing (Z only or +00:00 accepted), start/end sample inclusion,
   duration not divisible by step, and timestamp serialization.
4. Response: approve exact field names/types/nesting in compare.ok.proposed.json;
   whether input metadata is echoed, whether sample interval is explicit,
   source/mode enums, provenance fields and where limitations belong.
5. Geometry: confirm azimuth origin/direction/range, target-center interpretation,
   elevation reference, horizon at target azimuth, and whether visibility is strict
   elevation > horizon (equality handling).
6. Windows: approve interval weighting (terminal sample contributes no extra interval),
   handling of partial intervals/gaps, units, rounding, next-set meaning (sampled
   first crossing or refined), and null meaning when no set occurs in the interval.
7. Deltas: confirm B-minus-A direction, metric names, units and comparability of
   scenarios with different durations or step sizes.
8. Errors: approve HTTP status/code/details for invalid input, no data, upstream
   timeout/unavailable and terrain unavailable; confirm whether empty is a NO_DATA
   error as proposed or an empty success. Never return synthetic data as a live fallback.
9. Confirm approval of normal/empty/error fixture shapes and SYNTHETIC labels.

Person 1 will record the approved contract and fixtures; Person 2 owns these decisions.

## Every teammate (Persons 2-6)
After the startup fixes land, update your branch from chore/integration-devops,
resolve any conflicts in your owned folders, then send:

```
Person: <2/3/4/5/6>
Branch / exact commit: <...>
Ownership and CONTRACT.md reviewed: yes / issues
OS / Node / npm / Python versions: <...>
Clean clone or updated checkout: <...>
npm run setup: pass / exact error
Owned module command + observed result: <...>
Fixtures labelled synthetic and contract proposal understood: yes / issues
Ready for Sync 0: yes / blocker
```

Specific module evidence:
- Person 2: approve contract + fixtures; confirm provenance/evaluation folder and branch ownership.
- Person 3: Vite serves http://127.0.0.1:5173, shell loads (blank S0 root is intentional),
  strict type-check and production build pass on their host; confirm frontend ownership.
- Person 4: Uvicorn starts; GET /health is HTTP 200 with exactly {"status":"ok"};
  review backend scaffold and accept Horizons adapter ownership. No compare endpoint yet.
- Person 5: clone/setup and frontend startup; confirm visualization folder/branch ownership.
- Person 6: clone/setup and backend startup/health; confirm terrain folder/branch ownership.
  No terrain data/coverage certification is required or claimed at S0.

Branches:
- P2 docs/contract-provenance
- P3 feat/frontend-react-typescript
- P4 feat/backend-fastapi-python
- P5 feat/frontend-horizon-visualization
- P6 feat/backend-lola-terrain

Do not treat these branches as updated automatically: startup corrections are pushed
only to chore/integration-devops. Person 1 will integrate green work at the sync.

## Repository owner / coordinator
- Provide event name, official rules/rubric, AI/prebuilt-code policy, deployment
  permission, submission deliverables, kickoff/deadline and breaks in Asia/Kolkata.
- Confirm collaborator GitHub identities and consent before invitations.
- Bootstrap/protect main via the repository owner once the scaffold is green;
  require PR review, no force pushes and passing checks when S1 CI exists.
- Confirm the user's S1 CI timing is an accepted exception to the playbook's
  Sync 0 CI gate. CI has deliberately not been implemented in S0.
- Supply the Coordinator's teammate prompts/readiness confirmations if used;
  this Person 1 chat does not claim teammates received or accepted them.

## Gate remains open
Local frontend build/startup is blocked by Windows Application Control. Two
unsuccessful WASM override resolution attempts were reverted. The next frontend
action needs a blocker handoff/new diagnostic direction, or verification on an
approved compatible host. Do not disable the host security policy.
No sync-0 tag until module startups, contract/fixture acceptance and sync gates
are satisfied. Stop at S0; do not begin S1 without the stage instruction.
