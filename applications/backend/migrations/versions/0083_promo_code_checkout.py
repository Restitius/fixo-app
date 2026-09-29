"""Wire promo codes into checkout.

PROMOTIONS already had /validate and /use endpoints, but nothing on the booking
path ever called them: a booking's agreed_amount came straight from the quote,
and /use only bumped a counter with no link to who used it or for what. A
customer code could be "used" any number of times by anyone.

This adds a promo_id / promo_code / discount_amount snapshot to BOOKINGS, and
PROMOTION_REDEMPTIONS to record one redemption per customer per promotion —
the row CUS.BOOKING.CREATE inserts (guarded, atomically with the booking) is
what actually enforces "each customer can use a given code once".
"""

from alembic import op

revision = "0083"
down_revision = "0082"


def upgrade() -> None:
    op.execute('ALTER TABLE "BOOKINGS" ADD COLUMN IF NOT EXISTS promo_id UUID REFERENCES "PROMOTIONS"(promo_id)')
    op.execute('ALTER TABLE "BOOKINGS" ADD COLUMN IF NOT EXISTS promo_code VARCHAR(40)')
    op.execute('ALTER TABLE "BOOKINGS" ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0')

    op.execute("""
        CREATE TABLE IF NOT EXISTS "PROMOTION_REDEMPTIONS" (
            redemption_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            promo_id         UUID NOT NULL REFERENCES "PROMOTIONS"(promo_id) ON DELETE CASCADE,
            customer_id      UUID NOT NULL REFERENCES "CUSTOMERS"(customer_id) ON DELETE CASCADE,
            booking_id       UUID NOT NULL UNIQUE REFERENCES "BOOKINGS"(booking_id) ON DELETE CASCADE,
            discount_amount  NUMERIC(12,2) NOT NULL,
            created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
            UNIQUE (promo_id, customer_id)
        )
    """)
    op.execute('CREATE INDEX IF NOT EXISTS "IX_PROMO_REDEMPTIONS_CUSTOMER" ON "PROMOTION_REDEMPTIONS" (customer_id)')


def downgrade() -> None:
    op.execute('DROP TABLE IF EXISTS "PROMOTION_REDEMPTIONS"')
    op.execute('ALTER TABLE "BOOKINGS" DROP COLUMN IF EXISTS discount_amount')
    op.execute('ALTER TABLE "BOOKINGS" DROP COLUMN IF EXISTS promo_code')
    op.execute('ALTER TABLE "BOOKINGS" DROP COLUMN IF EXISTS promo_id')
