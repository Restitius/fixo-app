"""TransactionManager — explicit unit-of-work boundaries.

Usage intent::

    async with transactions.transaction():
        await executor.execute("ASSET.CREATE", params)
        await executor.execute("ACTIVITY.WRITE", params)
    # commit on success, rollback on any exception
"""
from __future__ import annotations

from types import TracebackType
from typing import Any


class TransactionManager:
    """Begin/commit/rollback across one or more registered databases."""

    def __init__(self, manager: Any) -> None:
        self._manager = manager

    async def begin(self, database_id: str = "PRIMARY_DB") -> Any:
        raise NotImplementedError("TransactionManager.begin")

    async def commit(self, handle: Any) -> None:
        raise NotImplementedError("TransactionManager.commit")

    async def rollback(self, handle: Any) -> None:
        raise NotImplementedError("TransactionManager.rollback")

    def transaction(self, database_id: str = "PRIMARY_DB") -> _TransactionScope:
        return _TransactionScope(self, database_id)


class _TransactionScope:
    """Async context manager returned by TransactionManager.transaction()."""

    def __init__(self, tm: TransactionManager, database_id: str) -> None:
        self._tm = tm
        self._database_id = database_id
        self._handle: Any = None

    async def __aenter__(self) -> Any:
        self._handle = await self._tm.begin(self._database_id)
        return self._handle

    async def __aexit__(
        self,
        exc_type: type[BaseException] | None,
        exc: BaseException | None,
        tb: TracebackType | None,
    ) -> None:
        if exc_type is None:
            await self._tm.commit(self._handle)
        else:
            await self._tm.rollback(self._handle)
