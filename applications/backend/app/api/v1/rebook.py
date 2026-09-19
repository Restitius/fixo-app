"""v1 rebook namespace — thin re-export of the rebooking domain router."""
from app.domains.rebooking.api.router import router

router.tags = ["rebook"]

__all__ = ["router"]
