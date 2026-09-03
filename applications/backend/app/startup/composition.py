"""Composition root â wires adapters + platform managers into domain services.

This is the ONLY place in the application that constructs the full chain:

    AssetService -> AssetRepository (port)
                 -> AssetSqlAdapter
                 -> SQLQueryManager
                 -> QueryRegistry / QueryLoader / DatabaseManager

Bootstrap builds these singletons and stores them in app state; controllers
resolve services through this module so they never construct infrastructure.
"""
from __future__ import annotations

from typing import Any

from app.config import get_settings


class Composition:
    """Process-wide object graph assembled during startup."""

    def __init__(self) -> None:
        self.sql_query_manager: Any = None
        self.asset_repository: Any = None
        self.jwt: Any = None
        self._hasher: Any = None
        self.customer_repository: Any = None
        self.otp_repository: Any = None
        self.session_repository: Any = None
        self.onboarding_repository: Any = None
        self.public_content_repository: Any = None
        self.address_repository: Any = None
        self.property_repository: Any = None
        self.booking_repository: Any = None
        self.payment_repository: Any = None
        self.invoice_repository: Any = None
        self.recurring_repository: Any = None
        self.maintenance_repository: Any = None
        self.review_repository: Any = None
        self.warranty_repository: Any = None
        self.favorite_repository: Any = None
        self.rebook_repository: Any = None
        self.rating_repository: Any = None
        self.close_repository: Any = None
        self.payment_method_repository: Any = None
        self.preference_repository: Any = None
        self.security_repository: Any = None
        self.privacy_repository: Any = None
        self.account_closure_repository: Any = None
        self.wallet_repository: Any = None
        self.promotion_repository: Any = None
        self.loyalty_repository: Any = None
        self.history_repository: Any = None

    def wire(self, *, registry_manager: Any, databases: Any) -> None:
        """Build adapter chains from registered plumbing."""
        from app.infrastructure.database.query_executor import QueryExecutor
        from app.infrastructure.database.result_mapper import ResultMapper
        from app.platform.query.sql_query_manager import SQLQueryManager
        from app.platform.search.search_manager import SearchManager
        from app.platform.files.file_manager import FileManager
        from app.platform.notifications.notification_manager import NotificationManager
        from app.platform.workflow.workflow_manager import WorkflowManager
        from app.infrastructure.storage.local import LocalStorage
        from app.infrastructure.storage.storage_manager import StorageManager
        from app.adapters.persistence.asset_sql_adapter import AssetSqlAdapter
        from app.adapters.persistence.booking_sql_adapter import BookingSqlAdapter
        from app.adapters.persistence.change_request_sql_adapter import ChangeRequestSqlAdapter
        from app.adapters.persistence.cancellation_sql_adapter import CancellationSqlAdapter
        from app.adapters.persistence.support_sql_adapter import SupportSqlAdapter
        from app.adapters.persistence.dispute_sql_adapter import DisputeSqlAdapter
        from app.adapters.persistence.catalog_sql_adapter import CatalogSqlAdapter
        from app.adapters.persistence.customer_sql_adapter import CustomerSqlAdapter
        from app.adapters.persistence.home_read_adapter import (
            ActiveBookingStubReader,
            HomeCatalogReadAdapter,
            HomeEnvironmentReadAdapter,
            NotificationStubReader,
            RecommendationStubReader,
            WalletStubReader,
        )
        from app.adapters.persistence.invoice_sql_adapter import InvoiceSqlAdapter
        from app.adapters.persistence.review_sql_adapter import ReviewSqlAdapter
        from app.adapters.persistence.warranty_sql_adapter import WarrantySqlAdapter
        from app.adapters.persistence.favorite_sql_adapter import FavoriteSqlAdapter
        from app.adapters.persistence.rebook_sql_adapter import RebookSqlAdapter
        from app.adapters.persistence.location_sql_adapter import LocationSqlAdapter
        from app.adapters.persistence.matching_sql_adapter import MatchingSqlAdapter
        from app.adapters.persistence.messaging_sql_adapter import MessagingSqlAdapter
        from app.adapters.persistence.tracking_sql_adapter import TrackingSqlAdapter
        from app.adapters.persistence.onboarding_sql_adapter import OnboardingSqlAdapter
        from app.adapters.persistence.otp_sql_adapter import OtpSqlAdapter
        from app.adapters.persistence.payment_sql_adapter import PaymentSqlAdapter
        from app.adapters.persistence.provider_read_adapter import ProviderReadAdapter
        from app.adapters.persistence.property_sql_adapter import PropertySqlAdapter
        from app.adapters.persistence.public_content_sql_adapter import PublicContentSqlAdapter
        from app.adapters.persistence.quotation_sql_adapter import QuotationSqlAdapter
        from app.adapters.persistence.request_sql_adapter import RequestSqlAdapter
        from app.adapters.persistence.evidence_sql_adapter import EvidenceSqlAdapter
        from app.adapters.persistence.service_area_sql_adapter import ServiceAreaSqlAdapter
        from app.adapters.persistence.session_sql_adapter import SessionSqlAdapter
        from app.registries.queries.query_loader import QueryLoader
        from app.registries.queries.query_validator import QueryValidator
        from app.security.jwt import JwtService
        from app.security.password import PasswordHasher

        registry = registry_manager.queries
        loader = QueryLoader()
        validator = QueryValidator()
        mapper = ResultMapper()

        executor = QueryExecutor(
            registry=registry,
            loader=loader,
            databases=databases,
            mapper=mapper,
        )

        self.sql_query_manager = SQLQueryManager(
            executor=executor,
            registry=registry,
            validator=validator,
            loader=loader,
            databases=databases,
        )
        self._sql = self.sql_query_manager

        self.asset_repository = AssetSqlAdapter(self.sql_query_manager)
        self.customer_repository = CustomerSqlAdapter(self.sql_query_manager)
        self.otp_repository = OtpSqlAdapter(self.sql_query_manager)
        self.session_repository = SessionSqlAdapter(self.sql_query_manager)
        self.onboarding_repository = OnboardingSqlAdapter(self.sql_query_manager)
        self.public_content_repository = PublicContentSqlAdapter(self.sql_query_manager)
        self.search_manager = SearchManager(self.sql_query_manager)
        self.catalog_repository = CatalogSqlAdapter(
            self.sql_query_manager, self.search_manager
        )
        self.address_repository = LocationSqlAdapter(self.sql_query_manager)
        self.property_repository = PropertySqlAdapter(self.sql_query_manager)

        # -- Phase 4: files + workflows + requests ------------------------------
        uploads = LocalStorage("storage/uploads")
        storage = StorageManager()
        storage.register("local-uploads", uploads, default=True)
        self.storage_manager = storage
        self.file_manager = FileManager(storage)

        self.workflow_manager = WorkflowManager()
        self.workflow_manager.register_service_request()   # WF.SERVICE_REQUEST.V1
        self.workflow_manager.register_booking()           # WF.BOOKING.CUSTOMER.V1
        self.workflow_manager.register_change_request()    # WF.CHANGE_REQUEST.V1
        self.workflow_manager.register_service_execution() # WF.SERVICE.EXECUTION.V1
        self.workflow_manager.register_dispute()           # WF.DISPUTE.V1
        self.workflow_manager.register_support_ticket()    # WF.SUPPORT.TICKET.V1

        self.request_repository = RequestSqlAdapter(self.sql_query_manager)
        self.evidence_repository = EvidenceSqlAdapter(self.sql_query_manager)
        self._service_areas = ServiceAreaSqlAdapter(self.sql_query_manager)
        self.matching_repository = MatchingSqlAdapter(self.sql_query_manager)
        self.quotation_repository = QuotationSqlAdapter(self.sql_query_manager)
        self.provider_read = ProviderReadAdapter(self.sql_query_manager)
        self.booking_repository = BookingSqlAdapter(self.sql_query_manager)
        self.payment_repository = PaymentSqlAdapter(self.sql_query_manager)
        self.change_request_repository = ChangeRequestSqlAdapter(self.sql_query_manager)
        self.cancellation_repository = CancellationSqlAdapter(self.sql_query_manager)
        self.support_repository = SupportSqlAdapter(self.sql_query_manager)
        self.dispute_repository = DisputeSqlAdapter(self.sql_query_manager)
        self.messaging_repository = MessagingSqlAdapter(self.sql_query_manager)
        self._tracking = TrackingSqlAdapter(self.sql_query_manager)
        self.notification_manager = NotificationManager(self.sql_query_manager)
        self.invoice_repository = InvoiceSqlAdapter(self.sql_query_manager)

        # Phase 10 â post-service repositories.
        self.review_repository = ReviewSqlAdapter(self.sql_query_manager)
        self.warranty_repository = WarrantySqlAdapter(self.sql_query_manager)
        self.favorite_repository = FavoriteSqlAdapter(self.sql_query_manager)
        self.rebook_repository = RebookSqlAdapter(self.sql_query_manager)

        # Phase 11 - retention repositories + scheduler.
        from app.adapters.persistence.recurring_sql_adapter import RecurringSqlAdapter
        from app.adapters.persistence.maintenance_sql_adapter import MaintenanceSqlAdapter

        self.recurring_repository = RecurringSqlAdapter(self.sql_query_manager)
        self.maintenance_repository = MaintenanceSqlAdapter(self.sql_query_manager)

        # Phase 15 - account management adapters.
        from app.adapters.persistence.account_sql_adapter import (
            PaymentMethodSqlAdapter,
            PreferenceSqlAdapter,
            SecuritySqlAdapter,
            PrivacySqlAdapter,
            AccountClosureSqlAdapter,
        )

        self.payment_method_repository = PaymentMethodSqlAdapter(self.sql_query_manager)
        self.preference_repository = PreferenceSqlAdapter(self.sql_query_manager)
        self.security_repository = SecuritySqlAdapter(self.sql_query_manager)
        self.privacy_repository = PrivacySqlAdapter(self.sql_query_manager)
        self.account_closure_repository = AccountClosureSqlAdapter(self.sql_query_manager)

        # Phase 12/14 - value + history adapters.
        from app.adapters.persistence.value_sql_adapter import (
            WalletSqlAdapter,
            PromotionSqlAdapter,
            LoyaltySqlAdapter,
        )
        from app.adapters.persistence.history_sql_adapter import HistorySqlAdapter

        self.wallet_repository = WalletSqlAdapter(self.sql_query_manager)
        self.promotion_repository = PromotionSqlAdapter(self.sql_query_manager)
        self.loyalty_repository = LoyaltySqlAdapter(self.sql_query_manager)
        self.history_repository = HistorySqlAdapter(self.sql_query_manager)
        self.scheduler = None

        # Phase 16 - completion (ratings + booking close).
        from app.adapters.persistence.ratings_sql_adapter import RatingSqlAdapter, BookingCloseSqlAdapter
        self.rating_repository = RatingSqlAdapter(self.sql_query_manager)
        self.close_repository = BookingCloseSqlAdapter(self.sql_query_manager)

        # Payment gateway: mock now, real providers behind the same port later.
        from app.integrations.external.payments.mock_gateway import MockPaymentGateway

        self._payment_gateway = MockPaymentGateway()

        # Home aggregator read ports (stubs swap for real adapters in later phases).
        self._home_environment = HomeEnvironmentReadAdapter(self.sql_query_manager)
        self._home_catalog = HomeCatalogReadAdapter(self.sql_query_manager)
        self._home_bookings = ActiveBookingStubReader()
        self._home_wallet = WalletStubReader()
        self._home_notifications = NotificationStubReader()
        self._home_recommendations = RecommendationStubReader()

        settings = get_settings()
        self.jwt = JwtService(
            settings.secret_key,
            algorithm=settings.jwt_algorithm,
            access_ttl_seconds=settings.jwt_access_ttl_seconds,
            refresh_ttl_seconds=settings.jwt_refresh_ttl_seconds,
        )
        self._hasher = PasswordHasher()

    # -- composed services (business-facing only) -----------------------------

    def asset_service(self) -> Any:
        from app.domains.assets.services.asset_service import AssetService

        return AssetService(
            repository=self.asset_repository,
            event_publisher=None,  # wired when event adapters land
        )

    def auth_service(self) -> Any:
        """AuthService with ONLY ports + security helpers injected."""
        from app.domains.customers.services.auth_service import AuthService
        from app.platform.events.event_manager import EventManager

        events = EventManager() if _event_bus_available() else None
        return AuthService(
            customers=self.customer_repository,
            otps=self.otp_repository,
            sessions=self.session_repository,
            hasher=self._hasher,
            jwt_service=self.jwt,
            events=events,
        )

    def public_service(self) -> Any:
        from app.domains.public_content.services.public_service import PublicContentService

        return PublicContentService(self.public_content_repository)

    def onboarding_service(self) -> Any:
        from app.domains.onboarding.services.onboarding_service import OnboardingService
        from app.platform.events.event_manager import EventManager

        return OnboardingService(
            self.onboarding_repository,
            EventManager() if _event_bus_available() else None,
        )

    def location_service(self) -> Any:
        """AddressService with ONLY ports injected (no SQL, no IDs)."""
        from app.domains.locations.services.address_service import AddressService

        return AddressService(
            self.address_repository,
            None,  # event publisher wired when address listeners land
        )

    def property_service(self) -> Any:
        from app.domains.properties.services.property_service import PropertyService

        return PropertyService(
            properties=self.property_repository,
            addresses=self.address_repository,
        )

    def home_service(self) -> Any:
        from app.domains.homes.services.home_service import HomeService

        return HomeService(
            environment=self._home_environment,
            catalog=self._home_catalog,
            bookings=self._home_bookings,
            wallet=self._home_wallet,
            notifications=self._home_notifications,
            recommendations=self._home_recommendations,
        )

    def catalog_service(self) -> Any:
        """CatalogService with ONLY its port injected."""
        from app.domains.catalog.services.catalog_service import CatalogService

        return CatalogService(self.catalog_repository)

    def request_service(self) -> Any:
        """RequestService â ports + platform managers only."""
        from app.domains.service_requests.services.request_service import RequestService

        return RequestService(
            requests=self.request_repository,
            evidences=self.evidence_repository,
            areas=self._service_areas,
            addresses=self.address_repository,
            properties=self.property_repository,
            workflows=self.workflow_manager,
            files=self.file_manager,
            events=None,
        )

    def matching_service(self) -> Any:
        """MatchingService â Modules 12 & 13."""
        from app.domains.matching.services.matching_service import MatchingService

        return MatchingService(
            matching=self.matching_repository,
            quotations=self.quotation_repository,
            requests=self.request_repository,
            workflows=self.workflow_manager,
        )

    def quotation_service(self) -> Any:
        """QuotationService â Module 15."""
        from app.domains.quotations.services.quotation_service import QuotationService

        return QuotationService(
            quotations=self.quotation_repository,
            requests=self.request_repository,
            workflows=self.workflow_manager,
        )

    def provider_directory_service(self) -> Any:
        """ProviderDirectoryService â Module 14."""
        from app.domains.providers.services.provider_directory_service import (
            ProviderDirectoryService,
        )

        return ProviderDirectoryService(self.provider_read)

    def booking_service(self) -> Any:
        """BookingService â Modules 16 & 17."""
        from app.domains.bookings.services.booking_service import BookingService

        return BookingService(
            bookings=self.booking_repository,
            payments=self.payment_repository,
            quotations=self.quotation_repository,
            requests=self.request_repository,
            gateway=self._payment_gateway,
            workflows=self.workflow_manager,
            notifications=self.notification_manager,
        )

    def conversation_service(self) -> Any:
        """ConversationService â Module 19."""
        from app.domains.messaging.services.conversation_service import (
            ConversationService,
        )

        return ConversationService(
            messaging=self.messaging_repository,
            bookings=self.booking_repository,
        )

    def tracking_service(self) -> Any:
        """TrackingService â Modules 21 & 22."""
        from app.domains.tracking.services.tracking_service import TrackingService

        return TrackingService(
            tracking=self._tracking,
            bookings=self.booking_repository,
            requests=self.request_repository,
            workflows=self.workflow_manager,
            notifications=self.notification_manager,
        )

    def notification_service(self) -> Any:
        """Notification center facade â Module 20 (manager IS the surface)."""
        return self.notification_manager

    def change_request_service(self) -> Any:
        """ChangeRequestService â Module 24."""
        from app.domains.change_requests.services.change_request_service import (
            ChangeRequestService,
        )

        return ChangeRequestService(
            changes=self.change_request_repository,
            bookings=self.booking_repository,
            workflows=self.workflow_manager,
            notifications=self.notification_manager,
        )

    def completion_service(self) -> Any:
        """CompletionService â Module 25."""
        from app.domains.service_execution.services.completion_service import (
            CompletionService,
        )

        return CompletionService(
            bookings=self.booking_repository,
            workflows=self.workflow_manager,
            notifications=self.notification_manager,
        )

    def final_payment_service(self) -> Any:
        """FinalPaymentService â Module 26 (capture)."""
        from app.domains.payments.services.final_payment_service import (
            FinalPaymentService,
        )

        return FinalPaymentService(
            bookings=self.booking_repository,
            payments=self.payment_repository,
            invoices=self.invoice_repository,
            gateway=self._payment_gateway,
            workflows=self.workflow_manager,
            notifications=self.notification_manager,
        )

    def invoice_service(self) -> Any:
        """InvoiceService â Module 27."""
        from app.domains.invoices.services.invoice_service import InvoiceService

        return InvoiceService(
            invoices=self.invoice_repository,
            bookings=self.booking_repository,
            workflows=self.workflow_manager,
            notifications=self.notification_manager,
        )

    def review_service(self) -> Any:
        """ReviewService â Module 28."""
        from app.domains.reviews.services.review_service import ReviewService

        return ReviewService(self.review_repository)

    def warranty_service(self) -> Any:
        """WarrantyService â Module 29."""
        from app.domains.warranties.services.warranty_service import WarrantyService

        return WarrantyService(self.warranty_repository)

    def favorite_service(self) -> Any:
        """FavoriteService â Module 30."""
        from app.domains.favorites.services.favorite_service import FavoriteService

        return FavoriteService(self.favorite_repository)

    def rebook_service(self) -> Any:
        """RebookService â Module 30 (rebooking)."""
        from app.domains.rebooking.services.rebook_service import RebookService

        return RebookService(rebook=self.rebook_repository)

    def recurring_service(self) -> Any:
        """RecurringService â Module 31."""
        from app.domains.recurring.services.recurring_service import RecurringService

        return RecurringService(self.recurring_repository)

    def maintenance_service(self) -> Any:
        """MaintenanceService â Module 33."""
        from app.domains.maintenance.services.maintenance_service import MaintenanceService

        return MaintenanceService(
            plans=self.maintenance_repository,
            notifications=self.notification_manager,
        )

    def cancellation_service(self) -> Any:
        """CancellationService â Module 37 (policies decide, SQL enforces)."""
        from app.domains.cancellations.services.cancellation_service import (
            CancellationService,
        )

        return CancellationService(self.cancellation_repository)

    def support_service(self) -> Any:
        """SupportService â Module 38 (helpdesk, ports only)."""
        from app.domains.support.services.support_service import SupportService

        return SupportService(self.support_repository)

    def dispute_service(self) -> Any:
        """DisputeService â Module 39 (open, evidence, withdraw)."""
        from app.domains.disputes.services.dispute_service import DisputeService

        return DisputeService(self.dispute_repository)

    def payment_method_service(self) -> Any:
        """PaymentMethodService â Module 45."""
        from app.domains.accounts.services.account_service import PaymentMethodService

        return PaymentMethodService(self.payment_method_repository)

    def preference_service(self) -> Any:
        """PreferenceService â Module 47."""
        from app.domains.accounts.services.account_service import PreferenceService

        return PreferenceService(self.preference_repository)

    def security_service(self) -> Any:
        """SecurityService â Module 46."""
        from app.domains.accounts.services.account_service import SecurityService

        return SecurityService(
            self.security_repository,
            hasher=self._hasher,
            sessions_repo=self.session_repository,
            customers=self.customer_repository,
        )

    def privacy_service(self) -> Any:
        """PrivacyService â Module 49."""
        from app.domains.accounts.services.account_service import PrivacyService

        return PrivacyService(self.privacy_repository)

    def account_closure_service(self) -> Any:
        """AccountClosureService â Module 50."""
        from app.domains.accounts.services.account_service import AccountClosureService

        return AccountClosureService(self.account_closure_repository)

    def wallet_service(self) -> Any:
        """WalletService â Module 34."""
        from app.domains.wallets.services.wallet_service import WalletService

        return WalletService(self.wallet_repository)

    def promotion_service(self) -> Any:
        """PromotionService â Module 35."""
        from app.domains.promotions.services.promotion_service import PromotionService

        return PromotionService(self.promotion_repository)

    def loyalty_service(self) -> Any:
        """LoyaltyService â Module 36."""
        from app.domains.loyalty.services.loyalty_service import LoyaltyService

        return LoyaltyService(self.loyalty_repository)

    def history_service(self) -> Any:
        """HistoryService â Modules 40 + 42."""
        from app.domains.history.services.history_service import HistoryService

        return HistoryService(self.history_repository)

    def rating_service(self) -> Any:
        """RatingService  Module 51."""
        from app.domains.ratings.services.rating_service import RatingService
        return RatingService(self.rating_repository, bookings=self.booking_repository)

    def completion_service(self) -> Any:
        """CompletionService  Module 53 (atomic booking close)."""
        from app.domains.bookings.services.completion_service import CompletionService
        return CompletionService(
            close_port=self.close_repository,
            bookings=self.booking_repository,
            workflows=self.workflow_manager,
        )


def _event_bus_available() -> bool:
    try:
        from app.registries.events.listener_registry import ListenerRegistry  # noqa: F401

        return True
    except Exception:
        return False


_composition: Composition | None = None


def get_composition() -> Composition:
    """Return the process-wide composition root (populated at startup)."""
    if _composition is None:
        raise RuntimeError("Composition not initialised â run Bootstrap startup first")
    return _composition


def set_composition(composition: Composition) -> None:
    """Install the composition root (called from Bootstrap during startup)."""
    global _composition
    _composition = composition