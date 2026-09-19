"""v1 change-requests namespace — thin re-export of the domain router."""
from app.domains.change_requests.api.router import router

router.tags = ["change-requests"]

__all__ = ["router"]