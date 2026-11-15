# UI hardening checkpoint — stopped for takeover

The user stopped remaining implementation on 15 November 2026. This checkpoint
preserves the interrupted UI pass; it is not a completed visual acceptance gate.

## Changes preserved

- Export actions expand in normal document flow, bounded to the container, rather
  than an absolutely positioned menu that spills left and covers comparison results.
- Terrain controls have a wrapping labelled control group and responsive viewport.
- Narrow comparison grids can shrink below their preferred minimum column width.
- Methods sections and evidence tokens wrap instead of forcing page overflow.
- Plan B uses the agreed burnt-orange colour on Report and print.
- Expert run details link to current Methods evidence instead of claiming none exists.

## Checks actually run by integration

- npm --prefix frontend run lint: exit 0.
- npm --prefix frontend test -- --run: 15 files, 126 tests passed.
- npm --prefix frontend run build: strict TypeScript and production build passed.
- Vite still warns about chunks above 500 kB; no warning suppression was added.
- No dependency, lockfile, backend or contract changes in this checkpoint.

## Still needs verification

Computer Use stopped because it could not establish Chrome's current URL confidently
enough to enforce its policy. No browser bypass was attempted. These UI changes have
NOT been rendered or interaction-tested in this checkpoint. Earlier screenshots
predate it and are not evidence for the overflow correction.

Next owner: inspect Export on Compare and Report at 320/375/768/1440 px, long plan
names and evidence text, keyboard focus/disclosures, the terrain control group and
print. Check actual CSV/JSON download actions. After hosted CI is green, merge this
owner branch into integration and repeat the real-data comparison smoke check.

The scientific blockers and source-data reproduction steps are documented in
`docs/NON_RELEASE_HANDOFF.md` on the integration branch. Do not mark V4 or V6 accepted.
