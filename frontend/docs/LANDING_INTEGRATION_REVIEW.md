# Landing integration review — 15 November 2026

Source branch frontend-landing at 689305a had green CI 43687685580. User requested
review and conditional integration. The page is an optional presentation route at
/landing; / remains the comparator. It does not pass or replace any MVP/science gate.

| Before | After | Why |
| --- | --- | --- |
| Toy numerical simulation readouts | Prominent SYNTHETIC notices and illustrative field labels | Procedural geometry and invented directions are not SPICE/terrain results |
| Historic one-site validation claim | Current V1/V2 evidence and remaining V4 failure stated | Match committed science evidence |
| Historic numbers called live | Earlier recorded local computation explicitly identified | No implied fresh network result |
| Three.js/types downgraded | Existing exact 0.187.0 pins restored | Preserve verified terrain stack |
| Continuous idle render loop and uncancelled landing frames | Render on control changes; cancel animation frames and guard async disposal | Avoid work after navigation; no idle animation loop |
| GSAP ownership implicit | Scoped context reverted on unmount | Clean React navigation |
| Mobile illustration caption overlaps hero | Hide redundant aria-hidden caption on mobile; visible synthetic notice retained | Keep text and controls readable |
| Arrow-key orbit wording | Control/Command plus arrow keys, matching OrbitControls | Accurate keyboard instructions |

The standalone landing page keeps its scoped dark presentation. The scientific app's
light lunar atlas tokens, Compare routes and outputs remain the default application.
Schematic imagery is not georeferenced terrain; marker coordinates do not make the
invented Sun/Earth positions real. The illustration is not the gated Iteration 1
education/story mode, an alternative finder, or a new science engine.

GSAP is lazy loaded only for this presentation route; existing science code and
contract remain unchanged. No backend, deployment, branch protection or gate changes.

Verification: 134 unit tests pass (including east-positive marker axes, pole placement
and chapter endpoint bounds), strict TypeScript/production build and lint pass.
Npm audit reports 0 vulnerabilities. Existing ESLint support and bundle-size warnings
remain advisory. Browser verification is recorded with the final integration report.

Design guidance: Impeccable Operate/Read for the app and presentation guidance for
this optional route; Emil for responsive controls and purposeful interaction; Taste
for composition without overriding scientific labels. GSAP core/ScrollTrigger/React
references informed the lifecycle correction.
