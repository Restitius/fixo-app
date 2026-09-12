"""Provider support tickets (Requirement Phase 40).

Extends the customer SUPPORT_TICKETS surface with a provider side:

- Adds `provider_id` to `SUPPORT_TICKETS` (nullable; backfilled from
  `BOOKINGS.provider_id` for tickets already linked to a booking).
- Index on `(provider_id, updated_at DESC)` for provider ticket listings.

The provider can open a ticket on any of its own bookings, view their
tickets, add provider messages, and read the ticket thread (same lifecycle
as the customer counter-flow; resolution stays platform side).
"""

from alembic import op


def upgrade() -> None:
    op.execute('ALTER TABLE "SUPPORT_TICKETS" ADD COLUMN IF NOT EXISTS provider_id UUID')
    op.execute(
        'UPDATE "SUPPORT_TICKETS" s SET provider_id = b.provider_id '
        'FROM "BOOKINGS" b WHERE b.booking_id = s.related_booking_id AND s.provider_id IS NULL'
    )
    op.execute(
        'CREATE INDEX IF NOT EXISTS "IX_SUPPORT_TICKET_PROVIDER" '
        'ON "SUPPORT_TICKETS" (provider_id, updated_at DESC)'
    )


def downgrade() -> None:
    op.execute('DROP INDEX IF EXISTS "IX_SUPPORT_TICKET_PROVIDER"')
    op.execute('ALTER TABLE "SUPPORT_TICKETS" DROP COLUMN IF EXISTS provider_id')