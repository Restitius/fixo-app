"""v1 properties namespace — thin re-export of the property domain router."""
from app.domains.properties.api.router import router

router.tags = ["properties"]

__all__ = ["router"]