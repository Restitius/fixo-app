"""Notification definitions — NTF-* catalogue with template/channel policy."""
from __future__ import annotations

from pathlib import Path

NOTIFICATION_MANIFEST_DIR: Path = Path(__file__).resolve().parent

__all__ = ["NOTIFICATION_MANIFEST_DIR"]