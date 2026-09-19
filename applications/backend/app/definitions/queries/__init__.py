"""Query definitions — canonical pointer package.

The SQL manifest + governed *.sql files live at `app/queries/` (the existing
arrangement enforced by README rule #1: NO SQL outside app/queries/**.sql).
This package is the *definitions* boundary: registries/startup resolve the
manifest through here so application code never needs to know where SQL lives.
"""
from __future__ import annotations

from pathlib import Path

QUERY_MANIFEST_DIR: Path = Path(__file__).resolve().parents[2] / "queries"
QUERY_MANIFEST_PATH: Path = QUERY_MANIFEST_DIR / "registry.yaml"

__all__ = ["QUERY_MANIFEST_DIR", "QUERY_MANIFEST_PATH"]