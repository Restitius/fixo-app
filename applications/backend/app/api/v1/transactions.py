"""v1 transactions namespace — thin re-export of the transactions domain router."""
from app.domains.transactions.api.router import router

router.tags = ["transactions"]

__all__ = ["router"]
