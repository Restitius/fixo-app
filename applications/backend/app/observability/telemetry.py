"""TelemetryExporter — ships metric/trace batches to collectors."""
from __future__ import annotations


class TelemetryExporter:
    async def export(self, batch: list[dict]) -> int:
        """Export one batch; return accepted count."""
        raise NotImplementedError("TelemetryExporter.export")
