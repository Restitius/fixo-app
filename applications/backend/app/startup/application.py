"""create_application() — the single FastAPI assembly point.

Responsibilities (and NOTHING else lives in main.py):
    - build the FastAPI instance
    - attach the middleware stack (outermost added last)
    - register exception handlers (standard envelope)
    - include the aggregated v1 router
    - wire lifespan to Bootstrap.run_startup/run_shutdown
"""
from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.bootstrap import Bootstrap
from app.config import get_settings
from app.shared.constants.app import APP_TITLE, APP_VERSION, DOCS_URL, OPENAPI_URL


def create_application() -> FastAPI:
    """Assemble the FIXO-APP FastAPI application."""
    settings = get_settings()
    bootstrap = Bootstrap()

    @asynccontextmanager
    async def lifespan(_: FastAPI) -> AsyncIterator[None]:
        await bootstrap.run_startup()
        try:
            yield
        finally:
            await bootstrap.run_shutdown()

    application = FastAPI(
        title=APP_TITLE,
        version=APP_VERSION,
        docs_url=DOCS_URL,
        openapi_url=OPENAPI_URL,
        lifespan=lifespan,
    )

    # Read by app/integrations/external/webhooks/router.py to verify inbound
    # Swala SMS callback signatures. Nothing previously set this — the
    # webhook has been unreachable (crashes on every call) since it was
    # written; see the fix note there.
    application.state.swala_sms_webhook_secret = settings.swala_sms_webhook_secret

    # --- middleware (last added == outermost) -----------------------------
    from fastapi.middleware.cors import CORSMiddleware

    from app.api.middleware.client_context import ClientContextMiddleware
    from app.api.middleware.correlation_id import CorrelationIdMiddleware
    from app.api.middleware.exception_handler import ExceptionHandlingMiddleware
    from app.api.middleware.logging import LoggingMiddleware
    from app.api.middleware.request_id import RequestIdMiddleware
    from app.api.middleware.screen_tracking import ScreenTrackingMiddleware
    from app.api.middleware.security_headers import SecurityHeadersMiddleware

    application.add_middleware(ExceptionHandlingMiddleware)
    application.add_middleware(LoggingMiddleware)
    application.add_middleware(ScreenTrackingMiddleware)
    application.add_middleware(ClientContextMiddleware)
    application.add_middleware(CorrelationIdMiddleware)
    application.add_middleware(RequestIdMiddleware)
    application.add_middleware(SecurityHeadersMiddleware)

    cors_origins = settings.cors_origin_list
    application.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_credentials=cors_origins != ["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # --- exception handlers -------------------------------------------------
    from app.api.exceptions.handlers import register_exception_handlers

    register_exception_handlers(application)

    # --- routes ---------------------------------------------------------------
    from app.api.v1.router import api_v1_router

    application.include_router(api_v1_router, prefix=settings.api_v1_prefix)

    return application
