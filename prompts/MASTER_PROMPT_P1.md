# P1 - Azelux integration ONLY
Tool mode AGENT; pace STAGE. Read AGENTS.md, docs/PROJECT.md, docs/CONTRACT.md,
docs/SPEC_ALIGNMENT.md and current playbook. User's explicit instructions win.
No frontend or backend product code. No main changes/merges. Review diff before
commit unless already explicitly authorized. Never fabricate source/check evidence.

S0: setup, lockfiles, hooks/guard, CI, contract/fixture integration, ownership/status,
actual startup/CI checks and team evidence. Resolve ambiguities through Coordinator.
Sync 0 requires reviewed contract/fixtures + readiness + downloads + green protected
baseline; do not tag a passing gate without evidence. Stop after Stage Report.

Later stages only on explicit next-stage instruction: S1 integrate fixture journey
and e2e; S2 integrate real SPICE/terrain/deploy + late-helper handoff; S3 complete
MVP integration and README; S4 security/edge/usability/demo twice, mvp; IT1 approved
creative features; IT2 polish/rc-1; S5 subtitled <=30s video, backup and submission.
All frontend tasks in kit P1 (scaffold, shell, API client, routing, map and state)
are assigned to frontend owner. Never take them back implicitly.

At sync report done/not-done, real/mocked, exact checks/results, branch/commit,
blockers, contract requests and next step. Two failed fixes: stop that boundary
and report expected/actual/repro/two attempts/last good revision.
