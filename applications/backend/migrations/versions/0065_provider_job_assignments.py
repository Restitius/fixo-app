"""Provider job assignment - dispatch/technician (Phase 45).

PROVIDER_JOB_ASSIGNMENTS — links a booking to one of the provider's team
members (Phase 44). One active assignment per booking; reassigning
updates the existing row rather than creating history (a full audit
trail is Phase 51's concern).
"""

from alembic import op

revision = "0065"
down_revision = "0064"


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS "PROVIDER_JOB_ASSIGNMENTS" (
            assignment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            provider_id   UUID NOT NULL REFERENCES "PROVIDERS"(provider_id) ON DELETE CASCADE,
            booking_id    UUID NOT NULL REFERENCES "BOOKINGS"(booking_id) ON DELETE CASCADE,
            member_id     UUID NOT NULL REFERENCES "PROVIDER_TEAM_MEMBERS"(member_id) ON DELETE RESTRICT,
            status        VARCHAR(20) NOT NULL DEFAULT 'ASSIGNED',
            notes         VARCHAR(2000),
            assigned_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
            CONSTRAINT "UQ_PROVIDER_JOB_ASSIGNMENT_BOOKING" UNIQUE (booking_id),
            CONSTRAINT "CHK_PROVIDER_JOB_ASSIGNMENT_STATUS"
                CHECK (status IN ('ASSIGNED', 'ACKNOWLEDGED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'))
        )
        """
    )
    op.execute(
        'CREATE INDEX IF NOT EXISTS "IX_PROVIDER_JOB_ASSIGNMENTS_PROVIDER" '
        'ON "PROVIDER_JOB_ASSIGNMENTS" (provider_id, status, assigned_at DESC)'
    )
    op.execute(
        'CREATE INDEX IF NOT EXISTS "IX_PROVIDER_JOB_ASSIGNMENTS_MEMBER" '
        'ON "PROVIDER_JOB_ASSIGNMENTS" (member_id, status)'
    )


def downgrade() -> None:
    op.execute('DROP TABLE IF EXISTS "PROVIDER_JOB_ASSIGNMENTS"')
