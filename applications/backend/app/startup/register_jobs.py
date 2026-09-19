"""Job registration — catalogue JOB-* handlers for workers/scheduler."""
from __future__ import annotations

import logging
from typing import Any

logger = logging.getLogger(__name__)


def register_jobs(job_registry: Any) -> None:
    """Register background job handlers from all domains."""
    # TODO(domains): import domains/*/jobs modules and register handlers.
    logger.info("job registry ready (domain jobs register as they land)")
