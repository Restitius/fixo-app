"""Domain CLI command handlers (group='domains').

Aggregates handlers exposed by domains/*/commands/*.py as they are built.
"""
from __future__ import annotations

import argparse


def refresh_asset_values(args: argparse.Namespace) -> int:
    """Enqueue JOB-AST-REVALUE (delegates to domains/assets/jobs)."""
    raise NotImplementedError("domains.refresh-asset-values")
