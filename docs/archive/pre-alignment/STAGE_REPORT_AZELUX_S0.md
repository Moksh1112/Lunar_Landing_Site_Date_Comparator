# STAGE REPORT - P1 / Integration only - Azelux S0
Date: 14 November 2026, Asia/Kolkata. Sync 0: NOT PASSED; stop here.
Branch: feat/p1-s0-integration. Base commit: 98da730.
Changes remain uncommitted for human diff review required by playbook 5.2.
No PR, main merge, tag or deployment. No history rewrite.

## Done
- Existing repository and six remote branch heads inspected; no remote main exists.
- Honored integration-only override: no frontend or backend product source edits.
- Wrote hash-pinned backend requirements lock, reproducible setup, Make aliases,
  names-only Azelux env example, ignored runtime/science data, LF attributes.
- Added attribution hook/guard from kit; guard now fails closed on bad revisions
  and supports initial-history checking; installed core.hooksPath locally.
- Added CI for backend baseline health, frontend checks/build, attribution and
  history secret scan. Fixed kit job-level hashFiles usage: conditions are steps
  after checkout. Missing owner lint/unit suites are explicit notices.
- Added docs/PROJECT.md, ownership rules, README and eight team contract requests.
- Kept legacy contract and fixtures unchanged pending acceptance.

## Exact checks/results
- git ls-remote --heads origin: PASS; six earlier branch heads, no main.
- uv python install/compile with uncreated repository cache dirs: FAIL twice;
  stopped that install path and reported. Python mkdir confirmed directory creation.
- uv pip compile backend/requirements.txt --python-version 3.12 --generate-hashes
  --output-file backend/requirements-lock.txt: PASS after cache directory exists;
  uv fetched CPython 3.12.14 during resolution, 13 packages resolved.
- npm run setup: FAIL at uv pip sync inspection of generated .venv/Scripts/python.exe;
  Windows Application Control error 4551. No successful target-runtime install claimed.
- Direct uv interpreter probes in existing venv: same policy error. No policy changes,
  DLL bypasses, interpreter fallback to unsupported version or further fix cycles.
- npm --prefix frontend ci: PASS; 21 packages, audit 0 vulnerabilities.
  esbuild install-script allowScripts warning remains; build nevertheless passed.
- npm --prefix frontend run check: PASS strict tsc.
- npm --prefix frontend run build: PASS, Vite 7.3.8, 3 modules transformed.
- Actual Vite process on 127.0.0.1:15173 with frontend cwd: HTTP 200 containing
  /src/main.tsx; probe process terminated after check. No visual/UI feature claim.
- python scripts/check_backend.py using existing system Python 3.13: PASS actual
  Uvicorn startup and GET /health status=ok; temporary server terminated. This is
  baseline liveness only, NOT Python 3.12 or expanded Azelux contract acceptance.
- npm run check:setup: PASS Node syntax and Python compileall.
- bash -n scripts/check_attribution.sh and scripts/hooks/commit-msg: PASS in
  authorized runner. Restricted Git Bash runner initially failed OS access.
- bash scripts/check_attribution.sh --root HEAD: PASS existing history.
- Hook tests via temporary message files, no commits: PASS human message accepted,
  AI coauthor rejected, Generated-with footer rejected.
- Guard with missing-review-base: PASS rejected nonzero (fail closed).
- npm run hooks / git config --get core.hooksPath: PASS scripts/hooks.
- PyYAML BaseLoader parse and workflow structural assertions: PASS four jobs,
  checkout before checks, no job-level hashFiles. NOT actionlint or hosted execution.
- git diff --check: PASS. Frontend/backend product source and fixture/contract diffs
  absent. No clean-clone, full one-command startup, hosted CI, secret scan,
  scientific validation or teammate readiness check claimed.

## Real / mocked
Real evidence: startup/build/tooling checks above. All comparison fixtures remain
synthetic legacy proposals. No runtime SPICE, LOLA or Horizons data integration.

## Blockers / owners
1. Local Application Control blocks target Python venv launcher: approved compatible
   runtime/environment needed. Full one-command setup/start remains unverified.
2. Human review of this diff before commit/push per new playbook; hosted CI pending.
3. Repository owner must authorize/bootstrap protected main only after a green,
   reviewed baseline. No branch-protection evidence yet.
4. P2/frontend/terrain/Coordinator must resolve C01-C08 before contract/fixtures freeze.
5. Teammates must supply actual slot/name/branch, module startup, hooks and contract
   acknowledgment. P2/P3 must provide kernel/DEM download/manifest evidence.
6. Frontend owner must supply client/shell/routes/map plus lint/unit setup and decide
   React 18/19 and Node version alignment. P1 does not take these tasks back.
7. Backend owner supplies Azelux scaffold/models/mock endpoints/tests and pyproject;
   P1 records uv.lock after handoff. Current health-only scaffold is insufficient.
8. Hosting/domain access, P5/P6 availability and schedule need Coordinator confirmation.

## Next
Human reviews diff, then authorized branch publication and hosted CI observation.
Finish S0 gate with owners; tag sync-0 only after required evidence on main.
Do not begin S1 without explicit next-stage instruction.

Final hook installer update: npm run hooks now uses scripts/hooks.mjs, setting POSIX execute permissions and Git hooksPath. Restricted runner config write denied; authorized runner rerun passed. npm run check:setup including hooks.mjs syntax passed. POSIX execution still awaits Linux CI.


# Authorized publication and startup fix follow-up
User approved commit/push and requested setup fix/CI observation. Baseline 3f70bc9
pushed to feat/p1-s0-integration. No main edits/merges/protection changes.
Initial hosted CI run 43577940621: completed SUCCESS. Attribution, frontend,
backend and secrets-scan jobs all succeeded (observed via GitHub public API).

Resolved local blocker: `uv python find --system 3.12` selected the approved base
Python 3.12.14, which ran directly. Added explicit AZX_PYTHON_MODE=target:
locked packages installed to .venv/target, setup record .venv/runtime.json, backend
child uses that interpreter and PYTHONPATH. No policy changes or system installs.
Default venv mode remains supported; its generated launcher remains blocked locally.

Checks on follow-up:
- AZX_PYTHON_MODE=target npm run setup: PASS, Python 3.12.14, 13 hash-locked
  packages and npm ci; npm reported zero vulnerabilities.
- npm run check:backend: PASS using selected Python 3.12 and target packages.
- npm run check:startup: PASS actual dual-module launcher, backend HTTP 200/status ok,
  frontend HTTP 200/module shell, graceful IPC shutdown and both ports released.
- npm run check:setup and git diff --check: PASS.
- Added hosted integration-startup matrix for venv/target, install/setup/startup/
  backend checks. Follow-up result must be reported separately by revision.

Remaining Sync 0 blockers: reviewed team contract/fixtures (C01-C08), actual teammate
readiness, kernel/DEM manifests/download evidence, protected main and agreed role/time/
hosting handoff. No main change authorized; no sync-0 tag until gate passes.
All science/comparison data remains synthetic; these are module-startup checks only.
