"""ProviderMaterialsService — materials & expenses (Requirement Phase 24).

Providers record materials used during the job (item, qty, amount) and
attach purchase receipts, material photos or supplier invoices. The
booking summary of these costs can automatically be added to the final
invoice (Phase 27).
"""
from __future__ import annotations

from typing import Any

from app.shared.exceptions.hierarchy import AuthorizationError, NotFoundError

ATTACHMENT_KINDS = ("RECEIPT", "PHOTO", "INVOICE")
CURRENCIES = ("TZS", "USD", "KES", "UGX", "RWF")


class ProviderMaterialsService:
    def __init__(self, materials: Any) -> None:
        self._materials = materials

    # -- write -------------------------------------------------------------------

    async def add(
        self,
        provider_id: str,
        booking_id: str,
        item_name: str,
        quantity: float = 1,
        unit_cost: float | None = None,
        amount: float | None = None,
        currency: str = "TZS",
        note: str | None = None,
        attachment_url: str | None = None,
        attachment_kind: str | None = None,
    ) -> dict[str, Any]:
        name = str(item_name or "").strip()
        if not name:
            raise AuthorizationError("item_name is required")
        qty = float(quantity or 0)
        if qty <= 0:
            raise AuthorizationError("quantity must be greater than zero")

        cost = float(unit_cost) if unit_cost is not None else None
        if cost is not None and cost < 0:
            raise AuthorizationError("unit_cost must be zero or more")

        amt = float(amount) if amount is not None else (
            round(cost * qty, 2) if cost is not None else 0.0
        )
        if amt < 0:
            raise AuthorizationError("amount must be zero or more")

        curr_u = str(currency or "TZS").strip().upper()
        if curr_u not in CURRENCIES:
            raise AuthorizationError(
                f"currency must be one of {', '.join(CURRENCIES)}"
            )

        kind_u = str(attachment_kind).strip().upper() if attachment_kind else None
        if kind_u is not None and kind_u not in ATTACHMENT_KINDS:
            raise AuthorizationError(
                f"attachment_kind must be one of {', '.join(ATTACHMENT_KINDS)}"
            )
        if kind_u is not None and not (attachment_url or "").strip():
            raise AuthorizationError(
                "attachment_url is required when attachment_kind is set"
            )
        clean_url = attachment_url.strip() if isinstance(attachment_url, str) else None

        row = await self._materials.add(
            provider_id=provider_id,
            booking_id=booking_id,
            item_name=name,
            quantity=qty,
            unit_cost=cost,
            amount=amt,
            currency=curr_u,
            note=note,
            attachment_url=clean_url,
            attachment_kind=kind_u,
        )
        if not row:
            raise NotFoundError(f"Booking {booking_id} not found for this provider")
        return row

    # -- read --------------------------------------------------------------------

    async def list_for_booking(
        self, provider_id: str, booking_id: str
    ) -> dict[str, Any]:
        rows = await self._materials.list_for_booking(
            provider_id=provider_id, booking_id=booking_id
        )
        return {"booking_id": booking_id, "items": [dict(r) for r in rows]}

    async def summary(self, provider_id: str, booking_id: str) -> dict[str, Any]:
        rows = await self._materials.summary(
            provider_id=provider_id, booking_id=booking_id
        )
        return {
            "booking_id": booking_id,
            "summary": [
                {
                    "currency": r.get("currency"),
                    "items": int(r.get("items") or 0),
                    "total_amount": float(r.get("total_amount") or 0),
                }
                for r in rows
            ],
        }

    # -- delete --------------------------------------------------------------------

    async def delete(
        self, provider_id: str, booking_id: str, material_id: str
    ) -> dict[str, Any]:
        row = await self._materials.delete(
            provider_id=provider_id, material_id=material_id
        )
        if not row or str(row.get("booking_id")) != str(booking_id):
            raise NotFoundError(
                f"Material {material_id} not found for booking {booking_id}"
            )
        return {"material_id": material_id, "booking_id": booking_id, "deleted": True}

