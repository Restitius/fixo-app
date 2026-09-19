"""ProviderCommissionService — commission & fees (Requirement Phase 31).

Providers should clearly understand platform deductions. This service provides:

  - current commission + tax rate configuration for a provider and currency,
  - a commission/fee application record: gross, platform commission, tax on
    the commission, and the resulting net amount,
  - provider commission/fee history and totals.

Commission is applied to the gross amount; tax is applied to the commission;
net is gross minus commission minus tax. All amounts stay in the same currency
per request. No background tasks are used in this phase — fee application is
synchronous through the service layer.
"""
from __future__ import annotations

from decimal import ROUND_HALF_UP, Decimal
from typing import Any

from app.shared.exceptions.hierarchy import NotFoundError, ValidationError

COMMISSION_RATE_MAX = Decimal("1.0000")
TAX_RATE_MAX = Decimal("1.0000")


def _money(value: float | Decimal | None) -> Decimal:
    return Decimal(str(value or 0)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def compute_commission_and_tax(
    gross: float | Decimal,
    commission_rate: float | Decimal,
    tax_on_commission: float | Decimal,
) -> dict[str, Decimal]:
    """Compute commission, tax and net from a gross amount and rates.

    Commission = gross * commission_rate
    Tax        = commission * tax_on_commission
    Net        = gross - commission - tax
    """
    gross = _money(gross)
    rate = Decimal(str(commission_rate or 0)).quantize(
        Decimal("0.0001"), rounding=ROUND_HALF_UP
    )
    tax_rate = Decimal(str(tax_on_commission or 0)).quantize(
        Decimal("0.0001"), rounding=ROUND_HALF_UP
    )

    if not (rate >= 0 and rate <= COMMISSION_RATE_MAX):
        raise ValidationError(
            "commission_rate must be between 0 and 1 inclusive"
        )
    if not (tax_rate >= 0 and tax_rate <= TAX_RATE_MAX):
        raise ValidationError("tax_on_commission must be between 0 and 1 inclusive")

    commission = (gross * rate).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    tax = (commission * tax_rate).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    net = (gross - commission - tax).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    return {
        "gross": gross,
        "commission": commission,
        "tax": tax,
        "net": net,
    }


class ProviderCommissionService:
    """Domain service for provider commission/fee operations."""

    def __init__(self, commissions: Any) -> None:
        self._commissions = commissions

    async def current_rate(self, provider_id: str, currency: str) -> dict[str, Any]:
        row = await self._commissions.rate(provider_id, currency)
        if not row:
            raise NotFoundError("Commission rate configuration not found")
        return {
            "rate_id": str(row.get("rate_id") or ""),
            "provider_id": str(row.get("provider_id") or ""),
            "currency": str(row.get("currency") or "TZS"),
            "commission_rate": float(row.get("commission_rate") or 0),
            "tax_on_commission": float(row.get("tax_on_commission") or 0),
            "is_active": bool(row.get("is_active") is not False),
        }

    async def apply(
        self,
        provider_id: str,
        *,
        currency: str = "TZS",
        gross_amount: float,
        commission_rate: float | None = None,
        tax_on_commission: float | None = None,
        reference_type: str | None = None,
        reference_id: str | None = None,
        description: str | None = None,
    ) -> dict[str, Any]:
        currency = (currency or "TZS").strip().upper()
        if len(currency) != 3:
            raise ValidationError("currency must be a 3-letter code")

        gross = _money(gross_amount)
        if gross <= 0:
            raise ValidationError("gross_amount must be greater than 0")

        if commission_rate is None or tax_on_commission is None:
            cfg = await self._commissions.rate(provider_id, currency)
            if not cfg:
                raise NotFoundError("Commission rate configuration not found")
            commission_rate = float(cfg.get("commission_rate") or 0)
            tax_on_commission = float(cfg.get("tax_on_commission") or 0)

        computed = compute_commission_and_tax(gross, commission_rate, tax_on_commission)

        row = await self._commissions.apply_fee(
            provider_id,
            currency=currency,
            gross_amount=float(computed["gross"]),
            commission_amount=float(computed["commission"]),
            tax_amount=float(computed["tax"]),
            net_amount=float(computed["net"]),
            reference_type=reference_type,
            reference_id=reference_id,
            description=description,
        )
        if not row:
            raise ValidationError("Failed to record commission/fee application")
        return self._encode_fee(row)

    async def list_fees(
        self,
        provider_id: str,
        *,
        status: str | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> dict[str, Any]:
        if limit < 1 or limit > 100:
            raise ValidationError("limit must be between 1 and 100")
        if offset < 0:
            raise ValidationError("offset must be >= 0")
        rows = await self._commissions.list_fees(
            provider_id, status=status, limit=limit, offset=offset
        )
        return {
            "fees": [self._encode_fee(r) for r in rows],
            "limit": limit,
            "offset": offset,
        }

    async def fee_summary(self, provider_id: str) -> dict[str, Any]:
        row = await self._commissions.fee_summary(provider_id)
        if not row:
            return {
                "total_gross": 0.0,
                "total_commission": 0.0,
                "total_tax": 0.0,
                "total_net": 0.0,
                "fee_count": 0,
            }
        return {
            "total_gross": float(row.get("total_gross") or 0),
            "total_commission": float(row.get("total_commission") or 0),
            "total_tax": float(row.get("total_tax") or 0),
            "total_net": float(row.get("total_net") or 0),
            "fee_count": int(row.get("fee_count") or 0),
        }

    @staticmethod
    def _encode_fee(row: dict[str, Any]) -> dict[str, Any]:
        return {
            "fee_id": str(row.get("fee_id") or ""),
            "provider_id": str(row.get("provider_id") or ""),
            "currency": str(row.get("currency") or "TZS"),
            "gross_amount": float(row.get("gross_amount") or 0),
            "commission_amount": float(row.get("commission_amount") or 0),
            "tax_amount": float(row.get("tax_amount") or 0),
            "net_amount": float(row.get("net_amount") or 0),
            "status": str(row.get("status") or "APPLIED"),
            "reference_type": row.get("reference_type"),
            "reference_id": (
                str(row["reference_id"]) if row.get("reference_id") else None
            ),
            "description": row.get("description"),
            "created_at": str(row.get("created_at") or ""),
        }

