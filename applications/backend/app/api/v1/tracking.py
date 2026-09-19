"""v1 tracking namespace — thin re-export of the tracking domain router."""
from app.domains.tracking.api.router import router

router.tags = ["tracking"]

__all__ = ["router"]