"""v1 cancellations namespace - thin re-export of the cancellations domain router."""
from app.domains.cancellations.api.router import router

router.tags = ["cancellations"]

__all__ = ["router"]
