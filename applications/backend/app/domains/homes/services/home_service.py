"""HomeService — the dashboard AGGREGATOR.

Composes the whole customer environment through read ports ONLY; it never
touches another domain's tables directly (architecture section 53). Sections
whose domains land later arrive as safe empties from their stub readers.
"""
from __future__ import annotations

from typing import Any


class HomeService:
    def __init__(
        self,
        environment: Any,       # EnvironmentReadPort
        catalog: Any,           # CatalogReadPort
        bookings: Any,          # ActiveBookingReadPort   (stub until Phase 6)
        wallet: Any,            # WalletReadPort           (stub until Phase 12)
        notifications: Any,     # NotificationReadPort     (stub until Phase 14)
        recommendations: Any,   # RecommendationReadPort   (stub until Phase 3)
    ) -> None:
        self._environment = environment
        self._catalog = catalog
        self._bookings = bookings
        self._wallet = wallet
        self._notifications = notifications
        self._recommendations = recommendations

    async def dashboard(self, customer_id: str, full_name: str = "") -> dict[str, Any]:
        env, categories, popular = await self._gather_core(customer_id)
        active_bookings = await self._bookings.active(customer_id)
        balance = await self._wallet.balance(customer_id)
        unread = await self._notifications.unread_count(customer_id)
        recommended = await self._recommendations.for_customer(customer_id)

        first = full_name.split(" ")[0] if full_name else "there"
        return {
            "greeting": f"Welcome back, {first}",
            "environment": env,
            "quick_stats": {
                "active_bookings": len(active_bookings),
                "unread_notifications": unread,
                "wallet_balance": balance.get("balance", 0),
            },
            "active_bookings": active_bookings,
            "categories": categories,
            "popular_services": popular,
            "recommended_services": recommended,
        }

    async def _gather_core(self, customer_id: str) -> tuple[dict, list, list]:
        environment = await self._environment.summary(customer_id)
        categories = await self._catalog.categories(customer_id)
        popular = await self._catalog.popular_services(customer_id)
        return environment, categories, popular