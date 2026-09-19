"""Reusable decorators.

- 'timed': measure wall-clock duration (implemented, logging-only).
- 'audited' / 'traced': pass-through markers with attachment hooks; the
  audit/observability subsystems replace the bodies during implementation.
"""
from __future__ import annotations

import functools
import logging
import time
from collections.abc import Awaitable, Callable
from typing import Any, TypeVar

logger = logging.getLogger(__name__)

F = TypeVar("F", bound=Callable[..., Any])


def timed(func: F) -> F:
    """Log execution duration (ms) at DEBUG for synchronous callables."""

    @functools.wraps(func)
    def wrapper(*args: Any, **kwargs: Any) -> Any:
        started = time.perf_counter()
        try:
            return func(*args, **kwargs)
        finally:
            elapsed_ms = (time.perf_counter() - started) * 1000
            logger.debug("timed %s took %.2fms", getattr(func, "__qualname__", func), elapsed_ms)

    return wrapper  # type: ignore[return-value]


def timed_async(func: Callable[..., Awaitable[Any]]) -> Callable[..., Awaitable[Any]]:
    """Log execution duration (ms) at DEBUG for coroutine functions."""

    @functools.wraps(func)
    async def wrapper(*args: Any, **kwargs: Any) -> Any:
        started = time.perf_counter()
        try:
            return await func(*args, **kwargs)
        finally:
            elapsed_ms = (time.perf_counter() - started) * 1000
            logger.debug("timed %s took %.2fms", getattr(func, "__qualname__", func), elapsed_ms)

    return wrapper


def audited(action: str) -> Callable[[F], F]:
    """Mark a callable as producing an audit trail entry for 'action'.

    SCAFFOLD: currently a transparent marker; the audit subsystem will wrap
    invocations to persist AuditEvents (who/what/when/screen/before/after).
    """

    def decorator(func: F) -> F:
        func.__audited_action__ = action

        @functools.wraps(func)
        def wrapper(*args: Any, **kwargs: Any) -> Any:
            # TODO(audit): emit AuditEvent(action, actor, before, after) here.
            return func(*args, **kwargs)

        return wrapper  # type: ignore[return-value]

    return decorator


def traced(span_name: str) -> Callable[[F], F]:
    """Mark a callable as opening a tracing span named 'span_name'.

    SCAFFOLD: transparent marker; observability.tracing replaces the body.
    """

    def decorator(func: F) -> F:
        func.__trace_span__ = span_name

        @functools.wraps(func)
        def wrapper(*args: Any, **kwargs: Any) -> Any:
            # TODO(observability): start/end span, attach correlation ids.
            return func(*args, **kwargs)

        return wrapper  # type: ignore[return-value]

    return decorator
