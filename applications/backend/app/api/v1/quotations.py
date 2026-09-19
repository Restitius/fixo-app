"""v1 quotations namespace — thin re-export of the quotation domain router."""
from app.domains.quotations.api.router import router

router.tags = ["quotations"]

__all__ = ["router"]