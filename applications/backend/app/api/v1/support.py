"""v1 support namespace - thin re-export of the support domain router."""
from app.domains.support.api.router import router

router.tags = ["support"]

__all__ = ["router"]
