"""Workflow definitions — WF-* state-machine catalogue."""
from __future__ import annotations

from pathlib import Path

WORKFLOW_MANIFEST_DIR: Path = Path(__file__).resolve().parent

__all__ = ["WORKFLOW_MANIFEST_DIR"]