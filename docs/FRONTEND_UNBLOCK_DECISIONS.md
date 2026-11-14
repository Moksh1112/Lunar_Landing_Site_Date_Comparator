# P1 frontend unblock decisions and integration review — 15 November 2026

Authority: the user delegated plan-aligned decisions to P1 and authorized this plan.
Do not wait for inactive teammates on the decisions below. Scope is integration and
frontend enablement; scientific validation and later stage gates still require evidence.

## Approved decisions

- R1: Leaflet 1.9.4, React Leaflet 5.0.0 and @types/leaflet 1.9.21 are pinned and
  installed by P1. React Leaflet's published React 19 peers match the existing setup.
  Use TRD CRS.Simple with sourced Moon imagery/georeferencing, never Earth tiles.
  If imagery is absent, provide an explicit unavailable basemap state and retain
  numeric coordinate entry. This is not verified terrain coverage. 3D remains gated;
  three/react-three-fiber installation is deferred until its gate is satisfied.
- R2: validation/README.md and evidence.schema.json define the approved build-time
  interface. No validation result is fabricated or promoted by this decision.
- R3: frontend verdict pass/near comparisons use the backend's 1e-9 tolerance;
  the exact 57.6 h amber boundary is accepted. Tests cover exact and beyond-tolerance
  cases. This corrects implementation parity, not the product's threshold meaning.
- React 19.2.0 retained as the user-authorized TRD tooling deviation. P1 installed
  the targeted typescript-estree/minimatch 11.0.1 override after checking published
  Node compatibility. No audit fix --force. Current full and production audits: zero.

## Contract decisions (approved target; implementation is separate)

Adopt C03-C09 owner proposals in backend/docs/CONTRACT_PROPOSALS_C03_C09.md as
planning decisions, with these constraints. Optional additions ship as contract v1.1;
existing v1.0 fixtures/responses retain their truthful version until consumers update.
C04 per-request count and C07 mission-day timestamp mapping clarify v1.0 behavior.
Sweep counts the requested 30-minute grid; internal refinement is excluded from that
user input cap, but must remain bounded server work. Preserve configured timeouts.
C06 RATE_LIMITED/429 requires frontend enum/parser support before real integration.
C08 grid-up/offset requires matching map/3D transforms, never a north-up claim.
Accept C05 source labels, C08 provenance, C09 reference group and separate endpoint
for any future >2 comparison. Scientific coordinate/source claims still need evidence.
No automatic feature expansion or multi-scenario implementation is authorized.

## Frontend owner's next work

Pull/merge P1 integration before dependency or verdict edits. Implement F3 using the
approved dependencies; complete source links, accessible inline glossary and the
PRD/TRD Expert-mode audit. Implement the validation display from the approved file
interface with truthful empty/invalid states. Coordinate API v1.1 consumer updates
with P1 before switching live data. Keep all mock data SYNTHETIC.

## Independent evidence on this host

- Owner commit 53221dd CI 43633449283: SUCCESS before integration.
- Browser using HTTP frontend + synthetic backend: Compare renders results, Best Date
  returns calendar/top five, Load as B returns to Compare with the chosen date/site.
- Browser JSON and CSV downloads opened/parsed: provenance SYNTHETIC, request and full
  result retained in JSON, CSV contains both scenarios and all 98 time-series rows.
- Print button attempted: embedded-browser click timed out and no print preview was
  exposed. PDF/print visual verification remains OPEN; do not call print verified.
- Real science/backend data validation not reproduced. No Sync or later gate passed.
