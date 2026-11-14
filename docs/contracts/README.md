# Validation
Install: `.venv/Scripts/python.exe -m pip install -r docs/contracts/requirements.txt`
Run from root: `.venv/Scripts/python.exe docs/contracts/validate_fixtures.py`
Use `.venv/bin/python` on POSIX. JSON Schema handles structure; CONTRACT.md also
requires cross-field checks (unique IDs, nonblank labels, calendar range/end,
sample cap/grid, provenance by source/mode, arithmetic). API owners must enforce
all those rules server-side. This fixture check is not an API conformance claim.
