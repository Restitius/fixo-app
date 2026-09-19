"""File upload validation — FileManager (app/platform/files/file_manager.py).

FIXO-APP handles provider verification documents, dispute evidence and
request evidence — real upload paths exist (e.g. POST
/api/v1/service-requests/{request_id}/evidence). Tested directly against
FileManager rather than through the full HTTP+auth+domain-service stack,
since FileManager is the actual validate-then-persist boundary every
upload path shares.

Writing this test found a real gap: content_type is client-supplied (the
multipart request's own header) and was trusted blindly — a caller could
claim "application/pdf" for literally any bytes. Fixed alongside this
test with a magic-byte check for the three allowed types (pure stdlib,
no new dependency) rather than left as a followup, matching how the
missing security-response-headers gap was handled in the same pass.
"""
from __future__ import annotations

import pytest

from app.platform.files.file_manager import MAX_BYTES, FileManager


class _FakeBackend:
    """Records puts; never touches real storage."""
    prefix = ""

    def __init__(self) -> None:
        self.puts: list[tuple[str, bytes, str]] = []

    async def put(self, key: str, content: bytes, mime: str) -> None:
        self.puts.append((key, content, mime))

    async def delete(self, key: str) -> None:
        pass


class _FakeStorageManager:
    def __init__(self, backend: _FakeBackend) -> None:
        self._backend = backend

    async def put(self, key: str, content: bytes, mime: str) -> None:
        await self._backend.put(key, content, mime)

    async def delete(self, key: str) -> None:
        await self._backend.delete(key)


@pytest.fixture()
def manager() -> tuple[FileManager, _FakeBackend]:
    backend = _FakeBackend()
    return FileManager(_FakeStorageManager(backend)), backend


REJECTED = [
    pytest.param(
        "shell.php", b"<?php system($_GET[0]);", "application/pdf",
        "content does not match PDF magic bytes", id="php-shell-claiming-pdf",
    ),
    pytest.param(
        "fake.pdf", b"GIF89a" + b"x" * 20, "application/pdf",
        "content type mismatch — not actually a PDF", id="gif-claiming-pdf",
    ),
    pytest.param(
        "payload.exe", b"MZ\x90\x00", "image/png",
        "executable content claiming to be a PNG", id="exe-claiming-png",
    ),
    pytest.param(
        "huge.pdf", b"%PDF-1.7" + b"x" * (MAX_BYTES + 1), "application/pdf",
        "over the size limit", id="over-size-limit",
    ),
    pytest.param("empty.pdf", b"", "application/pdf", "empty file", id="empty-file"),
    pytest.param(
        "script.js", b"alert(1)", "application/javascript",
        "MIME type not in the allowlist at all", id="mime-not-allowlisted",
    ),
]


@pytest.mark.parametrize("name,content,mime,reason", REJECTED)
async def test_dangerous_uploads_are_rejected(manager, name, content, mime, reason):
    file_manager, backend = manager
    with pytest.raises(ValueError):
        await file_manager.upload(name=name, content=content, content_type=mime)
    assert backend.puts == [], f"rejected upload ({reason}) must never reach storage"


async def test_genuine_pdf_is_accepted(manager):
    file_manager, backend = manager
    meta = await file_manager.upload(
        name="licence.pdf", content=b"%PDF-1.7\n...", content_type="application/pdf",
    )
    assert meta["mime_type"] == "application/pdf"
    assert len(backend.puts) == 1


async def test_stored_key_is_not_derived_from_the_supplied_name(manager):
    """Randomised storage key, no user-controlled path — the display name
    is sanitised separately but never used to build the storage path."""
    file_manager, backend = manager
    meta = await file_manager.upload(
        name="../../etc/passwd.pdf", content=b"%PDF-1.7\n...", content_type="application/pdf",
    )
    assert "etc/passwd" not in meta["storage_key"]
    assert ".." not in meta["storage_key"]
    assert meta["storage_key"].endswith(".pdf")
