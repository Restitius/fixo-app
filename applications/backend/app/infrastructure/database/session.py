"""SessionProvider — async session / unit-of-work acquisition."""
from __future__ import annotations

from types import TracebackType
from typing import Any


class SessionProvider:
    """Yields scoped sessions bound to a specific logical database."""

    def __init__(self, manager: Any, database_id: str = "PRIMARY_DB") -> None:
        self._manager = manager
        self._database_id = database_id

    async def session(self) -> Any:
        """Acquire a new session (caller closes via transaction manager)."""
        raise NotImplementedError("SessionProvider.session")

    async def __aenter__(self) -> Any:
        raise NotImplementedError("SessionProvider.__aenter__")

    async def __aexit__(
        self,
        exc_type: type[BaseException] | None,
        exc: BaseException | None,
        tb: TracebackType | None,
    ) -> None:
        raise NotImplementedError("SessionProvider.__aexit__")
