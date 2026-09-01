"""v1 warranties namespace — thin re-export of the warranty domain router."""
from app.domains.warranties.api.router import router

router.tags = ["warranties"]

__all__ = ["router"]
