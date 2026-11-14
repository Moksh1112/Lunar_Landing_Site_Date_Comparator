# Stage Report - P1 - S0 new-only Azelux alignment
Status: S0 OPEN, Sync 0 not passed. Work branch feat/p1-s0-integration.
User requested new Azelux files only. Integration-only scope and no main changes retained.

Done: archived prior approach/contract/proposals/checklist, root entry-point links,
sole new kit API baseline, 15 new synthetic fixtures + corrected generation/checker,
source PRD/TRD/playbook/kit copies with checksums, current role prompts and ownership,
new-only team gate checklist, active source precedence/migration guide, Node 20 CI
configuration and fixture CI job. Existing Windows startup/CI fixes retained.
No frontend/backend product source edits; no implementations claimed from templates.

Checks run on this diff:
- npm run check:fixtures: PASS all 15 fixtures, signed visibility/interpolated
  crossings, hours/percent/gaps/deltas, sweep ranking, binary tile and reproducibility.
- npm run check:setup: PASS setup/launcher/checker syntax and backend compileall.
- npm run check:startup: PASS two actual HTTP responses and clean shutdown/ports.
- npm run check:backend: PASS selected Python 3.12 baseline liveness.
- Original spec/ZIP copies: PASS four recorded SHA-256 and byte sizes.
- New-only pointers/archive isolation and root Markdown links: PASS.
- Workflow YAML structure: PASS Node 20, fixture job, no job-level hashFiles.
- git diff --check: PASS; frontend and backend/app diffs empty.
These are not expanded API/scientific acceptance tests. Previously verified
baseline 9339a0e passed six GitHub CI jobs (run 43578191183). This alignment is published under the existing user approval for S0 branch work;
its hosted CI result is reported separately by exact revision. Previous green
does not imply the new revision passed.

Real: documents/source archive integrity and tooling checks only. Mocked: all 15
fixtures, including invented terrain and coordinates. No kernel/DEM acquisition,
SPICE result, terrain coverage or scientific accuracy claim.

Remaining: team review/freeze on remaining C04-C09 plus correction acknowledgment;
frontend React 18/client/shell and backend expanded API owner handoff; actual teammate
startup/hooks; download/manifest evidence; protected-main owner decision; revised
schedule/host access. No sync-0 tag until actual gate passes on canonical baseline.
No S1 work started. No main merge, deployment or tag. Next: check authorized branch publication/hosted CI, collect remaining team gates.


## Frontend teammate readiness / portable Python check follow-up
Received teammate-reported macOS startup/build/check results at baseline 5f8fd1b;
no frontend features committed in that report. Separate C03-C09/React positions and
final integration note not included. P2+P3 combined; P4+P5 combined; user P1.
Corrected bare-python npm commands to use setup-selected interpreter via python.mjs.
Initial check hit bytecode cache write errors; syntax check now compiles without
writing source-tree bytecode. npm run check:setup and check:fixtures both PASS,
also with python absent from PATH. Hosted startup matrix now runs these checks.
No product-source edits, no contract freeze, no Sync 0 tag. New hosted result must
be checked by commit; earlier CI evidence is not treated as current acceptance.
