"""Permission definitions — policy catalogue (roles -> permissions)."""
from __future__ import annotations

from pathlib import Path

PERMISSION_MANIFEST_DIR: Path = Path(__file__).resolve().parent

__all__ = ["PERMISSION_MANIFEST_DIR"]