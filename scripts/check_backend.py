"""Baseline liveness check only; not Azelux contract or science validation."""
import json
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request
from pathlib import Path

root = Path(__file__).resolve().parents[1]
# Port zero lets the OS select an unused port; parse Uvicorn's startup log.
with tempfile.TemporaryFile(mode="w+b") as log:
    process = subprocess.Popen([sys.executable, "-m", "uvicorn", "app.main:app",
        "--app-dir", str(root / "backend"), "--host", "127.0.0.1", "--port", "0"], stdout=log, stderr=log)
    try:
        import re
        deadline = time.monotonic() + 20
        while time.monotonic() < deadline:
            log.seek(0)
            output = log.read().decode(errors="replace")
            if process.poll() is not None:
                raise RuntimeError(output)
            match = re.search(r"http://127\.0\.0\.1:(\d+)", output)
            if match:
                with urllib.request.urlopen(f"http://127.0.0.1:{match[1]}/health", timeout=3) as reply:
                    payload = json.load(reply)
                    assert reply.status == 200 and payload.get("status") == "ok", payload
                print("PASS baseline backend startup and GET /health (not full Azelux contract)")
                break
            time.sleep(.1)
        else:
            raise RuntimeError("Backend startup timeout: " + output)
    finally:
        process.terminate()
        try:
            process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            process.kill()
            process.wait(timeout=5)
