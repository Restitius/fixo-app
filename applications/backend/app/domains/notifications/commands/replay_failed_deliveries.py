"""CLI command: Re-enqueue deliveries stuck in failed state."""
from __future__ import annotations

COMMAND_NAME = "domains.replay_failed_deliveries"


def run(args=None) -> int:
    raise NotImplementedError("ReplayFailedDeliveries.run")
