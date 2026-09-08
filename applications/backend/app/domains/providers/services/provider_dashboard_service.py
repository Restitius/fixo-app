"""ProviderDashboardService — attention items, stats, quick actions (Provider Req Phase 10).

Read-only composition over the governed PRV.DASH.* aggregations: the four
primary statistics (today's jobs, pending requests, earnings, rating), the
"What requires my attention today?" list (derived from the live setup state
of Phases 2-9), today's schedule and upcoming jobs, the earnings snapshot
(today/week/month) and performance rates. Acceptance rate and response time
need the provider-response ledger that Phase 11 introduces, so they are
reported as ``None`` until then.
"""
from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Any
from uuid import UUID

# Booking status groups (final CK_BOOKING_STATUS enum, migration 0011)
_ACTIVE_STATUSES = (
    "ON_THE_WAY", "ARRIVED", "STARTED", "IN_PROGRESS", "COMPLETION_REQUESTED",
)
_COMPLETED_STATUSES = ("CUSTOMER_CONFIRMED", "PAID", "CLOSED")


class ProviderDashboardService:
    """Composes the dashboard payload from setup state and marketplace data."""

    def __init__(self, dashboard: Any) -> None:
        self._dashboard = dashboard

    # -- queries ---------------------------------------------------------------

    async def overview(self, provider_id: str) -> dict[str, Any]:
        """The main dashboard payload: stats, attention items, quick actions."""
        stats_row = await self._dashboard.stats(provider_id)
        stats = self._json_safe(dict(stats_row)) if stats_row is not None else {}
        setup_row = await self._dashboard.setup(provider_id)
        setup = self._json_safe(dict(setup_row)) if setup_row is not None else {}
        earnings_row = await self._dashboard.earnings(provider_id)
        earnings = self._json_safe(dict(earnings_row)) if earnings_row is not None else {}

        return {
            "stats": {
                "todays_jobs": int(stats.get("todays_jobs") or 0),
                "pending_requests": int(stats.get("pending_requests") or 0),
                "active_jobs": int(stats.get("active_jobs") or 0),
                "earnings_today": earnings.get("collected_today", 0),
                "currency": earnings.get("currency", "TZS"),
                "rating_avg": stats.get("rating_avg"),
                "rating_count": int(stats.get("rating_count") or 0),
                "jobs_completed": int(stats.get("jobs_completed") or 0),
            },
            "setup": setup,
            "attention": self._attention(setup),
            "quick_actions": self._quick_actions(),
        }

    async def schedule(self, provider_id: str) -> dict[str, Any]:
        """Today's jobs plus the upcoming 7 days."""
        rows = await self._dashboard.upcoming(provider_id)
        items = [self._json_safe(dict(row)) for row in rows]
        today = date.today()
        return {
            "today": [i for i in items if i.get("scheduled_date") == today.isoformat()],
            "upcoming": [i for i in items if i.get("scheduled_date") != today.isoformat()],
        }

    async def earnings(self, provider_id: str) -> dict[str, Any]:
        """Collected/billed snapshot for today, this week and this month."""
        row = await self._dashboard.earnings(provider_id)
        return self._json_safe(dict(row)) if row is not None else {}

    async def performance(self, provider_id: str) -> dict[str, Any]:
        """Acceptance/completion/cancellation rates + response time."""
        row = await self._dashboard.performance(provider_id)
        data = self._json_safe(dict(row)) if row is not None else {}
        total = int(data.get("total_bookings") or 0)
        cancelled = int(data.get("cancelled_bookings") or 0)
        completed = int(data.get("completed_bookings") or 0)
        decided = total - cancelled
        return {
            "total_bookings": total,
            "completed_bookings": completed,
            "cancelled_bookings": cancelled,
            "completion_rate": round(completed / decided, 4) if decided > 0 else None,
            "cancellation_rate": round(cancelled / total, 4) if total > 0 else None,
            # Requires the provider-response ledger (Phase 11 incoming requests).
            "acceptance_rate": None,
            "response_time_minutes": None,
        }

    # -- attention list ----------------------------------------------------------

    @staticmethod
    def _item(code: str, severity: str, message: str, action: str) -> dict[str, str]:
        return {"code": code, "severity": severity, "message": message, "action": action}

    def _attention(self, setup: dict[str, Any]) -> list[dict[str, str]]:
        """'What requires my attention today?' — derived from live setup state."""
        items: list[dict[str, str]] = []

        incomplete = int(setup.get("onboarding_incomplete") or 0)
        if incomplete:
            items.append(self._item(
                "ONBOARDING_INCOMPLETE", "warning",
                f"Finish onboarding — {incomplete} required step(s) left",
                "/api/v1/providers/onboarding",
            ))

        verification = setup.get("verification_status") or "NOT_SUBMITTED"
        if verification == "NOT_SUBMITTED":
            items.append(self._item(
                "VERIFICATION_NOT_SUBMITTED", "warning",
                "Submit your identity documents for verification",
                "/api/v1/providers/verification/documents",
            ))
        elif verification == "REJECTED":
            items.append(self._item(
                "VERIFICATION_REJECTED", "critical",
                "Verification was rejected — re-submit your documents",
                "/api/v1/providers/verification/documents",
            ))
        elif setup.get("docs_awaiting_review"):
            items.append(self._item(
                "VERIFICATION_PENDING", "info",
                "Verification under review by the platform",
                "/api/v1/providers/verification/status",
            ))

        if (setup.get("account_type") == "BUSINESS"
                and not setup.get("has_business_profile")):
            items.append(self._item(
                "BUSINESS_PROFILE_MISSING", "warning",
                "Complete your business profile",
                "/api/v1/providers/business",
            ))

        services_total = int(setup.get("services_total") or 0)
        if services_total == 0:
            items.append(self._item(
                "NO_SERVICES", "warning",
                "Configure the services you offer",
                "/api/v1/providers/services",
            ))
        else:
            without_pricing = int(setup.get("services_without_pricing") or 0)
            if without_pricing:
                items.append(self._item(
                    "SERVICES_WITHOUT_PRICING", "warning",
                    f"{without_pricing} service(s) have no pricing yet",
                    "/api/v1/providers/pricing",
                ))
            if int(setup.get("services_approved") or 0) == 0:
                items.append(self._item(
                    "NO_APPROVED_SERVICES", "info",
                    "No approved services yet — you cannot receive requests "
                    "until the platform approves one",
                    "/api/v1/providers/services",
                ))

        if int(setup.get("area_entries") or 0) == 0:
            items.append(self._item(
                "NO_SERVICE_AREAS", "warning",
                "Define where you operate (areas or a travel radius)",
                "/api/v1/providers/areas",
            ))

        if int(setup.get("available_days") or 0) == 0:
            items.append(self._item(
                "NO_WORKING_HOURS", "warning",
                "Add your working hours so customers know your schedule",
                "/api/v1/providers/availability/hours",
            ))

        if setup.get("is_online") is not True:
            items.append(self._item(
                "OFFLINE", "info",
                "You are offline — go online to receive immediate jobs",
                "/api/v1/providers/availability/settings",
            ))

        return items

    @staticmethod
    def _quick_actions() -> list[dict[str, str]]:
        """The requirement's quick actions, mapped to backend capabilities."""
        return [
            {"code": "GO_ONLINE", "label": "Go online", "method": "PUT",
             "path": "/api/v1/providers/availability/settings"},
            {"code": "VIEW_REQUESTS", "label": "View requests", "method": "GET",
             "path": "/api/v1/providers/requests"},
            {"code": "ADD_AVAILABILITY", "label": "Add availability", "method": "PUT",
             "path": "/api/v1/providers/availability/hours/0"},
            {"code": "VIEW_EARNINGS", "label": "View earnings", "method": "GET",
             "path": "/api/v1/providers/dashboard/earnings"},
            {"code": "MANAGE_SERVICES", "label": "Manage services", "method": "GET",
             "path": "/api/v1/providers/services"},
        ]

    # -- helpers -----------------------------------------------------------------

    def _json_safe(self, row: dict[str, Any]) -> dict[str, Any]:
        for key, value in row.items():
            if isinstance(value, (datetime, date)):
                row[key] = value.isoformat()
            elif isinstance(value, Decimal):
                row[key] = float(value)
            elif isinstance(value, UUID):
                row[key] = str(value)
        return row