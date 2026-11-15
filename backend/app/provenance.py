"""Current dataset manifest identity; an absent manifest stays explicit."""
import hashlib
from pathlib import Path


def manifest_hash(data_dir: Path) -> str | None:
    path = data_dir / 'MANIFEST.json'
    return hashlib.sha256(path.read_bytes()).hexdigest() if path.is_file() else None
