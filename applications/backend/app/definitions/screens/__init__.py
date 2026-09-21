"""Screen definitions — SCR-* catalogue (traceability chain)."""

from pathlib import Path

SCREEN_MANIFEST_DIR: Path = Path(__file__).resolve().parent

__all__ = ["SCREEN_MANIFEST_DIR"]