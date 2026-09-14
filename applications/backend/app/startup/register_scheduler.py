"""Scheduler registration - wire retention jobs to the SchedulerManager."""
from __future__ import annotations

import logging
from typing import Any

logger = logging.getLogger(__name__)


def register_scheduler(composition: Any) -> Any:
    """Build the SchedulerManager and register Phase 11 retention jobs."""
    from app.platform.jobs.job_manager import SchedulerManager

    scheduler = getattr(composition, "scheduler", None)
    if scheduler is not None:
        return scheduler

    scheduler = SchedulerManager()
    scheduler.register(
        "JOB.RECURRING.GENERATE",
        composition.recurring_service().generate_due,
        interval_seconds=60,
    )
    scheduler.register(
        "JOB.MAINTENANCE.SWEEP",
        composition.maintenance_service().sweep_overdue,
        interval_seconds=300,
    )
    scheduler.register(
        "JOB.NOTIFICATIONS.DISPATCH",
        composition.notification_manager.process_pending,
        interval_seconds=15,
    )
    composition.scheduler = scheduler
    logger.info("scheduler ready: %s", sorted(scheduler._jobs))
    return scheduler

