"""v1 catalog namespace — thin re-export of the catalog domain router."""
from app.domains.catalog.api.router import router

router.tags = ["catalog"]

__all__ = ["router"]