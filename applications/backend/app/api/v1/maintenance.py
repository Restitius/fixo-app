"""v1 maintenance namespace - thin re-export of the maintenance domain router."""
from app.domains.maintenance.api.router import router

router.tags = ["maintenance"]

__all__ = ["router"]
