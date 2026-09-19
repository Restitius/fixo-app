"""v1 assets namespace — thin re-export of the assets domain router."""
from app.domains.assets.api.router import router

router.tags = ["assets"]

__all__ = ["router"]
