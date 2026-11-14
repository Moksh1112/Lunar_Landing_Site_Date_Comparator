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
frontend/ and backend/ are module handoffs; fixtures/ holds clearly synthetic proposals;
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
