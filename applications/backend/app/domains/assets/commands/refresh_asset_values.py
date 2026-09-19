"""CLI command: refresh cached asset values (registered under domains group)."""
from __future__ import annotations

COMMAND_NAME = "domains.refresh-asset-values"


def run(args=None) -> int:
    """Enqueue JOB-AST-REVALUE via the JobDispatcher."""
    raise NotImplementedError("refresh_asset_values.run")
