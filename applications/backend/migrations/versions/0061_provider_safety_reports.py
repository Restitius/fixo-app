"""Provider safety & incident reports (Phase 41).

PROVIDER_SAFETY_REPORTS — provider-filed safety/incident reports, optionally
tied to a booking. A provider can escalate a serious report to platform
administrators; resolution stays platform/admin-side, mirroring the
Disputes (Phase 39) convention.
"""

from alembic import op

revision = "0061"
down_revision = "0060"


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS "PROVIDER_SAFETY_REPORTS" (
            report_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            report_number VARCHAR(24) NOT NULL UNIQUE
                          DEFAULT 'SFR-' || to_char(now(), 'YYMMDDHH24MI') || '-' || upper(substr(md5(random()::text), 1, 4)),
            provider_id   UUID NOT NULL REFERENCES "PROVIDERS"(provider_id) ON DELETE CASCADE,
            booking_id    UUID REFERENCES "BOOKINGS"(booking_id) ON DELETE SET NULL,
            category      VARCHAR(30) NOT NULL DEFAULT 'OTHER',
            severity      VARCHAR(20) NOT NULL DEFAULT 'LOW',
            description   TEXT NOT NULL,
            status        VARCHAR(20) NOT NULL DEFAULT 'OPEN',
            escalated_at  TIMESTAMPTZ,
            resolution    TEXT,
            created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
        )
        """
    )
    op.execute(
        'CREATE INDEX IF NOT EXISTS "IX_PROVIDER_SAFETY_REPORTS_PROVIDER" '
        'ON "PROVIDER_SAFETY_REPORTS" (provider_id, created_at DESC)'
    )
    op.execute(
        'CREATE INDEX IF NOT EXISTS "IX_PROVIDER_SAFETY_REPORTS_BOOKING" '
        'ON "PROVIDER_SAFETY_REPORTS" (booking_id) WHERE booking_id IS NOT NULL'
    )


def downgrade() -> None:
    op.execute('DROP TABLE IF EXISTS "PROVIDER_SAFETY_REPORTS"')
