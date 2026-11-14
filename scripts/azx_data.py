"""Shared helpers for Azelux data downloads (P2 kernels, P3 DEMs/illumination maps).

Standard library only, so the scripts run before the backend environment exists.
- Data directory: --data-dir or AZX_DATA_DIR; must be absolute and outside cloud-synced
  folders (OneDrive, Dropbox, iCloud, Google Drive).
- Downloads resume with HTTP Range requests and are verified against pinned sizes
  (and published checksums where the source publishes them).
- data/MANIFEST.json is updated under an exclusive lock file so the kernel and DEM
  downloaders can run at the same time without losing each other's entries.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
import time
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

CLOUD_MARKERS = ("onedrive", "dropbox", "icloud", "google drive", "googledrive")
CHUNK = 1 << 20  # 1 MiB
USER_AGENT = "azelux-data-downloader/0.1 (NASA Space Apps 2026 project)"


def data_dir_from(args: argparse.Namespace) -> Path:
    raw = args.data_dir or os.environ.get("AZX_DATA_DIR", "")
    if not raw:
        sys.exit("Set AZX_DATA_DIR (or pass --data-dir) to an absolute folder outside OneDrive, e.g. C:/azelux-data")
    path = Path(raw).expanduser()
    if not path.is_absolute():
        sys.exit(f"Data directory must be absolute, got: {raw}")
    path = path.resolve()  # follow "..", junctions and symlinks before the cloud check
    parts = [p.lower() for p in path.parts]
    if any(any(part.startswith(m) for m in CLOUD_MARKERS) for part in parts) and not args.allow_cloud_dir:
        sys.exit(f"Refusing a cloud-synced data directory: {path}\n"
                 "Large rasters/kernels must not sync. Use e.g. C:/azelux-data (or pass --allow-cloud-dir).")
    path.mkdir(parents=True, exist_ok=True)
    return path


def common_args(description: str) -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=description)
    parser.add_argument("--data-dir", help="absolute data folder (default: AZX_DATA_DIR)")
    parser.add_argument("--allow-cloud-dir", action="store_true", help="allow a cloud-synced data folder")
    parser.add_argument("--dry-run", action="store_true", help="only check remote sizes; download nothing")
    return parser


def remote_size(url: str) -> int | None:
    req = urllib.request.Request(url, method="HEAD", headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=60) as reply:
        length = reply.headers.get("Content-Length")
        return int(length) if length else None


def file_hashes(path: Path) -> tuple[str, str]:
    sha, md5 = hashlib.sha256(), hashlib.md5()  # md5 only to compare with NAIF's published list
    with path.open("rb") as fh:
        for block in iter(lambda: fh.read(CHUNK), b""):
            sha.update(block)
            md5.update(block)
    return sha.hexdigest(), md5.hexdigest()


def download(url: str, dest: Path, expected_bytes: int) -> None:
    """Download url to dest, resuming a partial file; raises on size mismatch."""
    dest.parent.mkdir(parents=True, exist_ok=True)
    part = dest.with_name(dest.name + ".part")
    if dest.exists() and dest.stat().st_size == expected_bytes:
        print(f"  already complete: {dest.name} ({expected_bytes:,} bytes)")
        return
    have = part.stat().st_size if part.exists() else 0
    if have > expected_bytes:
        part.unlink()
        have = 0
    if have == expected_bytes:  # killed after the last byte but before the rename
        part.replace(dest)
        print(f"  completed earlier partial: {dest.name} ({have:,} bytes)")
        return
    headers = {"User-Agent": USER_AGENT}
    if have:
        headers["Range"] = f"bytes={have}-"
        print(f"  resuming {dest.name} at {have:,} / {expected_bytes:,} bytes")
    req = urllib.request.Request(url, headers=headers)
    started, last_print = time.monotonic(), 0.0
    with urllib.request.urlopen(req, timeout=120) as reply:
        if have and reply.status != 206:  # server ignored Range: start again
            have = 0
            mode = "wb"
        else:
            mode = "ab" if have else "wb"
        with part.open(mode) as out:
            while True:
                block = reply.read(CHUNK)
                if not block:
                    break
                out.write(block)
                have += len(block)
                now = time.monotonic()
                if now - last_print > 5:
                    rate = have / max(now - started, 1e-6) / 1e6
                    print(f"  {dest.name}: {have / 1e6:,.1f} / {expected_bytes / 1e6:,.1f} MB ({rate:.1f} MB/s)",
                          flush=True)
                    last_print = now
    if have != expected_bytes:
        raise RuntimeError(f"{dest.name}: got {have:,} bytes, expected {expected_bytes:,} (left as .part to resume)")
    part.replace(dest)
    print(f"  done: {dest.name} ({have:,} bytes)")


class ManifestLock:
    """Exclusive lock around data/MANIFEST.json updates (lock file with O_EXCL)."""

    def __init__(self, data_dir: Path, timeout_s: float = 120.0):
        self.lock = data_dir / "MANIFEST.json.lock"
        self.timeout_s = timeout_s

    def __enter__(self) -> "ManifestLock":
        deadline = time.monotonic() + self.timeout_s
        while True:
            try:
                fd = os.open(self.lock, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
                os.write(fd, str(os.getpid()).encode())
                os.close(fd)
                return self
            except FileExistsError:
                try:  # a lock older than 10 minutes was left by a killed run
                    if time.time() - self.lock.stat().st_mtime > 600:
                        self.lock.unlink(missing_ok=True)
                        continue
                except FileNotFoundError:
                    continue
                if time.monotonic() > deadline:
                    raise TimeoutError(f"Manifest lock held too long: {self.lock} (delete it if no download runs)")
                time.sleep(0.2)

    def __exit__(self, *exc: object) -> None:
        self.lock.unlink(missing_ok=True)


def update_manifest(data_dir: Path, rel_path: str, entry: dict) -> None:
    """Insert/replace one file entry in data/MANIFEST.json atomically under the lock."""
    manifest_path = data_dir / "MANIFEST.json"
    with ManifestLock(data_dir):
        manifest = {"schema": 1, "files": {}}
        if manifest_path.exists():
            manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
            manifest.setdefault("files", {})
        manifest["files"][rel_path] = entry
        manifest["updated_utc"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        tmp = manifest_path.with_suffix(".json.tmp")
        tmp.write_text(json.dumps(manifest, indent=2, sort_keys=True) + "\n", encoding="utf-8")
        tmp.replace(manifest_path)


def fetch_and_record(data_dir: Path, item: dict, dry_run: bool) -> bool:
    """item keys: rel_path, url, bytes, category, role, source, [md5], [citation]. Returns success."""
    dest = data_dir / item["rel_path"]
    print(f"- {item['rel_path']}  <- {item['url']}")
    size = remote_size(item["url"])
    if size != item["bytes"]:
        print(f"  ERROR remote size {size} differs from pinned {item['bytes']}; not downloading. Re-check the source.")
        return False
    print(f"  remote size OK: {size:,} bytes")
    if dry_run:
        return True
    download(item["url"], dest, item["bytes"])
    sha256, md5 = file_hashes(dest)
    if item.get("md5") and md5 != item["md5"]:
        dest.unlink()  # corrupt copy: remove so the next run downloads it again
        print(f"  ERROR md5 {md5} != published {item['md5']}; deleted the file, rerun to download again")
        return False
    entry = {k: v for k, v in item.items() if k not in ("rel_path",)}
    entry.update({"sha256": sha256, "md5": md5, "status": "complete",
                  "downloaded_utc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")})
    if item.get("md5"):
        entry["md5_matches_published"] = True
    update_manifest(data_dir, item["rel_path"], entry)
    print(f"  sha256 {sha256}")
    return True
