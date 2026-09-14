"""Provider account closure (Phase 54).

Mirrors the customer-side ACCOUNT_CLOSURES table and SP_DELETE_ACCOUNT
function (0017_phase15_account) for providers: adds PROVIDERS.deleted_at
/is_deleted (previously absent), PROVIDER_ACCOUNT_CLOSURES, and
SP_DELETE_PROVIDER_ACCOUNT. Same scope and limitations as the customer
side — a schedule-only action; there is no reversal endpoint on the
customer side either despite the table carrying reversal columns, and
this phase does not touch provider auth/login logic (consistent with
Phase 53 leaving PROVIDERS.status/enforcement alone).
"""

from alembic import op

revision = "0072"
down_revision = "0071"


def upgrade() -> None:
    op.execute('ALTER TABLE "PROVIDERS" ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ')
    op.execute(
        'ALTER TABLE "PROVIDERS" ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE'
    )

    op.execute(
        """
        CREATE TABLE IF NOT EXISTS "PROVIDER_ACCOUNT_CLOSURES" (
            closure_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            provider_id  UUID NOT NULL REFERENCES "PROVIDERS"(provider_id) ON DELETE CASCADE,
            reason       TEXT NOT NULL,
            scheduled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            executed_at  TIMESTAMPTZ,
            reversed_at  TIMESTAMPTZ,
            is_reversal  BOOLEAN NOT NULL DEFAULT FALSE,
            UNIQUE (provider_id, scheduled_at, is_reversal)
        )
        """
    )
    op.execute(
        'CREATE INDEX IF NOT EXISTS "IX_PROVIDER_CLOSURES_PROVIDER" '
        'ON "PROVIDER_ACCOUNT_CLOSURES" (provider_id)'
    )

    op.execute(
        """
        CREATE OR REPLACE FUNCTION SP_DELETE_PROVIDER_ACCOUNT(p_provider_id UUID)
        RETURNS TABLE(closed BOOLEAN, reversible BOOLEAN)
        LANGUAGE plpgsql AS $$
        BEGIN
            INSERT INTO "PROVIDER_ACCOUNT_CLOSURES" (provider_id, reason, scheduled_at)
            VALUES (p_provider_id, 'provider_requested', now());
            UPDATE "PROVIDERS"
               SET deleted_at = now(), is_deleted = TRUE
             WHERE provider_id = p_provider_id;
            RETURN QUERY SELECT TRUE, TRUE;
        END;
        $$;
        """
    )


def downgrade() -> None:
    op.execute('DROP FUNCTION IF EXISTS SP_DELETE_PROVIDER_ACCOUNT(UUID)')
    op.execute('DROP TABLE IF EXISTS "PROVIDER_ACCOUNT_CLOSURES"')
    op.execute('ALTER TABLE "PROVIDERS" DROP COLUMN IF EXISTS is_deleted')
    op.execute('ALTER TABLE "PROVIDERS" DROP COLUMN IF EXISTS deleted_at')
