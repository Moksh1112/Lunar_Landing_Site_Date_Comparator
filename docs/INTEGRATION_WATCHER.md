# Shared integration branch watcher

The user-approved workflow is shared `feat/p1-s0-integration`: the teammate pushes
on GitHub, this checkout fetches/pulls, and the user separately requests integration.
The watcher is `scripts/watch-integration.mjs`, using Node and Git with no dependency.

```sh
npm run watch:integration
npm run watch:integration -- --interval 120
npm run watch:integration -- --once
```

The default interval is 60 seconds (allowed: 10-3600). Keep the command running in
a terminal; Ctrl+C stops it. Network failures are logged and retried next interval;
Git prompting is disabled. A one-shot check returns a nonzero code on fetch/error.
Repeated identical status messages are suppressed. It is not a Windows boot task.

Each check fetches **only** the named branch from origin, without overwriting
`FETCH_HEAD`. A clean checkout on that branch advances automatically if the fetched
tip is a fast-forward. There is no automatic merge commit, conflict resolution,
rebase, stash, reset, dependency installation, test run or push. No other branch is
advanced. Dirty worktrees and ongoing Git operations wait for manual completion.
Stop the watcher before manual Git/integration work.

**Divergence:** unpushed local commits plus new remote commits need integration.
The watcher fetches them and logs the counts/SHA, leaving files and HEAD unchanged.
Tell P1 to integrate the fetched tip when ready; fetching is not acceptance, and a
successful fast-forward still needs review/tests. This is expected while P1 commits
are kept local under the no-push instruction.

For an optional hidden Windows job, launch Node with `Start-Process -WindowStyle
Hidden`, redirect stdout/stderr under ignored `work/`, and retain the returned PID.
Stop only that verified watcher process when integration begins. Such a process
lasts until stopped or Windows exits; no scheduled task/service is installed.

Validation: `npm run test:watch-integration` passed eight Git scenario subtests
(nine including their parent), using temporary synthetic repositories. Scenarios:
current branch, dirty work/FETCH_HEAD preservation, another branch, unfinished
merge, exact fast-forward, local-only commits, divergent history and network failure.
The test runs in both hosted integration-startup matrix jobs after a future push.
Syntax and `npm run check:setup` passed; invalid polling intervals are rejected.
No frontend/backend tests were rerun for this tooling-only change.

Live one-shot check fetched `729f228` from GitHub, four commits beyond the prior
published `89ce28c`. Those commits remain pending manual integration. No code from
them was merged or declared verified in this task. No hosted CI is claimed for
this local tooling change. Implementation/tests used AI assistance under the user
request, with the existing human Git identity retained.
