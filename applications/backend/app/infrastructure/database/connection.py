"""ConnectionFactory — builds an async engine from a database URL."""
from __future__ import annotations

import logging

from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine

logger = logging.getLogger(__name__)


class ConnectionFactory:
    # Encapsulates driver-specific engine creation behind one interface.

    def __init__(
        self,
        url: str,
        *,
        pool_size: int = 5,
        max_overflow: int = 10,
        pool_timeout_seconds: int = 30,
        echo: bool = False,
    ) -> None:
        self.url = url
        self.pool_size = pool_size
        self.max_overflow = max_overflow
        self.pool_timeout_seconds = pool_timeout_seconds
        self.echo = echo

    def create_engine(self) -> AsyncEngine:
        # SQLite has no pool overflow knobs; keep defaults there.
        kwargs: dict = {"echo": self.echo, "future": True}
        if not self.url.startswith("sqlite"):
            kwargs.update(
                pool_size=self.pool_size,
                max_overflow=self.max_overflow,
                pool_timeout=self.pool_timeout_seconds,
                pool_pre_ping=True,
            )
        logger.info("engine created for %s", self.url.split("://")[0])
        return create_async_engine(self.url, **kwargs)
