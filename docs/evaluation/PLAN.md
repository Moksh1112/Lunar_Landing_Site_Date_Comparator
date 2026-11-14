# Evaluation handoff - not yet run against a real implementation
S0: validate canonical fixture schemas and their sampling arithmetic.
S1: Person 1 checks API contract/error fixtures and full fixture journey; Persons
3/5 confirm visible SYNTHETIC/geometric labels and date-shift rendering.
S2: Person 4 saves one raw Sun/Earth query and headers, confirms selected lunar
observer and east-positive longitude convention, time scale, units and parsing;
Person 2 compares returned fields against raw precision without inventing accuracy.
Use a changed input too; live metadata alone is not scientific correctness.
Terrain: Person 6 verifies footprint/CRS/units, flat/ridge known geometry cases,
nodata handling and outside-coverage geometric-only label before terrain acceptance.
Windows: include equality, all-visible, all-hidden, sampled set, partial final
interval, missing sample and differing duration/step cases. Tolerance for serialized
summary hours is 0.000002; exact sample grid and booleans must match.
No scientific accuracy, performance, usability or source coverage metric is measured yet.
