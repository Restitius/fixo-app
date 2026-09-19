"""v1 disputes namespace - thin re-export of the disputes domain router."""
from app.domains.disputes.api.router import router

router.tags = ["disputes"]

__all__ = ["router"]
