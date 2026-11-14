# Azelux S0 contract requests - team decisions required
Status: new kit contract adopted at user's explicit request. Earlier baseline is
archived; no competing root specification remains. Team freeze not yet recorded.
C01 adoption is resolved. C02/C03 fixture arithmetic corrected to new TRD; owners
must acknowledge fixture semantics. Other ambiguities remain open.
Azelux kit v1.0 and earlier repository v1.0 are incompatible; distinguish them by
name/revision and explicitly announce the accepted canonical contract path.

| Request | Boundary / requested decision | Affected owners |
| --- | --- | --- |
| C01 | RESOLVED adoption: user selected new-only baseline; docs/CONTRACT.md is sole target; root file is pointer and legacy material archived. Team freeze still pending | All |
| C02 | FIXTURE CORRECTED: interpolated target windows, combined intersection and complementary gaps share a basis. Backend d5c137b contains window/metrics implementation; confirm both-event policy and rounding tolerances before acceptance | P2, P1, frontend |
| C03 | FIXTURE CORRECTED: combined hours/percentage agree over 708h; refined-day effective metadata remains open | P2, P1 |
| C04 | Define 60,000-sample aggregate cap, grid/end/partial-step rules and duration compatibility; two 8760 h/10 min scenarios require 105122 samples | P2, frontend |
| C05 | Add safe SYNTHETIC provenance to sites/mock health; original kit invented sites were verified=true; P1 fixtures now use false and include mock health. Missing sites transport label and empty-sweep semantics still need agreement | P2, P1, frontend |
| C06 | Define threshold ranges, timeout/rate-limit errors, required versus optional Site fields, and request mode enforcement | P2, frontend |
| C07 | Define shifted-date scrubber mapping and the request context retained by exports/countdowns; one absolute scrubT cannot alone identify both mission-relative moments | P2, frontend |
| C09 | Reconcile new-source contradictions: kit version example labels 2-to-4 comparison as v1.1 despite breaking-change rule; all-response data_label rule vs omitted sites/health fields; source gate/demo behavior after approved 3D/PDF cuts | Coordinator, backend, frontend |
| C08 | Reconcile terrain/coarse/coverage fallback, terrain tile extents and manifest provenance available to browser exports | P2, terrain, frontend/report |

No invented values become REAL merely because data_label changes. Science owners
must provide verified kernel/DEM provenance and validation evidence before acceptance.
P1 fixture-authoring helpers are not runtime science services. P1 does not implement
SPICE, terrain, backend metrics, UI client or feature screens. Synthetic sites now
have verified=false; missing transport labels still need C05 schema resolution.

## Decisions approved 15 November 2026

The user authorized P1 to resolve plan-aligned choices without waiting for inactive
teammates. C03-C09 target decisions and R1-R3 are approved in
FRONTEND_UNBLOCK_DECISIONS.md, superseding the pending-decision wording above.
Approval and implementation conformance are distinct: optional schema additions are
v1.1 work; current v1.0 wire responses/fixtures are not silently relabelled.
