"""Provider support tickets (Phase 40).

Mirrors the customer SUPPORT_TICKETS/TICKET_MESSAGES pattern (0016) as a
dedicated provider-owned domain: PROVIDER_SUPPORT_TICKETS and
PROVIDER_TICKET_MESSAGES, both scoped to PROVIDERS(provider_id).
"""

from alembic import op

revision = "0060"
down_revision = "0054"


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS "PROVIDER_SUPPORT_TICKETS" (
            ticket_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            ticket_number VARCHAR(24) NOT NULL UNIQUE
                          DEFAULT 'PSP-' || to_char(now(), 'YYMMDDHH24MI') || '-' || upper(substr(md5(random()::text), 1, 4)),
            provider_id   UUID NOT NULL REFERENCES "PROVIDERS"(provider_id) ON DELETE CASCADE,
            subject       VARCHAR(200) NOT NULL,
            category      VARCHAR(40) NOT NULL DEFAULT 'GENERAL',
            priority      VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
            status        VARCHAR(20) NOT NULL DEFAULT 'OPEN',
            resolution    TEXT,
            created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
        )
        """
    )
    op.execute(
        'CREATE INDEX IF NOT EXISTS "IX_PROVIDER_SUPPORT_TICKETS_PROVIDER" '
        'ON "PROVIDER_SUPPORT_TICKETS" (provider_id, created_at DESC)'
    )
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS "PROVIDER_TICKET_MESSAGES" (
            message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            ticket_id  UUID NOT NULL REFERENCES "PROVIDER_SUPPORT_TICKETS"(ticket_id) ON DELETE CASCADE,
            sender     VARCHAR(20) NOT NULL DEFAULT 'PROVIDER',
            body       TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
        """
    )
    op.execute(
        'CREATE INDEX IF NOT EXISTS "IX_PROVIDER_TICKET_MSG" '
        'ON "PROVIDER_TICKET_MESSAGES" (ticket_id, created_at)'
    )


def downgrade() -> None:
    op.execute('DROP TABLE IF EXISTS "PROVIDER_TICKET_MESSAGES"')
    op.execute('DROP TABLE IF EXISTS "PROVIDER_SUPPORT_TICKETS"')
