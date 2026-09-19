"""Pricing definitions — PRICE-* stable rule catalogue (base/occupancy/etc.)."""
from __future__ import annotations

from pathlib import Path

PRICING_MANIFEST_DIR: Path = Path(__file__).resolve().parent

__all__ = ["PRICING_MANIFEST_DIR"]