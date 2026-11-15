# Landing integration milestone — 15 November 2026

User requested review of frontend-landing and integration if aligned/green.
Source 689305a was green; reviewed correction df60cbc was green on run 43688963732
before merging into feat/p1-s0-integration. Review: frontend/docs/LANDING_INTEGRATION_REVIEW.md.

## Alignment decision

Accepted as an optional presentation route at /landing. The default / comparator
and its light lunar atlas theme remain. The dark landing presentation is scoped to
its route. It does not fulfill or advance the gated Iteration 1 story/education mode.
No backend/contract/science result was replaced. V4 remains failed; V6 remains an
owner qualitative spot check, not independent certification.

Corrections before acceptance:
- Prominent SYNTHETIC notices for procedural scenery and invented numeric readouts.
- Historical geometric example labelled as recorded rather than currently live.
- Current full V1/V2 evidence and remaining V4 failure stated.
- Existing Three.js/@types 0.187.0 retained; only exact GSAP 3.12.5 added.
- Scoped GSAP context cleanup; cancelled landing frames; guarded async disposal;
  render on interaction rather than a continuous idle WebGL loop.
- Mobile duplicate caption overlap removed; explicit synthetic slider accessible
  name and accurate modifier-key orbit instructions added.

## Verification actually performed

- 134 tests passed; lint, strict TypeScript and production build passed.
- Three meaningful tests cover east-positive marker axes, pole placement/scale and
  valid chapter endpoint bounds. These test illustration geometry, not ephemeris.
- npm audit: 0 vulnerabilities; existing ESLint support/bundle warnings retained.
- Mechanical design detector returned no findings.
- Browser at 320/375/769/1440 measured CSS widths: scroll widths 307/363/756/1427;
  no horizontal overflow, one h1, both canvases reported state ok, no console errors.
- Site B selection changed the illustrative site/readouts. Slider to 354 h updated
  the labelled synthetic elevation. Launch link reached Compare.
- After integration, root npm ci/build passed; health ok, mock false, contract 1.1.
- Original branch screenshots predate these alignment edits and are not proof of
  the new labels. Physical devices and reduced-motion OS switching were not tested.

## Preview

http://127.0.0.1:5173/landing — presentation
http://127.0.0.1:5173/ — comparator
http://127.0.0.1:8000/health — real backend

The isolated 5176 review preview is stopped after verification. Main preview state
is recorded in ignored work/server-state.json. Existing frontend-owner uncommitted
landing/package/router work was preserved; do not reset that worktree. Use the
published integration branch as the current combined source.

Combined integration hosted CI is checked after this documentation checkpoint.
Final release/deployment and existing scientific/usability gates remain unchanged.
