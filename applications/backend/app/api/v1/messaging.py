"""v1 messaging namespace — thin re-export of the messaging domain router."""
from app.domains.messaging.api.router import router

router.tags = ["messaging"]

__all__ = ["router"]