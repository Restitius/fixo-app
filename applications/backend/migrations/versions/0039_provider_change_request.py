"""phase provider change request — scope-change submissions (Provider Req Phase 23)

Revision ID: 0039_provider_change_request
Revises: 0038_provider_job_evidence

Phase 23: sometimes the original job scope changes (e.g. the customer
requested "Repair leaking sink — TZS 30,000" and the provider discovers
damaged pipes). The provider submits a Change Request containing:
reason, new work required, additional labour, additional materials,
additional time, additional price and supporting photos. The customer
must approve or reject before additional billable work is performed.

Additive to the existing CHANGE_REQUESTS table (Module 24, requested_by
'PROVIDER'), Phase 8 execution statuses guard submission:
  - new_work, additional_labour, additional_materials,
    additional_time_minutes, additional_price, currency,
    supporting_photos (JSON array of photo URLs, typically Phase 22
    evidence media_urls).
  - status gains 'WITHDRAWN' so the provider can retire its own
    PROPOSED request while keeping the audit trail.

The customer side still decides via CUS.CHANGE.DECIDE — the side that
did NOT propose decides.
"""
from __future__ import annotations

from alembic import op

revision = "0039_provider_change_request"
down_revision = "0038_provider_job_evidence"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Provider Phase 23 submission payload columns.
    op.execute(
        'ALTER TABLE "CHANGE_REQUESTS" '
        'ADD COLUMN IF NOT EXISTS new_work VARCHAR(500)'
    )
    op.execute(
        'ALTER TABLE "CHANGE_REQUESTS" '
        'ADD COLUMN IF NOT EXISTS additional_labour NUMERIC(12,2)'
    )
    op.execute(
        'ALTER TABLE "CHANGE_REQUESTS" '
        'ADD COLUMN IF NOT EXISTS additional_materials NUMERIC(12,2)'
    )
    op.execute(
        'ALTER TABLE "CHANGE_REQUESTS" '
        'ADD COLUMN IF NOT EXISTS additional_time_minutes INTEGER'
    )
    op.execute(
        'ALTER TABLE "CHANGE_REQUESTS" '
        'ADD COLUMN IF NOT EXISTS additional_price NUMERIC(12,2)'
    )
    op.execute(
        'ALTER TABLE "CHANGE_REQUESTS" '
        "ADD COLUMN IF NOT EXISTS currency VARCHAR(3) NOT NULL DEFAULT 'TZS'"
    )
    op.execute(
        'ALTER TABLE "CHANGE_REQUESTS" '
        "ADD COLUMN IF NOT EXISTS supporting_photos JSONB "
        "NOT NULL DEFAULT '[]'::jsonb"
    )
    op.execute(
        'CREATE INDEX IF NOT EXISTS "IX_CHANGE_PROVIDER_BOOKING" '
        'ON "CHANGE_REQUESTS" (booking_id, requested_by, status)'
    )

    # Allow the provider to withdraw its own PROPOSED request (audit kept).
    op.execute('ALTER TABLE "CHANGE_REQUESTS" DROP CONSTRAINT IF EXISTS "CK_CHANGE_STATUS"')
    op.execute(
        'ALTER TABLE "CHANGE_REQUESTS" ADD CONSTRAINT "CK_CHANGE_STATUS" '
        "CHECK (status IN ('PROPOSED','APPROVED','DECLINED','WITHDRAWN'))"
    )


def downgrade() -> None:
    op.execute('ALTER TABLE "CHANGE_REQUESTS" DROP CONSTRAINT IF EXISTS "CK_CHANGE_STATUS"')
    op.execute(
        'ALTER TABLE "CHANGE_REQUESTS" ADD CONSTRAINT "CK_CHANGE_STATUS" '
        "CHECK (status IN ('PROPOSED','APPROVED','DECLINED'))"
    )
    op.execute('DROP INDEX IF EXISTS "IX_CHANGE_PROVIDER_BOOKING"')
    op.execute('ALTER TABLE "CHANGE_REQUESTS" DROP COLUMN IF EXISTS supporting_photos')
    op.execute('ALTER TABLE "CHANGE_REQUESTS" DROP COLUMN IF EXISTS currency')
    op.execute('ALTER TABLE "CHANGE_REQUESTS" DROP COLUMN IF EXISTS additional_price')
    op.execute('ALTER TABLE "CHANGE_REQUESTS" DROP COLUMN IF EXISTS additional_time_minutes')
    op.execute('ALTER TABLE "CHANGE_REQUESTS" DROP COLUMN IF EXISTS additional_materials')
    op.execute('ALTER TABLE "CHANGE_REQUESTS" DROP COLUMN IF EXISTS additional_labour')
    op.execute('ALTER TABLE "CHANGE_REQUESTS" DROP COLUMN IF EXISTS new_work')
