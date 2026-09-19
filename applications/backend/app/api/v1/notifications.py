"""v1 notifications namespace — thin re-export of the notifications domain router."""
from app.domains.notifications.api.router import router

router.tags = ["notifications"]

__all__ = ["router"]
