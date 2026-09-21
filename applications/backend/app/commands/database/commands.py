"""Database CLI command handlers (registered under group='database')."""
from __future__ import annotations

import argparse


def migrate_status(args: argparse.Namespace) -> int:
    """Report applied/pending migrations (alembic bridge in impl phase)."""
    raise NotImplementedError("database.status")


def seed(args: argparse.Namespace) -> int:
    """Load reference/seed data via governed insert queries."""
    raise NotImplementedError("database.seed")
