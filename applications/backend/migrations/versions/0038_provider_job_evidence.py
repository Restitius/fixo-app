"""phase provider job evidence — evidence & job documentation (Provider Req Phase 22)

Revision ID: 0038_provider_job_evidence
Revises: 0037_provider_job_checklist

Phase 22: providers should document work. Evidence entries are stored
against the booking and cover: before photos, during-work photos, after
photos, videos, notes, measurements, customer instructions and
replacement parts.

One table:
  - BOOKING_EVIDENCE   one row per evidence item. `phase` (BEFORE /
    DURING / AFTER) records when it was captured, `kind` records what it
    is (PHOTO / VIDEO / NOTE / MEASUREMENT / INSTRUCTION / PART),
    `media_url` carries photos/videos, `body` carries note/instruction/
    part text, `quantity` + `unit` carry measurements and part counts.

The BOOKINGS status CHECK is untouched — this phase is additive storage
that the job-execution flow reads/writes.
"""
from __future__ import annotations

from alembic import op

revision = "0038_provider_job_evidence"
down_revision = "0037_provider_job_checklist"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Per-booking job evidence / documentation.
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS "BOOKING_EVIDENCE" (
            evidence_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            booking_id    UUID NOT NULL
                          REFERENCES "BOOKINGS"(booking_id) ON DELETE CASCADE,
            provider_id   UUID NOT NULL
                          REFERENCES "PROVIDERS"(provider_id) ON DELETE CASCADE,
            phase         VARCHAR(10) NOT NULL,
            kind          VARCHAR(20) NOT NULL,
            title         VARCHAR(200),
            body          TEXT,
            media_url     TEXT,
            quantity      NUMERIC(12,3),
            unit          VARCHAR(50),
            created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
            CONSTRAINT CK_BOOKING_EVIDENCE_PHASE
                CHECK (phase IN ('BEFORE','DURING','AFTER')),
            CONSTRAINT CK_BOOKING_EVIDENCE_KIND
                CHECK (kind IN ('PHOTO','VIDEO','NOTE','MEASUREMENT',
                                'INSTRUCTION','PART'))
        )
        """
    )
    op.execute(
        'CREATE INDEX IF NOT EXISTS "IX_BOOKING_EVIDENCE" '
        'ON "BOOKING_EVIDENCE" (booking_id, phase, created_at)'
    )


def downgrade() -> None:
    op.execute('DROP TABLE IF EXISTS "BOOKING_EVIDENCE"')
