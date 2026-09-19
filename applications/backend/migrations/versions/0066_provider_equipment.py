"""Provider equipment & tools registry (Phase 46).

PROVIDER_EQUIPMENT — a provider's tools/equipment, optionally checked out
to a team member (Phase 44).
"""

from alembic import op

revision = "0066"
down_revision = "0065"


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS "PROVIDER_EQUIPMENT" (
            equipment_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            provider_id         UUID NOT NULL REFERENCES "PROVIDERS"(provider_id) ON DELETE CASCADE,
            name                VARCHAR(150) NOT NULL,
            category            VARCHAR(30) NOT NULL DEFAULT 'OTHER',
            serial_number       VARCHAR(100),
            condition           VARCHAR(20) NOT NULL DEFAULT 'GOOD',
            status              VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
            assigned_member_id  UUID REFERENCES "PROVIDER_TEAM_MEMBERS"(member_id) ON DELETE SET NULL,
            purchase_date       DATE,
            notes               VARCHAR(2000),
            created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
            CONSTRAINT "CHK_PROVIDER_EQUIPMENT_CATEGORY"
                CHECK (category IN ('POWER_TOOL', 'VEHICLE', 'SAFETY_GEAR', 'DIAGNOSTIC', 'OTHER')),
            CONSTRAINT "CHK_PROVIDER_EQUIPMENT_CONDITION"
                CHECK (condition IN ('NEW', 'GOOD', 'FAIR', 'POOR')),
            CONSTRAINT "CHK_PROVIDER_EQUIPMENT_STATUS"
                CHECK (status IN ('AVAILABLE', 'IN_USE', 'MAINTENANCE', 'RETIRED'))
        )
        """
    )
    op.execute(
        'CREATE INDEX IF NOT EXISTS "IX_PROVIDER_EQUIPMENT_PROVIDER" '
        'ON "PROVIDER_EQUIPMENT" (provider_id, status, created_at DESC)'
    )
    op.execute(
        'CREATE INDEX IF NOT EXISTS "IX_PROVIDER_EQUIPMENT_MEMBER" '
        'ON "PROVIDER_EQUIPMENT" (assigned_member_id) WHERE assigned_member_id IS NOT NULL'
    )


def downgrade() -> None:
    op.execute('DROP TABLE IF EXISTS "PROVIDER_EQUIPMENT"')
