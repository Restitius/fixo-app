"""Integration definitions — INT-* declarative catalogue (external/internal)."""
from __future__ import annotations

from pathlib import Path

INTEGRATION_MANIFEST_DIR: Path = Path(__file__).resolve().parent

__all__ = ["INTEGRATION_MANIFEST_DIR"]