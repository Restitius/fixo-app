"""Provider business customers & negotiated rates (Phase 43).

PROVIDER_BUSINESS_CUSTOMERS — a provider's registry of business/corporate
customers with a negotiated rate (percent discount or fixed rate),
separate from the ordinary per-booking quotation pipeline. Applying the
rate to a live quote is out of scope for this phase; this establishes
the relationship and rate the provider has agreed with the customer.
"""

from alembic import op

revision = "0063"
down_revision = "0062"


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS "PROVIDER_BUSINESS_CUSTOMERS" (
            record_id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            provider_id           UUID NOT NULL REFERENCES "PROVIDERS"(provider_id) ON DELETE CASCADE,
            customer_id           UUID NOT NULL REFERENCES "CUSTOMERS"(customer_id) ON DELETE CASCADE,
            company_name          VARCHAR(200),
            negotiated_rate_type  VARCHAR(20) NOT NULL DEFAULT 'PERCENT_DISCOUNT',
            negotiated_rate_value NUMERIC(10,2) NOT NULL,
            notes                 VARCHAR(2000),
            status                VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
            created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
            CONSTRAINT "UQ_PROVIDER_BUSINESS_CUSTOMER" UNIQUE (provider_id, customer_id),
            CONSTRAINT "CHK_PROVIDER_BUSINESS_RATE_TYPE"
                CHECK (negotiated_rate_type IN ('PERCENT_DISCOUNT', 'FIXED_RATE')),
            CONSTRAINT "CHK_PROVIDER_BUSINESS_RATE_VALUE" CHECK (negotiated_rate_value >= 0)
        )
        """
    )
    op.execute(
        'CREATE INDEX IF NOT EXISTS "IX_PROVIDER_BUSINESS_CUSTOMERS_PROVIDER" '
        'ON "PROVIDER_BUSINESS_CUSTOMERS" (provider_id, status, created_at DESC)'
    )


def downgrade() -> None:
    op.execute('DROP TABLE IF EXISTS "PROVIDER_BUSINESS_CUSTOMERS"')
