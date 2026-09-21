"""Local filesystem storage backend (implements app.contracts.storage.Storage)."""
from __future__ import annotations

import asyncio
from pathlib import Path


class LocalStorage:
    """Stores objects under a root directory (storage/uploads, generated, ...)."""

    def __init__(self, root: str | Path) -> None:
        self.root = Path(root)

    def _path(self, key: str) -> Path:
        target = (self.root / key).resolve()
        if not str(target).startswith(str(self.root.resolve())):
            raise ValueError("storage key escapes root")
        return target

    async def put(self, key: str, data: bytes, content_type: str | None = None) -> str:
        target = self._path(key)
        # File IO off the event loop; mkdir handles nested evidence folders.
        await asyncio.to_thread(lambda: (target.parent.mkdir(parents=True, exist_ok=True),
                                         target.write_bytes(data)))
        return key

    async def get(self, key: str) -> bytes:
        target = self._path(key)
        if not target.is_file():
            raise FileNotFoundError(key)
        return await asyncio.to_thread(target.read_bytes)

    async def delete(self, key: str) -> None:
        target = self._path(key)
        if target.is_file():
            await asyncio.to_thread(target.unlink)

    def url(self, key: str, expires_in: int = 3600) -> str:
        return str(self._path(key))
