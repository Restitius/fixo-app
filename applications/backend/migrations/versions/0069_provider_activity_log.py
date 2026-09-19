"""Provider activity & audit history (Phase 51).

PROVIDER_ACTIVITY_LOG — a generic, append-only log of significant
provider-account actions. Write access is internal-only (services call
it directly); providers can only read their own entries. Initial
producers are the two security-sensitive actions added in Phase 50
(password change, session revocation) — this establishes the log
itself rather than retrofitting every prior module's write paths,
which would be a much larger, separate undertaking.
"""

from alembic import op

revision = "0069"
down_revision = "0068"


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS "PROVIDER_ACTIVITY_LOG" (
            log_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            provider_id UUID NOT NULL REFERENCES "PROVIDERS"(provider_id) ON DELETE CASCADE,
            action      VARCHAR(80) NOT NULL,
            entity_type VARCHAR(40),
            entity_id   UUID,
            metadata    JSONB,
            created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
        )
        """
    )
    op.execute(
        'CREATE INDEX IF NOT EXISTS "IX_PROVIDER_ACTIVITY_LOG_PROVIDER" '
        'ON "PROVIDER_ACTIVITY_LOG" (provider_id, created_at DESC)'
    )


def downgrade() -> None:
    op.execute('DROP TABLE IF EXISTS "PROVIDER_ACTIVITY_LOG"')
