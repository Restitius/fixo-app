"""v1 users namespace — thin re-export of the users domain router."""
from app.domains.users.api.router import router

router.tags = ["users"]

__all__ = ["router"]
