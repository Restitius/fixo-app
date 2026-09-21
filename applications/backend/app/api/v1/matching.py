"""v1 matching namespace — thin re-export of the matching domain router."""
from app.domains.matching.api.router import router

router.tags = ["matching"]

__all__ = ["router"]