"""Real compare pipeline (P2 S2.2): site -> terrain skyline -> SPICE -> windows/metrics/verdict."""
from app.compare.service import run_compare, skyline_at

__all__ = ["run_compare", "skyline_at"]
