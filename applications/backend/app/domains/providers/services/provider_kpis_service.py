"""ProviderKpisService — provider performance KPIs (Requirement Phase 34).

Exposes provider-facing KPI visibility: list KPIs by period (weekly, monthly,
quarterly, yearly) and return a totals summary across all periods.

KPI periods: weekly, monthly, quarterly, yearly.

Read-only in this phase — no KPI calculation or ingestion.
"""

from typing import Any

from app.shared.exceptions.hierarchy import ValidationError


# -- pagination defaults ----------------------------------------------------------
DEFAULT_LIMIT = 50
MAX_LIMIT = 100

# -- KPI period values ------------------------------------------------------------
KPI_PERIODS = frozenset({"weekly", "monthly", "quarterly", "yearly"})


class ProviderKpisService:
    """Domain service for provider performance KPI read operations."""

    def __init__(self, kpis: Any) -> None:
        self._kpis = kpis

    # -- kpis -----------------------------------------------------------------------

    async def list_kpis(
        self,
        provider_id: str,
        *,
        period: str | None = None,
        limit: int = DEFAULT_LIMIT,
        offset: int = 0,
    ) -> dict[str, Any]:
        """List provider KPIs, optionally filtered by period.

        Args:
            period: filter by KPI period (weekly|monthly|quarterly|yearly).
                None means no period filter.
            limit: max rows to return (1-100).
            offset: rows to skip for pagination.

        Returns a structured dict with KPIs list and pagination metadata.
        """
        if period is not None and period not in KPI_PERIODS:
            raise ValidationError(
                f"period must be one of: {', '.join(sorted(KPI_PERIODS))}"
            )
        if limit < 1 or limit > MAX_LIMIT:
            raise ValidationError(f"limit must be between 1 and {MAX_LIMIT}")
        if offset < 0:
            raise ValidationError("offset must be >= 0")
        rows = await self._kpis.list(provider_id, period=period, limit=limit, offset=offset)
        return {
            "kpis": [self._encode_kpi(r) for r in rows],
            "limit": limit,
            "offset": offset,
        }

    async def get_summary(self, provider_id: str) -> dict[str, Any]:
        """Return provider KPI totals across all periods."""
        row = await self._kpis.summary(provider_id)
        if row is None:
            return {
                "avg_completion_rate": 0,
                "avg_on_time_rate": 0,
                "avg_rating": 0,
                "avg_response_time_minutes": 0,
                "total_jobs_completed": 0,
                "total_jobs_cancelled": 0,
                "total_revenue": 0,
                "periods_count": 0,
            }
        return self._encode_summary(row)

    # -- encoding helpers -----------------------------------------------------------

    @staticmethod
    def _encode_kpi(row: dict[str, Any]) -> dict[str, Any]:
        """Shape a KPI row for API output."""
        return {
            "id": str(row.get("id") or ""),
            "period": str(row.get("period") or ""),
            "period_start": str(row.get("period_start") or ""),
            "period_end": str(row.get("period_end") or ""),
            "completion_rate": float(row.get("completion_rate") or 0),
            "on_time_rate": float(row.get("on_time_rate") or 0),
            "avg_rating": float(row.get("avg_rating") or 0),
            "response_time_minutes": int(row.get("response_time_minutes") or 0),
            "jobs_completed": int(row.get("jobs_completed") or 0),
            "jobs_cancelled": int(row.get("jobs_cancelled") or 0),
            "revenue": float(row.get("revenue") or 0),
        }

    @staticmethod
    def _encode_summary(row: dict[str, Any]) -> dict[str, Any]:
        """Shape a KPI summary row for API output."""
        return {
            "avg_completion_rate": float(row.get("avg_completion_rate") or 0),
            "avg_on_time_rate": float(row.get("avg_on_time_rate") or 0),
            "avg_rating": float(row.get("avg_rating") or 0),
            "avg_response_time_minutes": float(row.get("avg_response_time_minutes") or 0),
            "total_jobs_completed": int(row.get("total_jobs_completed") or 0),
            "total_jobs_cancelled": int(row.get("total_jobs_cancelled") or 0),
            "total_revenue": float(row.get("total_revenue") or 0),
            "periods_count": int(row.get("periods_count") or 0),
        }