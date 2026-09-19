"""v1 home namespace — thin re-export of the home dashboard router."""
from app.domains.homes.api.router import router

router.tags = ["home"]

__all__ = ["router"]