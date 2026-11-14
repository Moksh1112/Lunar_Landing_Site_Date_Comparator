# Azelux S0 contract requests - team decisions required
Status: REQUESTS ONLY. No root contract or fixture was changed/adopted.
Azelux kit v1.0 and earlier repository v1.0 are incompatible; distinguish them by
name/revision and explicitly announce the accepted canonical contract path.

| Request | Boundary / requested decision | Affected owners |
| --- | --- | --- |
| C01 | P2 drafts, P4 reviews and Coordinator approves adopting the Azelux contract; P1 records it at docs/CONTRACT.md and retires the earlier root contract explicitly | All |
| C02 | Fix kit generator window interpolation/censored edges and derive gaps from the same intervals; compare Scenario A stores 5 h darkness but windows imply 4 h | P2, P1, frontend |
| C03 | Fix sweep hours/percent consistency: first row 200 both-hours over 708 h is 28.2%, not 28.0%; clarify refined-day effective sample step | P2, P1 |
| C04 | Define 60,000-sample aggregate cap, grid/end/partial-step rules and duration compatibility; two 8760 h/10 min scenarios require 105122 samples | P2, frontend |
| C05 | Add safe SYNTHETIC provenance to sites/mock health; invented sites are currently verified=true in kit; define empty sweep meaning and health fixture | P2, P1, frontend |
| C06 | Define threshold ranges, timeout/rate-limit errors, required versus optional Site fields, and request mode enforcement | P2, frontend |
| C07 | Define shifted-date scrubber mapping and the request context retained by exports/countdowns; one absolute scrubT cannot alone identify both mission-relative moments | P2, frontend |
| C08 | Reconcile terrain/coarse/coverage fallback, terrain tile extents and manifest provenance available to browser exports | P2, terrain, frontend/report |

No invented values become REAL merely because data_label changes. Science owners
must provide verified kernel/DEM provenance and validation evidence before acceptance.
P1 does not implement SPICE, terrain, metrics, UI client or feature screens.
