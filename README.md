# Lunar Landing Site-Date Comparator
Compare two lunar south-pole site/date scenarios and their sampled Sun/Earth visibility.
**S0 scaffolding only.** No comparison journey or real Horizons/LOLA integration yet.
Live URL / screenshot / demo: pending later stages. Team: see PROJECT.md.

## Local setup
Requires Node 22.12+ (or 24+), npm, Python 3.13 and network access for dependency installation.
```sh
git clone https://github.com/Moksh1112/Lunar_Landing_Site_Date_Comparator.git
cd Lunar_Landing_Site_Date_Comparator
npm run setup
npm run dev:all
```
One command starts both modules after setup. Open http://127.0.0.1:5173 (blank S0 shell)
and http://127.0.0.1:8000/health (expected {"status":"ok"}). Stop with Ctrl+C.
Backend docs: http://127.0.0.1:8000/docs. Compare route is not implemented yet.
No credentials needed. .env.example lists reserved names only; EPHEMERIS_MODE is
reserved for the adapter owner and is not read by this scaffold. No data is persisted.

## Checks
```sh
npm run check
npm --prefix frontend run build
```
Stack: Vite, React, TypeScript, FastAPI, Python. No AI or database.
frontend/ and backend/ are module handoffs; fixtures/ holds clearly synthetic v1 examples;
scripts/ owns setup/start; docs/ records event evidence and stage reports.
Frontend uses exact package versions plus npm lockfile; backend direct dependencies
are pinned, full transitive locking is pending S1 CI setup.

## Collaboration
Read PROJECT.md and CONTRACT.md first. Branch by stack and ownership as listed there.
Person 2 approves contract decisions. Main must remain demoable after Sync 1;
merge only verified green changes. Never commit secrets, raw terrain or .env.

## Evidence and limitations
All fixture values and coordinates are synthetic, never real landing-site recommendations.
Geometric-only horizon ignores local terrain. Sampled windows are estimates.
No certified safety, electrical wattage prediction or guaranteed communications.
JPL Horizons and verified NASA LOLA are intended sources, not connected yet.
Official event rules remain unverified: see docs/EVENT_RULES.md.
CI/smoke checks: S1. Deployment: S2 subject to event rules. Demo/submission: S3-S5.

## S0 startup troubleshooting and handoff
Setup launches npm through its Node CLI and starts module executables directly,
without a shell wrapper. A failed module stops its sibling and returns a nonzero status.
On this Codex host the backend was verified outside the restricted execution sandbox:
HTTP 200, exactly `{"status":"ok"}`. A restricted-runner timeout alone is not proof
of an application bug. Use an authorized normal terminal for local servers.

Windows Application Control currently blocks Rollup's native module here. Frontend
build/startup and the full one-command start are **not verified working** on this host.
Do not disable security policy. See docs/STAGE_REPORT_S0.md for the blocker and
use an approved compatible environment to complete the module startup gate.

For backend-only startup after setup:
```powershell
.venv/Scripts/python.exe -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000
```
On macOS/Linux use `.venv/bin/python` in the same command. For frontend-only startup,
run `npm --prefix frontend run dev`. The S0 frontend is intentionally an empty shell.
See docs/SYNC_0_CONFIRMATIONS.md for Person 2 decisions and each teammate's exact
acknowledgment. Startup fixes exist only on `chore/integration-devops` until integrated.

Contract v1.0 and canonical schemas: CONTRACT.md and docs/contracts/. Person 2 S0
report: docs/STAGE_REPORT_PERSON_2_S0.md. No implemented compare API is claimed.
