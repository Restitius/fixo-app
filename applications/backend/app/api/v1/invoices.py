"""v1 invoices namespace — thin re-export of the invoice domain router."""
from app.domains.invoices.api.router import router

router.tags = ["invoices"]

__all__ = ["router"]