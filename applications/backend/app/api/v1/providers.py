"""v1 providers namespace — thin re-export of the provider directory router."""
from app.domains.providers.api.router import router

router.tags = ["providers"]

__all__ = ["router"]