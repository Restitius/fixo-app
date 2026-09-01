"""Ratings v1 namespace."""
from app.domains.ratings.api.router import router
router.tags = ["ratings"]
__all__ = ["router"]