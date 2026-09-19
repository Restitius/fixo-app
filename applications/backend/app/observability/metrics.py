"""Metrics — counters/histograms with Prometheus rendering (impl phase)."""
from __future__ import annotations

REQUESTS_TOTAL = "http_requests_total"
REQUEST_DURATION_MS = "http_request_duration_ms"
QUERY_DURATION_MS = "db_query_duration_ms"
INTEGRATION_DURATION_MS = "integration_duration_ms"
EVENTS_PUBLISHED_TOTAL = "events_published_total"
JOBS_EXECUTED_TOTAL = "jobs_executed_total"
NOTIFICATIONS_SENT_TOTAL = "notifications_sent_total"


class Metrics:
    """Facade over prometheus_client (or statsd) chosen at bootstrap."""

    def increment(self, name: str, labels: dict[str, str] | None = None, value: float = 1.0) -> None:
        raise NotImplementedError("Metrics.increment")

    def observe(self, name: str, value: float, labels: dict[str, str] | None = None) -> None:
        raise NotImplementedError("Metrics.observe")

    def render_prometheus(self) -> str:
        raise NotImplementedError("Metrics.render_prometheus")
