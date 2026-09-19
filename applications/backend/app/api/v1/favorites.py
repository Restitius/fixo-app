"""v1 favorites namespace — thin re-export of the favorite domain router."""
from app.domains.favorites.api.router import router

router.tags = ["favorites"]

__all__ = ["router"]
