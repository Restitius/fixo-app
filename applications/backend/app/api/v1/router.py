"""API v1 aggregate router — contains NO business logic (section 34).

Only aggregation happens here: domain routers + platform routers.
"""
from __future__ import annotations

from fastapi import APIRouter

from app.api.v1.cancellations import router as cancellations_router  # noqa: E402
from app.api.v1.support import router as support_router  # noqa: E402
from app.api.v1.disputes import router as disputes_router  # noqa: E402
from app.api.v1.assets import router as assets_router
from app.api.v1.auth import router as auth_router
from app.api.v1.bookings import router as bookings_router
from app.api.v1.catalog import router as catalog_router
from app.api.v1.change_requests import router as change_requests_router
from app.api.v1.home import router as home_router
from app.api.v1.integrations import router as integrations_router
from app.api.v1.internal import router as internal_router
from app.api.v1.invoices import router as invoices_router
from app.api.v1.liabilities import router as liabilities_router
from app.api.v1.locations import router as locations_router
from app.api.v1.matching import router as matching_router
from app.api.v1.messaging import router as messaging_router
from app.domains.providers.api.messaging_router import router as provider_messaging_router
from app.api.v1.notifications import router as notifications_router
from app.api.v1.onboarding import router as onboarding_router
from app.api.v1.properties import router as properties_router
from app.api.v1.providers import router as providers_router
from app.domains.providers.api.auth_router import router as provider_auth_router
from app.domains.providers.api.onboarding_router import router as provider_onboarding_router
from app.domains.providers.api.profile_router import router as provider_profile_router
from app.domains.providers.api.business_router import router as provider_business_router
from app.domains.providers.api.calendar_router import router as provider_calendar_router
from app.domains.providers.api.verification_router import router as provider_verification_router
from app.domains.providers.api.service_config_router import router as provider_service_config_router
from app.domains.providers.api.pricing_router import router as provider_pricing_router
from app.domains.providers.api.areas_router import router as provider_areas_router
from app.domains.providers.api.booking_router import router as provider_booking_router
from app.domains.providers.api.arrival_router import router as provider_arrival_router
from app.domains.providers.api.tracking_router import router as provider_tracking_router
from app.domains.providers.api.checklist_router import router as provider_checklist_router
from app.domains.providers.api.evidence_router import router as provider_evidence_router
from app.domains.providers.api.change_request_router import (
    router as provider_change_request_router,
)
from app.domains.providers.api.materials_router import router as provider_materials_router
from app.domains.providers.api.completion_router import router as provider_completion_router
from app.domains.providers.api.reviews_router import router as provider_reviews_router
from app.domains.providers.api.billing_router import router as provider_billing_router
from app.domains.providers.api.earnings_router import router as provider_earnings_router
from app.domains.providers.api.wallet_router import router as provider_wallet_router
from app.domains.providers.api.payout_router import router as provider_payout_router
from app.domains.providers.api.commission_router import router as provider_commission_router
from app.domains.providers.api.invoices_router import router as provider_invoices_router
from app.domains.providers.api.ratings_router import router as provider_ratings_router
from app.domains.providers.api.kpis_router import router as provider_kpis_router
from app.domains.providers.api.ranking_router import router as provider_ranking_router
from app.domains.providers.api.portfolio_router import router as provider_portfolio_router
from app.domains.providers.api.notifications_router import router as provider_notifications_router
from app.domains.providers.api.dsl_requests_router import router as provider_dsl_requests_router
from app.domains.providers.api.disputes_router import router as provider_disputes_router
from app.domains.providers.api.support_router import router as provider_support_router
from app.domains.providers.api.safety_router import router as provider_safety_router

from app.domains.providers.api.availability_router import (
    router as provider_availability_router,
)
from app.domains.providers.api.dashboard_router import (
    router as provider_dashboard_router,
)
from app.domains.providers.api.requests_router import (
    router as provider_requests_router,
)
from app.domains.providers.api.matching_router import (
    router as provider_matching_router,
)
from app.domains.providers.api.quotations_router import (
    router as provider_quotations_router,
)
from app.api.v1.quotations import router as quotations_router
from app.api.v1.tracking import router as tracking_router
from app.api.v1.public import router as public_router
from app.api.v1.reviews import router as reviews_router
from app.api.v1.ratings import router as ratings_router
from app.api.v1.service_requests import router as service_requests_router
from app.api.v1.system import router as system_router
from app.api.v1.transactions import router as transactions_router
from app.api.v1.users import router as users_router
from app.api.v1.warranties import router as warranties_router
from app.api.v1.favorites import router as favorites_router
from app.api.v1.rebook import router as rebook_router
from app.api.v1.recurring import router as recurring_router
from app.api.v1.maintenance import router as maintenance_router
from app.api.v1.account import router as account_router
from app.api.v1.wallet import router as wallet_router
from app.api.v1.promotions import router as promotions_router
from app.api.v1.loyalty import router as loyalty_router
from app.api.v1.history import router as history_router

