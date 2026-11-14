"""Check baseline Python syntax without writing bytecode into source folders."""
from pathlib import Path
root = Path(__file__).resolve().parents[1]
paths = sorted((root / "backend/app").rglob("*.py"))
for path in paths:
    compile(path.read_bytes(), str(path), "exec")
print(f"PASS baseline Python syntax ({len(paths)} files, no bytecode written)")
