"""v1 reviews namespace — thin re-export of the review domain router."""
from app.domains.reviews.api.router import router

router.tags = ["reviews"]

__all__ = ["router"]
