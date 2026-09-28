"""Customer rescheduling: count how often a booking has been moved.

Customers can move a booking they have not yet started (CONFIRMED or
PAYMENT_AUTHORIZED) to another day / time window a limited number of times; the
counter is what enforces that limit.
"""

from alembic import op

revision = "0082"
down_revision = "0081"


def upgrade() -> None:
    op.execute('ALTER TABLE "BOOKINGS" ADD COLUMN IF NOT EXISTS reschedule_count INTEGER NOT NULL DEFAULT 0')


def downgrade() -> None:
    op.execute('ALTER TABLE "BOOKINGS" DROP COLUMN IF EXISTS reschedule_count')
