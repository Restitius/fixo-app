"""v1 auth namespace — thin re-export of the authentication domain router."""
from app.domains.authentication.api.router import router

router.tags = ["auth"]

__all__ = ["router"]
