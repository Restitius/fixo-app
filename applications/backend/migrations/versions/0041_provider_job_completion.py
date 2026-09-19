"""phase provider job completion — completion notes + evidence (Provider Req Phase 25)

Revision ID: 0041_provider_job_completion
Revises: 0040_provider_materials

Phase 25: when work is finished the provider selects "Complete Job"
and enters: completion notes, work performed, materials used, before/
after evidence, warranty details, recommended follow-up and additional
maintenance recommendations. The customer then receives "Provider has
completed the job" and can confirm completion (Phase 26 sign-off — the
customer side already transitions COMPLETION_REQUESTED →
CUSTOMER_CONFIRMED via Module 25).

One table:
  - BOOKING_JOB_COMPLETIONS   one report per booking (UNIQUE). The
    submit is atomic: guarded INSERT of the report plus the booking
    status transition to COMPLETION_REQUESTED in a single CTE (direct
    SQL transition, same as the Phase 20 start-service pattern).

The BOOKINGS status CHECK is untouched — COMPLETION_REQUESTED is
already an allowed state (0010).
"""
from __future__ import annotations

from alembic import op

revision = "0041_provider_job_completion"
down_revision = "0040_provider_materials"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Per-booking completion report.
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS "BOOKING_JOB_COMPLETIONS" (
            completion_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            booking_id               UUID NOT NULL UNIQUE
                                     REFERENCES "BOOKINGS"(booking_id) ON DELETE CASCADE,
            provider_id              UUID NOT NULL
                                     REFERENCES "PROVIDERS"(provider_id) ON DELETE CASCADE,
            completion_notes         TEXT,
            work_performed           TEXT,
            materials_summary        TEXT,
            before_after_evidence    JSONB NOT NULL DEFAULT '[]'::jsonb,
            warranty_details         VARCHAR(500),
            recommended_followup     TEXT,
            maintenance_recommendations TEXT,
            created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
            CONSTRAINT CK_COMPLETION_REPORT
                CHECK (length(btrim(COALESCE(completion_notes, ''))) > 0 OR
                       length(btrim(COALESCE(work_performed, ''))) > 0)
        )
        """
    )
    op.execute(
        'CREATE INDEX IF NOT EXISTS "IX_BOOKING_COMPLETION" '
        'ON "BOOKING_JOB_COMPLETIONS" (booking_id, created_at)'
    )


def downgrade() -> None:
    op.execute('DROP TABLE IF EXISTS "BOOKING_JOB_COMPLETIONS"')
