# Frontend positions: C03–C09, React version, dependency audit

**Author:** acting frontend owner (temporary; also P2 + P3). **Status:** for P1 /
Coordinator decision. `docs/CONTRACT.md` is not changed.

## React version: recommend keeping React 19.2 (installed); do not downgrade to TRD's 18

- Everything installed and working supports React 19: react-router 7.18,
  @tanstack/react-query 5.107, zustand 5.1, zod 4.6 and the Vite 7 React plugin.
  Typecheck, lint, tests and the production build pass on 19.2.
- The TRD-named libraries for later stages require or prefer React 19 in their current
  majors:
  - **@react-three/fiber v9** (needed for the 3D view; v8 is the React 18 line).
  - **react-leaflet v5** (React 19; v4 is the React 18 line).

  Downgrading to 18 would force older majors of both.
- Downgrading now means lockfile churn and new risk with no functional gain. The TRD's
  "React 18" pins a version, but nothing in the TRD needs an API that 19 removed.
- **Request:** the Coordinator records "React 19.2 accepted (TRD 2.2 deviation)" in
  `docs/SPEC_ALIGNMENT.md` (P1 file).

## Dependency audit (run 2026-11-15, worktree `feat/p4-frontend-s0` at `be5001c` + S1 work)

- `npm audit --omit=dev` reports **0 vulnerabilities**, so nothing in the shipped bundle
  is affected.
- `npm audit` (all) reports **7 moderate**, all from **one advisory**:
  - `minimatch` 7.0.0–11.0.0, "potential denial of service via globparts amplification"
    ([GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249); vulnerable
    `<11.0.1`).
  - Reached only through `typescript-eslint@8.72.2` → `@typescript-eslint/typescript-estree`
    → `minimatch@10.2.6`.
  - The other six entries are the same chain counted per package:
    `@typescript-eslint/{parser,eslint-plugin,type-utils,utils,typescript-estree}` and
    `typescript-eslint`. It is a **lint-time dev dependency**.
- `npm audit fix --force` is **not acceptable**: it would *downgrade* `typescript-eslint`
  to 8.36.0, flagged as semver-major. It was not run.
- **Proposed targeted fix (P1 owns lockfiles):** add to `frontend/package.json` and
  re-lock:

  ```json
  "overrides": { "@typescript-eslint/typescript-estree": { "minimatch": "^11.0.1" } }
  ```

  Then run `npm install`, `npm run lint`, `npx tsc --noEmit`, `npx vitest run` and
  `npm run build`. The alternative is to bump `typescript-eslint` once a release ships
  with patched minimatch.

## C03–C09: frontend positions

Backend proposals are in `backend/docs/CONTRACT_PROPOSALS_C03_C09.md`.

| Item | Frontend position |
| --- | --- |
| **C03** refined sweep days | Accept the optional `days[].step_minutes`. The best-date calendar shows "refined (10 min)" on ranks 1–5 and "30 min" on the rest. Without the field, the UI infers it from `refined`. |
| **C04** sample cap | Accept **60,000 per request** (sum over A + B), as implemented. The Compare form mirrors it inline (`compareForm.ts`, boundary-tested). For sweep, prefer that the internal refinement **does not** count, so the user's limit stays predictable. |
| **C05** labels | Accept optional `/sites` `data_label`. Until then the UI treats every mock-transport response as SYNTHETIC (global banner + per-result badge) and hides `verified: false` sites by default, behind a labelled "show unverified (SYNTHETIC) sites" option. |
| **C06** errors | Accept `RATE_LIMITED`/429 with `Retry-After`: the UI shows the message and a retry. `client.ts`/`errors.ts` need the new code added once approved; today it would show as an unknown API error with its message. Field errors (`details[].field`) are shown next to the matching input. |
| **C07** scrubber | Accept the backend proposal (no schema change): `alignBy: mission_day` maps one offset to `t_unix[0] + offset` per scenario. `TimelineLanes` implements both alignments. |
| **C08** tiles / provenance | Accept grid-up tiles with `grid_bearing_offset_deg`, plus `source_dem` and `resolution_m`. The 3D view (gated, not built) will light the scene with bearing `(az + offset) mod 360`. Accept `manifest_sha256` in meta for export provenance. |
| **C09** versioning / labels | Agree: optional fields are v1.1. 2–4 scenarios should be a new endpoint, because the 2-scenario `deltas` shape is used throughout the UI. Source labels stay mandatory after any cuts. Accept the `reference` site group; the picker needs only a group label for it. |

## Contract gaps found while building the S1 journey

- **None blocking.** The Compare journey uses only v1.0 fields.
- Display-only derivations are computed client-side and labelled as derived, never sent
  back:
  - B-relative deltas = -(contract delta).
  - Total sample count, for inline validation.
