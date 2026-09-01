"""Maintenance CLI command handlers (group='maintenance')."""
from __future__ import annotations

import argparse


def prune_logs(args: argparse.Namespace) -> int:
    """Delete storage/logs/YYYY/MONTH/DD folders older than retention days."""
    raise NotImplementedError("maintenance.prune-logs")


def purge_temporary(args: argparse.Namespace) -> int:
    """Clear storage/temporary contents older than a threshold."""
    raise NotImplementedError("maintenance.purge-temporary")
