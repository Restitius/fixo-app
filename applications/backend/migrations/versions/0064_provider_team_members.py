"""Provider team management - workers/roles (Phase 44).

PROVIDER_TEAM_MEMBERS — a provider's roster of workers/technicians with a
role, managed by the provider account (the owner). This establishes a
stable member_id that Job Assignment (Phase 45) will reference; it does
not itself grant the member independent login credentials.
"""

from alembic import op

revision = "0064"
down_revision = "0063"


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS "PROVIDER_TEAM_MEMBERS" (
            member_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            provider_id UUID NOT NULL REFERENCES "PROVIDERS"(provider_id) ON DELETE CASCADE,
            full_name   VARCHAR(120) NOT NULL,
            phone       VARCHAR(20) NOT NULL,
            email       VARCHAR(180),
            role        VARCHAR(20) NOT NULL DEFAULT 'TECHNICIAN',
            status      VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
            notes       VARCHAR(2000),
            created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
            CONSTRAINT "UQ_PROVIDER_TEAM_MEMBER_PHONE" UNIQUE (provider_id, phone),
            CONSTRAINT "CHK_PROVIDER_TEAM_MEMBER_ROLE"
                CHECK (role IN ('OWNER', 'MANAGER', 'TECHNICIAN', 'DISPATCHER', 'OTHER')),
            CONSTRAINT "CHK_PROVIDER_TEAM_MEMBER_STATUS"
                CHECK (status IN ('ACTIVE', 'INACTIVE'))
        )
        """
    )
    op.execute(
        'CREATE INDEX IF NOT EXISTS "IX_PROVIDER_TEAM_MEMBERS_PROVIDER" '
        'ON "PROVIDER_TEAM_MEMBERS" (provider_id, status, created_at DESC)'
    )


def downgrade() -> None:
    op.execute('DROP TABLE IF EXISTS "PROVIDER_TEAM_MEMBERS"')
