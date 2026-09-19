#!/usr/bin/env python3
"""scripts/check-migration-safety.py

Fails when a migration added in this pull request contains a destructive
operation and the pull request body does not contain a rollback plan.

Adapted to FIXO-APP's real migration convention: plain raw op.execute()
SQL under applications/backend/migrations/versions/ (Alembic), not
SQLAlchemy Core op.drop_column()/op.alter_column() calls — this repo
never uses those helpers, so the checks below match the raw-SQL DDL
keywords actually used (see e.g. migrations/versions/0072_*.py).
"""
from __future__ import annotations

import argparse
import os
import re
import subprocess
import sys

MIGRATIONS_DIR = "applications/backend/migrations/versions/"

DESTRUCTIVE = {
    r"\bDROP\s+TABLE\b": "DROP TABLE",
    r"\bDROP\s+COLUMN\b": "DROP COLUMN",
    r"\bRENAME\s+COLUMN\b": "RENAME COLUMN",
    r"\bRENAME\s+TO\b": "RENAME TABLE",
    r"\bALTER\s+COLUMN\b.*\bTYPE\b": "TYPE CHANGE",
    r"\bSET\s+NOT\s+NULL\b": "NOT NULL on existing column",
    r"\bTRUNCATE\b": "TRUNCATE",
}

LOCKING_INDEX = re.compile(r"CREATE\s+INDEX(?!\s+CONCURRENTLY)", re.I)


def changed_migrations(base: str) -> list[str]:
    out = subprocess.run(
        ["git", "diff", "--name-only", "--diff-filter=A", f"{base}...HEAD",
         "--", MIGRATIONS_DIR],
        capture_output=True, text=True, check=True).stdout
    return [line for line in out.splitlines() if line.endswith(".py")]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base", required=True)
    args = parser.parse_args()

    body = os.environ.get("PR_BODY", "")
    has_plan = "### Rollback plan" in body and len(
        body.split("### Rollback plan", 1)[1].strip()) > 40

    problems: list[str] = []
    for path in changed_migrations(args.base):
        text = open(path, encoding="utf-8").read()

        for pattern, label in DESTRUCTIVE.items():
            if re.search(pattern, text, re.I) and not has_plan:
                problems.append(f"{path}: {label} without a rollback plan in the PR body")

        if LOCKING_INDEX.search(text):
            problems.append(f"{path}: CREATE INDEX without CONCURRENTLY locks writes")

        if "def downgrade" in text and re.search(r"def downgrade\s*\(\s*\)\s*->\s*None:\s*\n\s*pass\b", text):
            problems.append(f"{path}: empty downgrade(); state explicitly that it is one-way")

    for problem in problems:
        print("BLOCKED:", problem)
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
