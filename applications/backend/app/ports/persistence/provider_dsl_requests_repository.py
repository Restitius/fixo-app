"""ProviderDslRequestsRepository — DSL-based cancellation/rescheduling workflow (Requirement Phase 38).

Manages provider-facing DSL request rows: list with filters, fetch single,
create, update, resolve (close), and cancel. Also covers execution-log
writes/reads and provider lifetime metrics reads.

DSL kinds: cancellation, reschedule.
Statuses: open, escalated, closed, canceled.
Priorities: low, medium, high, urgent.
"""

from abc import abstractmethod
from typing import Any, Protocol


class ProviderDslRequestsRepository(Protocol):
    @abstractmethod
    async def list(
        self,
        provider_id: str,
        *,
        status: str | None = None,
        dsl_kind: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[Any]: ...

    @abstractmethod
    async def get(self, provider_id: str, *, request_id: str) -> Any | None: ...

    @abstractmethod
    async def create(
        self,
        provider_id: str,
        *,
        dsl_kind: str,
        subject_type: str,
        subject_id: str,
        title: str,
        dsl: Any,
        status: str = "open",
        priority: str = "medium",
        reason: str | None = None,
        requested_by: str,
        parent_id: str | None = None,
        root_request_id: str | None = None,
    ) -> Any | None: ...

    @abstractmethod
    async def update(
        self,
        provider_id: str,
        *,
        request_id: str,
        status: str | None = None,
        priority: str | None = None,
        reason: str | None = None,
        title: str | None = None,
        dsl: Any = None,
        resolved_by: str | None = None,
        parent_id: str | None = None,
        root_request_id: str | None = None,
    ) -> Any | None: ...

    @abstractmethod
    async def resolve(
        self, provider_id: str, *, request_id: str, resolved_by: str
    ) -> Any | None: ...

    @abstractmethod
    async def append_execution_log(
        self,
        *,
        dsl_request_id: str,
        step_order: int,
        action: str,
        status: str,
        summary: Any = None,
        error: Any = None,
    ) -> Any | None: ...

    @abstractmethod
    async def list_execution_logs(self, *, dsl_request_id: str) -> list[Any]: ...

    @abstractmethod
    async def get_metrics(self, provider_id: str, *, period: str) -> Any | None: ...
