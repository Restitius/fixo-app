"""FileManager — file upload/download orchestration (facade)."""
from __future__ import annotations

import uuid
from typing import Any

from app.infrastructure.storage.storage_manager import StorageManager

ALLOWED_MIME = {"image/jpeg": ".jpg", "image/png": ".png", "application/pdf": ".pdf"}
MAX_BYTES = 5 * 1024 * 1024  # 5 MB per file


class FileManager:
    """Validate → key-generate → persist through StorageManager."""

    def __init__(self, storage: StorageManager) -> None:
        self._storage = storage

    async def upload(
        self,
        *,
        name: str,
        content: bytes,
        content_type: str | None = None,
        folder: str = "uploads",
    ) -> dict[str, Any]:
        mime = (content_type or "").split(";")[0].strip().lower()
        ext = ALLOWED_MIME.get(mime)
        if ext is None:
            raise ValueError(f"Unsupported file type: {mime or 'unknown'}")
        if len(content) == 0:
            raise ValueError("Empty file")
        if len(content) > MAX_BYTES:
            raise ValueError("File exceeds the 5MB limit")

        safe_name = name.replace("\\", "_").replace("/", "_")[:180]
        key = f"{folder}/{uuid.uuid4().hex}{ext}"
        await self._storage.put(key, content, mime)
        return {
            "file_name": safe_name,
            "mime_type": mime,
            "size_bytes": len(content),
            "storage_key": key,
        }

    async def delete(self, storage_key: str) -> None:
        await self._storage.delete(storage_key)