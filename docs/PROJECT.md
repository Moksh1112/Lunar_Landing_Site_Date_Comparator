# Azelux - integration status
Updated 14 November 2026 (Asia/Kolkata). Stage: S0, Sync 0 NOT PASSED.
Existing repository retained at user's request. User/P1 owns integration only;
all frontend implementation including shell/client/map stays with frontend owner.

## Ownership override
P1: root tooling, lockfiles, CI, hooks, fixtures after team approval, integration
status, deployment, QA, demo/submission. No frontend source or backend product source.
P2/backend: API, contract draft, SPICE, metrics, sweep and backend scaffold.
Terrain owner: DEM downloads, skyline, coverage, tiles and terrain validation.
Frontend owner: all frontend source, store, shell, typed/mock client, map and views.
PRD owner: document clarification. P4/Coordinator relays team decisions.
Actual names and P5/P6 availability still need confirmation; do not infer assignments.

## Baseline / branch
Base commit 98da730; work branch feat/p1-s0-integration. No main exists on remote
as verified by git ls-remote during this stage. No sync tags created.
Earlier branches preserved. No merges or history rewrites.

## Current evidence
Frontend dependency install, strict type-check, build and actual HTTP startup pass.
Python 3.12.14 setup and health now pass in explicit target mode, using the approved
base interpreter and isolated `.venv/target` dependencies; policy is unchanged.
Full dual-module launcher HTTP checks and graceful shutdown pass locally.
Initial hosted CI passed all four jobs, run 43577940621; follow-up startup-matrix
CI must be checked for the pushed revision.
Backend lint/unit suite, frontend lint/unit suite and science services await owners;
CI notices explicitly state absent suites, they are not counted as passing.
No Azelux contract/fixtures adopted pending docs/CONTRACT_CHANGE_REQUESTS_S0.md.

## Remaining Sync 0 gate
User approved commit/push; baseline committed/pushed. Observe follow-up CI;
main/protection remains pending with repository owner; user forbids main changes; obtain actual teammate
startup/hook acknowledgments; resolve contract/fixtures; obtain kernel/DEM download
evidence and final role map; confirm host/domain and revised schedule through Coordinator.
S0 stops here. No S1 UI/e2e, deployment or science work begun.
