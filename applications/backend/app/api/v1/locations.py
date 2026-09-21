"""v1 locations namespace — thin re-export of the location domain router."""
from app.domains.locations.api.router import router

router.tags = ["locations"]

__all__ = ["router"]