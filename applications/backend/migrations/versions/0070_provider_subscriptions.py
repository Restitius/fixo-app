"""Provider subscription / plans (Phase 52).

PROVIDER_PLANS — platform-managed catalogue of subscription tiers.
PROVIDER_SUBSCRIPTIONS — a provider's subscription history; at most one
ACTIVE row per provider (partial unique index). Not wired into live
commission calculation or feature gating in other modules — that
cross-cutting integration is a separate, larger undertaking. This phase
establishes the catalogue and subscription lifecycle only.
"""

from alembic import op

revision = "0070"
down_revision = "0069"


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS "PROVIDER_PLANS" (
            plan_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            code              VARCHAR(30) NOT NULL UNIQUE,
            name              VARCHAR(120) NOT NULL,
            description       VARCHAR(500),
            price_monthly     NUMERIC(10,2) NOT NULL DEFAULT 0,
            max_team_members  INTEGER,
            is_active         BOOLEAN NOT NULL DEFAULT TRUE,
            sort_order        SMALLINT NOT NULL DEFAULT 0,
            created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
        )
        """
    )
    op.execute(
        """
        INSERT INTO "PROVIDER_PLANS" (code, name, description, price_monthly, max_team_members, sort_order) VALUES
            ('FREE',    'Free',    'Get started at no cost.',                         0,      1,    1),
            ('BASIC',   'Basic',   'For small, growing teams.',                       15000,  5,    2),
            ('PRO',     'Pro',     'For established providers with larger teams.',    45000,  20,   3),
            ('PREMIUM', 'Premium', 'Unlimited team size and priority placement.',     95000,  NULL, 4)
        ON CONFLICT (code) DO NOTHING
        """
    )

    op.execute(
        """
        CREATE TABLE IF NOT EXISTS "PROVIDER_SUBSCRIPTIONS" (
            subscription_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            provider_id         UUID NOT NULL REFERENCES "PROVIDERS"(provider_id) ON DELETE CASCADE,
            plan_id             UUID NOT NULL REFERENCES "PROVIDER_PLANS"(plan_id) ON DELETE RESTRICT,
            status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
            started_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
            current_period_end  TIMESTAMPTZ,
            cancelled_at        TIMESTAMPTZ,
            created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
            CONSTRAINT "CHK_PROVIDER_SUBSCRIPTION_STATUS"
                CHECK (status IN ('ACTIVE', 'CANCELLED', 'EXPIRED'))
        )
        """
    )
    op.execute(
        'CREATE UNIQUE INDEX IF NOT EXISTS "UQ_PROVIDER_SUBSCRIPTION_ACTIVE" '
        'ON "PROVIDER_SUBSCRIPTIONS" (provider_id) WHERE status = \'ACTIVE\''
    )
    op.execute(
        'CREATE INDEX IF NOT EXISTS "IX_PROVIDER_SUBSCRIPTIONS_PROVIDER" '
        'ON "PROVIDER_SUBSCRIPTIONS" (provider_id, created_at DESC)'
    )


def downgrade() -> None:
    op.execute('DROP TABLE IF EXISTS "PROVIDER_SUBSCRIPTIONS"')
    op.execute('DROP TABLE IF EXISTS "PROVIDER_PLANS"')
