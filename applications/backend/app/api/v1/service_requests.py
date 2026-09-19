"""v1 service-requests namespace — thin re-export of the domain router."""
from app.domains.service_requests.api.router import router

router.tags = ["service-requests"]

__all__ = ["router"]