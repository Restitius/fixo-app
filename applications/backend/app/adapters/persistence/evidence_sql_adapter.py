"""EvidenceSqlAdapter — implements EvidenceRepository via governed queries."""
from __future__ import annotations

from typing import Any

from app.platform.query.sql_query_manager import SQLQueryManager


class EvidenceQueryIds:
    ADD = "CUS.REQUEST.EVIDENCE.ADD"
    LIST = "CUS.REQUEST.EVIDENCE.LIST"
    DELETE = "CUS.REQUEST.EVIDENCE.DELETE"
    COUNT = "CUS.REQUEST.EVIDENCE.COUNT"


class EvidenceSqlAdapter:
    def __init__(self, sql_manager: SQLQueryManager) -> None:
        self._sql = sql_manager

    async def add(
        self, customer_id: str, request_id: str, meta: dict[str, Any]
    ) -> dict[str, Any] | None:
        return await self._sql.execute(
            EvidenceQueryIds.ADD,
            {"customer_id": customer_id, "request_id": request_id,
             "file_name": meta.get("file_name"),
             "mime_type": meta.get("mime_type"),
             "size_bytes": meta.get("size_bytes"),
             "storage_key": meta.get("storage_key")},
            fetch="one",
        )

    async def list(self, customer_id: str, request_id: str) -> list[dict[str, Any]]:
        rows = await self._sql.execute(
            EvidenceQueryIds.LIST,
            {"customer_id": customer_id, "request_id": request_id},
            fetch="all",
        )
        return list(rows or [])

    async def delete(
        self, customer_id: str, request_id: str, evidence_id: str
    ) -> str | None:
        row = await self._sql.execute(
            EvidenceQueryIds.DELETE,
            {"customer_id": customer_id, "request_id": request_id,
             "evidence_id": evidence_id},
            fetch="one",
        )
        return (row or {}).get("storage_key")

    async def count(self, customer_id: str, request_id: str) -> int:
        row = await self._sql.execute(
            "CUS.REQUEST.EVIDENCE.COUNT",  # registered below with list_evidence
            {"customer_id": customer_id, "request_id": request_id},
            fetch="one",
        )
        return int((row or {}).get("evidence_count") or 0)