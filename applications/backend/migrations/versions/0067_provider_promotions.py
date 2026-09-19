"""Provider promotions (Phase 48).

PROVIDER_PROMOTIONS — a provider's own discount codes for their services,
distinct from the platform-wide PROMOTIONS table (Phase 12), which has no
provider ownership.
"""

from alembic import op

revision = "0067"
down_revision = "0066"


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS "PROVIDER_PROMOTIONS" (
            promo_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            provider_id    UUID NOT NULL REFERENCES "PROVIDERS"(provider_id) ON DELETE CASCADE,
            code           VARCHAR(40) NOT NULL,
            name           VARCHAR(120) NOT NULL,
            description    VARCHAR(500),
            discount_type  VARCHAR(20) NOT NULL,
            discount_value NUMERIC(12,2) NOT NULL,
            min_amount     NUMERIC(12,2) NOT NULL DEFAULT 0,
            max_discount   NUMERIC(12,2),
            usage_limit    INTEGER,
            used_count     INTEGER NOT NULL DEFAULT 0,
            valid_from     TIMESTAMPTZ NOT NULL,
            valid_until    TIMESTAMPTZ NOT NULL,
            active         BOOLEAN NOT NULL DEFAULT TRUE,
            created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
            CONSTRAINT "UQ_PROVIDER_PROMO_CODE" UNIQUE (provider_id, code),
            CONSTRAINT "CHK_PROVIDER_PROMO_TYPE" CHECK (discount_type IN ('PERCENT', 'FIXED_AMOUNT')),
            CONSTRAINT "CHK_PROVIDER_PROMO_VALUE" CHECK (discount_value >= 0),
            CONSTRAINT "CHK_PROVIDER_PROMO_DATES" CHECK (valid_until > valid_from)
        )
        """
    )
    op.execute(
        'CREATE INDEX IF NOT EXISTS "IX_PROVIDER_PROMOTIONS_PROVIDER" '
        'ON "PROVIDER_PROMOTIONS" (provider_id, active, valid_until DESC)'
    )


def downgrade() -> None:
    op.execute('DROP TABLE IF EXISTS "PROVIDER_PROMOTIONS"')
