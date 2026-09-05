"""ProviderVerificationSqlAdapter — implements ProviderVerificationRepository via governed queries.

This is the ONLY place PRV.VER.* query IDs appear.
"""
from __future__ import annotations

from datetime import date, datetime
from typing import Any

from sqlalchemy.exc import IntegrityError

from app.platform.query.sql_query_manager import SQLQueryManager
from app.shared.exceptions.hierarchy import ConflictError


class ProviderVerificationQueryIds:
    DOC_TYPES = "PRV.VER.DOC.TYPES"
    DOCS_LIST = "PRV.VER.DOCS.LIST"
    DOC_ADD = "PRV.VER.DOC.ADD"
    DOC_DELETE = "PRV.VER.DOC.DELETE"
    STATUS = "PRV.VER.STATUS"
    SUBMIT = "PRV.VER.SUBMIT"
    DOC_REVIEW = "PRV.VER.DOC.REVIEW"
    PROVIDER_STATUS_SET = "PRV.VER.PROVIDER.STATUS.SET"


def _as_date(value: Any) -> date | None:
    """asyncpg binds native date objects for DATE columns (Phase 3 lesson)."""
    if value is None or isinstance(value, date):
        return value
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, str) and value.strip():
        return date.fromisoformat(value.strip())
    return None


class ProviderVerificationSqlAdapter:
    """Implements ProviderVerificationRepository.

    add_document() translates the active-document unique index
    (UX_PROVIDER_VER_DOCS_ACTIVE) into ConflictError: re-verification is
    withdraw-then-upload, never a silent overwrite.
    """

    def __init__(self, sql_manager: SQLQueryManager) -> None:
        self._sql = sql_manager

    async def doc_types(self) -> list[dict[str, Any]]:
        return await self._sql.execute(ProviderVerificationQueryIds.DOC_TYPES, {}) or []

    async def list_documents(self, provider_id: str) -> list[dict[str, Any]]:
        return await self._sql.execute(
            ProviderVerificationQueryIds.DOCS_LIST, {"user_id": provider_id}
        ) or []

    async def add_document(
        self,
        provider_id: str,
        doc_type: str,
        front_image_url: str,
        *,
        back_image_url: str | None = None,
        doc_number: str | None = None,
        issue_date: date | None = None,
        expiry_date: date | None = None,
    ) -> Any | None:
        try:
            return await self._sql.execute(
                ProviderVerificationQueryIds.DOC_ADD,
                {
                    "user_id": provider_id,
                    "doc_type": doc_type,
                    "doc_number": doc_number,
                    "front_image_url": front_image_url,
                    "back_image_url": back_image_url,
                    "issue_date": _as_date(issue_date),
                    "expiry_date": _as_date(expiry_date),
                },
                fetch="one",
            )
        except IntegrityError as exc:
            # One active document per (provider, doc_type): withdraw first.
            raise ConflictError(
                f"An active '{doc_type}' document already exists — withdraw it before uploading a replacement",
            ) from exc

    async def delete_document(self, provider_id: str, doc_id: str) -> Any | None:
        return await self._sql.execute(
            ProviderVerificationQueryIds.DOC_DELETE,
            {"user_id": provider_id, "doc_id": doc_id},
            fetch="one",
        )

    async def status_aggregate(self, provider_id: str) -> Any | None:
        return await self._sql.execute(
            ProviderVerificationQueryIds.STATUS, {"user_id": provider_id}, fetch="one"
        )

    async def submit(self, provider_id: str) -> Any | None:
        return await self._sql.execute(
            ProviderVerificationQueryIds.SUBMIT, {"user_id": provider_id}, fetch="one"
        )

    async def review_document(
        self,
        doc_id: str,
        reviewer_id: str,
        decision: str,
        review_notes: str | None,
    ) -> Any | None:
        return await self._sql.execute(
            ProviderVerificationQueryIds.DOC_REVIEW,
            {
                "doc_id": doc_id,
                "reviewer_id": reviewer_id,
                "decision": decision,
                "review_notes": review_notes,
            },
            fetch="one",
        )

    async def set_provider_status(self, provider_id: str, status: str) -> Any | None:
        return await self._sql.execute(
            ProviderVerificationQueryIds.PROVIDER_STATUS_SET,
            {"user_id": provider_id, "status": status},
            fetch="one",
        )
