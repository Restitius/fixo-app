"""FileGateway — file upload/download capability."""
from __future__ import annotations

from typing import Any, Protocol, runtime_checkable


@runtime_checkable
class FileGateway(Protocol):
    """Store and retrieve business files/documents."""

    async def upload(self, *, name: str, content: bytes, content_type: str | None = None) -> dict[str, Any]: ...
    async def download(self, file_id: str) -> bytes: ...