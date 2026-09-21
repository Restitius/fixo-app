"""Provider recurring customer notes (Phase 42).

"Recurring Customers" itself is computed on the fly from completed
BOOKINGS (2+ CLOSED bookings with the same customer) — no new table needed
for that. PROVIDER_CUSTOMER_NOTES holds the one piece of genuinely new
state: a provider's private note about a repeat customer.
"""

from alembic import op

revision = "0062"
down_revision = "0061"


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS "PROVIDER_CUSTOMER_NOTES" (
            provider_id UUID NOT NULL REFERENCES "PROVIDERS"(provider_id) ON DELETE CASCADE,
            customer_id UUID NOT NULL REFERENCES "CUSTOMERS"(customer_id) ON DELETE CASCADE,
            note        VARCHAR(2000) NOT NULL,
            created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
            PRIMARY KEY (provider_id, customer_id)
        )
        """
    )


def downgrade() -> None:
    op.execute('DROP TABLE IF EXISTS "PROVIDER_CUSTOMER_NOTES"')
