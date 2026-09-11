"""ProviderBillingService — final bill preview (Requirement Phase 27).

The system calculates the final service amount from: original price +
approved additional work + approved materials + taxes − discounts.
This service is the provider's **read-only** view of that calculation:

- original price: BOOKINGS.agreed_amount (quote-accepted, lifecycle-safe)
- approved additional work: SUM(APPROVED change additional_price)
- approved materials: SUM(BOOKING_MATERIALS.amount)
- taxes: the standard platform rate (18% default, overrideable per call)
- discounts: customer-side (quotes/invoices) — surfaced as 0 here

Only APPROVED changes count (the Phase 23 guard: customer decides).
Only signed-off bookings are bill-ready (CUSTOMER_CONFIRMED, Phase 26);
the preview still returns for active jobs with bill_ready=false so the
provider can track the running total before sign-off.

The provider can review the calculation but cannot alter a finalized
amount — that needs customer approval (Phase 24/25 flows).
"""
from __future__ import annotations

from typing import Any

from app.shared.exceptions.hierarchy import NotFoundError

DEFAULT_TAX_RATE = 0.18


class ProviderBillingService:
    """Domain service for the provider final-bill preview."""

    def __init__(self, billing: Any, materials: Any) -> None:
        self._billing = billing
        self._materials = materials

    # -- bill preview ------------------------------------------------------

    async def preview(
        self,
        provider_id: str,
        booking_id: str,
        tax_rate: float | None = None,
    ) -> dict[str, Any]:
        row = await self._billing.preview(
            provider_id=provider_id, booking_id=booking_id
        )
        if not row:
            raise NotFoundError(f"Booking {booking_id} not found for this provider")

        rate = self._normalise_rate(tax_rate)
        original = float(row.get("original_price") or 0)
        additional = float(row.get("approved_additional_work") or 0)
        materials_total = float(row.get("approved_materials") or 0)
        subtotal = original + additional + materials_total
        taxes = round(subtotal * rate, 2)

        changes = await self._billing.changes(
            provider_id=provider_id, booking_id=booking_id
        )
        material_lines = await self._materials.list_for_booking(
            provider_id=provider_id, booking_id=booking_id
        )

        return {
            "booking_id": str(row.get("booking_id") or ""),
            "customer_id": str(row.get("customer_id") or ""),
            "provider_id": str(row.get("provider_id") or ""),
            "booking_status": str(row.get("status") or ""),
            "bill_ready": bool(row.get("bill_ready")),
            "currency": str(row.get("currency") or "TZS"),
            "original_price": original,
            "approved_additional_work": additional,
            "approved_materials": materials_total,
            "subtotal": subtotal,
            "tax_rate": rate,
            "taxes": taxes,
            "discounts": 0.0,
            "final_amount": round(subtotal + taxes, 2),
            "approved_changes": [self._encode_change(c) for c in changes],
            "material_lines": [self._encode_material(m) for m in material_lines],
            "note": (
                "Final bill."
                if row.get("bill_ready")
                else "Running total — the bill finalises after customer sign-off."
            ),
        }

    # -- helpers -------------------------------------------------------------

    @staticmethod
    def _normalise_rate(tax_rate: float | None) -> float:
        if tax_rate is None:
            return DEFAULT_TAX_RATE
        try:
            rate = float(tax_rate)
        except (TypeError, ValueError):
            return DEFAULT_TAX_RATE
        return max(min(rate, 1.0), 0.0)

    @staticmethod
    def _encode_change(row: dict[str, Any]) -> dict[str, Any]:
        return {
            "change_id": str(row.get("change_id") or ""),
            "change_type": str(row.get("change_type") or ""),
            "reason": str(row.get("reason") or ""),
            "additional_labour": str(row.get("additional_labour") or ""),
            "additional_materials": str(row.get("additional_materials") or ""),
            "additional_time_minutes": row.get("additional_time_minutes"),
            "additional_price": float(row.get("additional_price") or 0),
            "currency": str(row.get("currency") or ""),
            "decided_at": str(row.get("decided_at") or ""),
        }

    @staticmethod
    def _encode_material(row: dict[str, Any]) -> dict[str, Any]:
        return {
            "material_id": str(row.get("material_id") or ""),
            "item_name": str(row.get("item_name") or ""),
            "quantity": float(row.get("quantity") or 0),
            "unit_cost": (
                float(row["unit_cost"]) if row.get("unit_cost") is not None else None
            ),
            "amount": float(row.get("amount") or 0),
            "currency": str(row.get("currency") or ""),
        }
