"""Tracing — span creation with trace/correlation propagation."""
from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class Span:
    name: str
    trace_id: str = ""
    span_id: str = ""
    parent_span_id: str = ""
    attributes: dict = field(default_factory=dict)
    finished: bool = False

    def finish(self) -> None:
        self.finished = True


class Tracer:
    def start_span(self, name: str, *, parent: Span | None = None, attributes: dict | None = None) -> Span:
        raise NotImplementedError("Tracer.start_span")

    def current_trace_id(self) -> str | None:
        raise NotImplementedError("Tracer.current_trace_id")
