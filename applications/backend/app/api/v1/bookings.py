"""v1 bookings namespace — thin re-export of the booking domain router."""
from app.domains.bookings.api.router import router

router.tags = ["bookings"]

__all__ = ["router"]