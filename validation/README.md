# Validation evidence interface v1.0

P1-approved build-time file interface, 15 November 2026. This is not an HTTP API
or a claim that validation has passed. Schema: `validation/evidence.schema.json`.
Producers commit one JSON object per check/run in `validation/results/*.json`.
No results are supplied by this interface change.

Fields distinguish REAL/SYNTHETIC input, spot/full coverage, owner-reported versus
independently reproduced work, pass/fail/incomplete, source references, exact command
and producer commit. Numeric rows use explicit units; use null and not_evaluated
when a numeric reference is unavailable. Optional manifest/source hashes must be real
hashes. Never copy historical spot checks into a full-check claim. Full V1/V2/V4
coverage and tolerances come from the canonical TRD, not this display schema.

Frontend owner: parse this schema's required fields, render title, coverage, status,
review status, label, sources and metric rows. Reject unsupported/malformed files
with an explicit unavailable/invalid evidence state. Keep SYNTHETIC visible. A missing
file is an empty state, never a pass. Test valid real/owner-reported, synthetic,
failed/incomplete, malformed and unsupported-version inputs. Do not fabricate results.

Examples for parser tests belong with frontend tests, never in results/. A source
path can point to an existing owner report; this does not make its evidence independently
reproduced. Deploying a result requires source/evidence review, not merely schema validity.
