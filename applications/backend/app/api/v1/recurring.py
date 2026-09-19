"""v1 recurring namespace - thin re-export of the recurring domain router."""
from app.domains.recurring.api.router import router

router.tags = ["recurring"]

__all__ = ["router"]