api_v1_router = APIRouter()

api_v1_router.include_router(system_router)
api_v1_router.include_router(public_router)
api_v1_router.include_router(auth_router)
api_v1_router.include_router(onboarding_router)
api_v1_router.include_router(home_router)
api_v1_router.include_router(locations_router)
api_v1_router.include_router(properties_router)
api_v1_router.include_router(catalog_router)
api_v1_router.include_router(service_requests_router)
api_v1_router.include_router(matching_router)
api_v1_router.include_router(quotations_router)
api_v1_router.include_router(providers_router)
api_v1_router.include_router(provider_auth_router)
api_v1_router.include_router(provider_onboarding_router)
api_v1_router.include_router(provider_profile_router)
api_v1_router.include_router(provider_business_router)
api_v1_router.include_router(provider_calendar_router)
api_v1_router.include_router(provider_verification_router)
api_v1_router.include_router(provider_service_config_router)
api_v1_router.include_router(provider_pricing_router)
api_v1_router.include_router(provider_areas_router)
api_v1_router.include_router(provider_booking_router)
api_v1_router.include_router(provider_arrival_router)
api_v1_router.include_router(provider_tracking_router)
api_v1_router.include_router(provider_checklist_router)
api_v1_router.include_router(provider_evidence_router)
api_v1_router.include_router(provider_change_request_router)
api_v1_router.include_router(provider_materials_router)
api_v1_router.include_router(provider_completion_router)
api_v1_router.include_router(provider_reviews_router)
api_v1_router.include_router(provider_billing_router)
api_v1_router.include_router(provider_payout_router)
api_v1_router.include_router(provider_commission_router)
api_v1_router.include_router(provider_invoices_router)
api_v1_router.include_router(provider_ratings_router)
api_v1_router.include_router(provider_kpis_router)
api_v1_router.include_router(provider_ranking_router)
api_v1_router.include_router(provider_portfolio_router)
api_v1_router.include_router(provider_notifications_router)
api_v1_router.include_router(provider_dsl_requests_router)
api_v1_router.include_router(provider_disputes_router)
api_v1_router.include_router(provider_support_router)
api_v1_router.include_router(provider_safety_router)
api_v1_router.include_router(provider_earnings_router)
api_v1_router.include_router(provider_wallet_router)
api_v1_router.include_router(provider_requests_router)
api_v1_router.include_router(provider_matching_router)
api_v1_router.include_router(provider_quotations_router)
api_v1_router.include_router(bookings_router)
api_v1_router.include_router(change_requests_router)
api_v1_router.include_router(invoices_router)
api_v1_router.include_router(messaging_router)
api_v1_router.include_router(provider_messaging_router)
api_v1_router.include_router(tracking_router)
api_v1_router.include_router(internal_router)
api_v1_router.include_router(users_router)
api_v1_router.include_router(assets_router)
api_v1_router.include_router(transactions_router)
api_v1_router.include_router(liabilities_router)
api_v1_router.include_router(notifications_router)
api_v1_router.include_router(reviews_router)
api_v1_router.include_router(ratings_router, tags=["ratings"])
api_v1_router.include_router(warranties_router)
api_v1_router.include_router(favorites_router)
api_v1_router.include_router(rebook_router)
api_v1_router.include_router(recurring_router)
api_v1_router.include_router(maintenance_router)
api_v1_router.include_router(integrations_router)
api_v1_router.include_router(cancellations_router, tags=["cancellations"])
api_v1_router.include_router(support_router, tags=["support"])
api_v1_router.include_router(disputes_router, tags=["disputes"])
api_v1_router.include_router(account_router, tags=["account"])
api_v1_router.include_router(wallet_router, tags=["wallet"])
api_v1_router.include_router(promotions_router, tags=["promotions"])
api_v1_router.include_router(loyalty_router, tags=["loyalty"])
api_v1_router.include_router(history_router, tags=["history"])
