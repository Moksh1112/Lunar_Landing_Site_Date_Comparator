# P1 review - frontend S0 - 14 November 2026
Published branch feat/p4-frontend-s0, commit 0cd0ae5. Report said unpushed, but remote
verification found all twelve reported commits published. No PR/branch workflow run
was returned by GitHub API during review. Based on older ea15dfd integration; must
incorporate latest integration tooling/CI without discarding own code.

## Independently checked in detached checkout (no extra branch)
- npm ci: PASS exact frontend lockfile installation.
- npm --prefix frontend run check: PASS strict TypeScript.
- npm --prefix frontend run lint: PASS.
- npm --prefix frontend test -- --run: PASS 27 tests / 2 files.
- npm --prefix frontend run build: PASS real-mode/default build; index JS/CSS only,
  no separate fixture chunks emitted. Rollup annotation warnings in zod are nonfatal.
- npm audit: 7 moderate affected packages, in typescript-eslint/minimatch dev chain;
  0 high/critical. npm warns pinned ESLint 9.39.5 is unsupported.
- npm audit --omit=dev: PASS 0 vulnerabilities.
- AZX_PYTHON_MODE=target, VITE_USE_MOCK=true npm run setup: PASS.
- npm run check:startup: PASS actual HTTP startup and clean shutdown/ports.
All tests used published code; no frontend files/dependencies or shared fixtures edited.

## Implementation observed
Typed endpoint functions and transports, lazy mock fixture registry with selectors,
contract-shaped error parsing, schemas/tests, shell/router placeholders, ErrorBoundary,
Simple/Expert toggle, global synthetic banner, shared async-state/label components,
methods/report placeholder pages and theme styles. This is S0, not a complete Compare
journey, real Methods evidence, report export or other feature-screen acceptance.

## Source-of-truth / acceptance gaps
1. React 19.2.0 remains, TRD targets React 18. No explicit approval/recorded override
   received. Frontend owner must provide recommendation and team decision.
2. Latest integration changes and branch CI need incorporation/publication. Green
   local checks do not substitute for hosted checks on the integrated revision.
3. Dev audit/unsupported ESLint requires coordinated remedy or explicit reviewed
   acceptance; do not run audit fix --force or silently change pinned dependencies.
4. Backend RATE_LIMITED/429 proposal is not included in frontend's canonical error
   enum. Resolve contract centrally and update both consumers together; no silent
   frontend enum invention. Other C03-C09/frontend decisions still need the note.
5. Browser visual/keyboard walkthrough, test sensitivity, production no-backend
   behavior and temporary throwing-route tests remain OWNER-REPORTED. HTTP startup
   does not verify rendered UI or accessibility. No design-quality claim here.

## Gate decision
S0 frontend CODE PRESENT and local checks VERIFIED. Not yet accepted/integrated.
No source changes/merge or stage advancement done by P1. User remains integration
only. Remaining work is owner/contract/CI coordination, not reimplementing frontend.
