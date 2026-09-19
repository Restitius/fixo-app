"""Provider account restrictions & status (Phase 53).

PROVIDER_ACCOUNT_RESTRICTIONS — a log of platform-imposed restrictions
on a provider account (warnings, suspensions, feature limits, bans).
Imposing/lifting a restriction is a platform/admin action (mirroring
Disputes' "resolution stays platform-side" convention from Phase 39);
this phase gives providers read-only visibility into their own record.
Deliberately does not modify PROVIDERS.status or touch auth/login
logic — wiring restrictions into live enforcement (blocking login,
blocking bookings, etc.) is a separate, larger, higher-risk undertaking.
"""

from alembic import op

revision = "0071"
down_revision = "0070"


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS "PROVIDER_ACCOUNT_RESTRICTIONS" (
            restriction_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            provider_id      UUID NOT NULL REFERENCES "PROVIDERS"(provider_id) ON DELETE CASCADE,
            restriction_type VARCHAR(20) NOT NULL,
            reason           TEXT NOT NULL,
            status           VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
            imposed_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
            expires_at       TIMESTAMPTZ,
            lifted_at        TIMESTAMPTZ,
            lifted_reason    TEXT,
            created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
            CONSTRAINT "CHK_PROVIDER_RESTRICTION_TYPE"
                CHECK (restriction_type IN ('WARNING', 'SUSPENSION', 'FEATURE_LIMIT', 'BAN')),
            CONSTRAINT "CHK_PROVIDER_RESTRICTION_STATUS"
                CHECK (status IN ('ACTIVE', 'LIFTED', 'EXPIRED'))
        )
        """
    )
    op.execute(
        'CREATE INDEX IF NOT EXISTS "IX_PROVIDER_RESTRICTIONS_PROVIDER" '
        'ON "PROVIDER_ACCOUNT_RESTRICTIONS" (provider_id, status, imposed_at DESC)'
    )


def downgrade() -> None:
    op.execute('DROP TABLE IF EXISTS "PROVIDER_ACCOUNT_RESTRICTIONS"')
