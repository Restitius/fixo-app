"""v1 liabilities namespace — thin re-export of the liabilities domain router."""
from app.domains.liabilities.api.router import router

router.tags = ["liabilities"]

__all__ = ["router"]
