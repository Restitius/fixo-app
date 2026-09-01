"""v1 account namespace — thin re-export of the accounts domain router."""
from app.domains.accounts.api.router import router
router.tags = ["account"]
__all__ = ["router"]