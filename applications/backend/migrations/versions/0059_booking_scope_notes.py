"""Add BOOKINGS.scope_notes so an approved SCOPE change request has somewhere
to persist its effect — previously there was no field to write to at all,
so approving a SCOPE change silently applied nothing.
"""
from __future__ import annotations

from alembic import op

revision = "0059"
down_revision = "0051"


def upgrade() -> None:
    op.execute(
        'ALTER TABLE "BOOKINGS" ADD COLUMN IF NOT EXISTS scope_notes VARCHAR(2000)'
    )


def downgrade() -> None:
    op.execute('ALTER TABLE "BOOKINGS" DROP COLUMN IF EXISTS scope_notes')
