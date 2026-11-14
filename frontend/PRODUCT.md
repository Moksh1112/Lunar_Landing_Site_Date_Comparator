# Azelux: product truth (frontend)

Inferred from the canonical PRD v2.0 / TRD v1.0 and the user's redesign brief (15 Nov 2026).
No separate interview was held; assumptions are marked.

## What it is

Azelux compares two lunar landing plans, A and B (site + landing date/time + mission
length). It shows, side by side, when each plan has Sun, Earth in view, and both together
over the mission, with A-minus-B deltas and a green/amber/red viability verdict against
editable thresholds. The best-date finder scores every landing day in a range and loads a
chosen day as Plan B.

## Audience and scene

Hackathon judges, students and mission-planning enthusiasts, usually on a laptop and
sometimes on a phone. The first comparison should take under 2 minutes (PRD 6). The surface
mode is Operate (a tool); Methods is Read; Report is a printable document.

## Proof and truth constraints

- Every result shows its source: ephemeris, horizon mode (terrain / coarse /
  "geometric horizon only"), DEM and step.
- SYNTHETIC data is always labelled. Mock/fixture responses are fixed and do not reflect
  the inputs.
- No safety certification, wattage prediction or guaranteed radio link.
- Validation evidence is shown with its scope (a spot check stays a spot check).
- Decorative imagery must never imply verified terrain. Terrain 3D is gated.

## Must stay

The two-plan comparison, mode presets, inline validation, map picker, thresholds and local
verdict, panorama, timeline + scrubber, countdowns, glossary, Simple/Expert, exports,
print report, best-date handoff, Methods evidence and keyboard access.

## Success (assumed)

On first view, a visitor understands that this tool answers "which landing plan keeps the
Sun and Earth in view longer, and when?", and can see it answered for the loaded example
without reading a manual.
