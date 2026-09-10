"""phase provider job checklist — templated checklists per service type (Provider Req Phase 21)

Revision ID: 0037_provider_job_checklist
Revises: 0036_provider_start_svc

Phase 21: some service types contain predefined workflows (e.g. Air
Conditioning Service: Inspect unit, Check electrical connections, Clean
filters, Test cooling, Check refrigerant, Run system test). The provider
checks tasks as they are completed; this improves service consistency
and auditability.

Two tables:
  - JOB_CHECKLIST_TEMPLATES   provider-defined templates keyed by service.
  - BOOKING_CHECKLIST_ITEMS   per-booking instantiation: the template's
    tasks copied onto a booking, with completion fields + a completion
    guard against manual re-checks.

The BOOKINGS status CHECK is untouched — this phase is additive storage
that the job-execution flow reads/writes.
"""
from __future__ import annotations

from alembic import op

revision = "0037_provider_job_checklist"
down_revision = "0036_provider_start_svc"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Provider-defined checklist templates, keyed by service.
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS "JOB_CHECKLIST_TEMPLATES" (
            template_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            provider_id   UUID NOT NULL
                          REFERENCES "PROVIDERS"(provider_id) ON DELETE CASCADE,
            service_id    UUID NOT NULL
                          REFERENCES "SERVICES"(service_id) ON DELETE CASCADE,
            title         VARCHAR(200) NOT NULL,
            items         JSONB NOT NULL DEFAULT '[]'::jsonb,
            is_active     BOOLEAN NOT NULL DEFAULT TRUE,
            created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
            CONSTRAINT CK_JOB_TEMPLATE_TITLE CHECK (length(btrim(title)) > 0)
        )
        """
    )
    op.execute(
        'CREATE UNIQUE INDEX IF NOT EXISTS "UX_JOB_TEMPLATE_PROVIDER_SERVICE" '
        'ON "JOB_CHECKLIST_TEMPLATES" (provider_id, service_id)'
    )

    # Per-booking instantiation of a template.
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS "BOOKING_CHECKLIST_ITEMS" (
            item_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            booking_id    UUID NOT NULL
                          REFERENCES "BOOKINGS"(booking_id) ON DELETE CASCADE,
            provider_id   UUID NOT NULL
                          REFERENCES "PROVIDERS"(provider_id) ON DELETE CASCADE,
            task_title    VARCHAR(200) NOT NULL,
            position      INTEGER NOT NULL DEFAULT 0,
            is_completed  BOOLEAN NOT NULL DEFAULT FALSE,
            completed_at  TIMESTAMPTZ,
            created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
            CONSTRAINT CK_BOOKING_CHECKLIST_TASK CHECK (length(btrim(task_title)) > 0)
        )
        """
    )
    op.execute(
        'CREATE INDEX IF NOT EXISTS "IX_BOOKING_CHECKLIST" '
        'ON "BOOKING_CHECKLIST_ITEMS" (booking_id, position)'
    )


def downgrade() -> None:
    op.execute('DROP TABLE IF EXISTS "BOOKING_CHECKLIST_ITEMS"')
    op.execute('DROP TABLE IF EXISTS "JOB_CHECKLIST_TEMPLATES"')