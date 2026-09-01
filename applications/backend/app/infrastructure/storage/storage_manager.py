"""StorageManager — routes keys to the right backend by prefix."""
from __future__ import annotations

from typing import Any


class StorageManager:
    """Register named backends; route operations by longest prefix match."""

    def __init__(self) -> None:
        self._backends: list[tuple[str, Any]] = []  # ordered, first match wins
        self._default: Any = None

    def register(self, name: str, backend: Any, *, default: bool = False) -> None:
        setattr(backend, "backend_name", name)
        if default:
            self._default = backend
        else:
            self._backends.append((name, backend))

    def _prefix_backends(self) -> list[tuple[str, Any]]:
        return [(n, b) for n, b in self._backends if getattr(b, "prefix", None)]

    def backend_for(self, key: str) -> Any:
        for _name, backend in self._prefix_backends():
            if key.startswith(backend.prefix):
                return backend
        if self._default is not None:
            return self._default
        if self._backends:
            return self._backends[0][1]
        raise LookupError("no storage backend registered")

    async def put(self, key: str, data: bytes, content_type: str | None = None) -> str:
        return await self.backend_for(key).put(key, data, content_type)

    async def get(self, key: str) -> bytes:
        return await self.backend_for(key).get(key)

    async def delete(self, key: str) -> None:
        await self.backend_for(key).delete(key)
