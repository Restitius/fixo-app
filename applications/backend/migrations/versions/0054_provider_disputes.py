"""Provider disputes (Requirement Phase 39).

Extends the customer DISPUTES surface with a provider side:

- Adds `provider_id` to `DISPUTES` so provider-owned dispute views are direct
  (backfilled from `BOOKINGS.provider_id` for existing rows).
- `PROVIDER_DISPUTE_RESPONSES` — provider-supplied responses to disputes on
  their bookings (body, kind: acknowledgment/explanation/refund_offer,
  timestamps). Dispute resolution stays platform/admin-side in this phase.
"""

from alembic import op

revision = "0054"
down_revision = "0053"


def upgrade() -> None:
    op.execute('ALTER TABLE "DISPUTES" ADD COLUMN IF NOT EXISTS provider_id UUID')
    op.execute(
        'UPDATE "DISPUTES" d SET provider_id = b.provider_id '
        'FROM "BOOKINGS" b WHERE b.booking_id = d.booking_id AND d.provider_id IS NULL'
    )
    op.execute(
        'CREATE INDEX IF NOT EXISTS "IX_DISPUTE_PROVIDER" '
        'ON "DISPUTES" (provider_id, created_at DESC)'
    )
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS "PROVIDER_DISPUTE_RESPONSES" (
            response_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            dispute_id  UUID NOT NULL REFERENCES "DISPUTES"(dispute_id) ON DELETE CASCADE,
            provider_id UUID NOT NULL REFERENCES "PROVIDERS"(provider_id),
            kind        VARCHAR(30) NOT NULL DEFAULT 'acknowledgment',
            body        TEXT NOT NULL,
            created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
        )
        """
    )
    op.execute(
        'CREATE INDEX IF NOT EXISTS "IX_PDR_DISPUTE" '
        'ON "PROVIDER_DISPUTE_RESPONSES" (dispute_id, created_at)'
    )
    op.execute(
        'CREATE INDEX IF NOT EXISTS "IX_PDR_PROVIDER" '
        'ON "PROVIDER_DISPUTE_RESPONSES" (provider_id, created_at DESC)'
    )


def downgrade() -> None:
    op.execute('DROP TABLE IF EXISTS "PROVIDER_DISPUTE_RESPONSES"')
    op.execute('DROP INDEX IF EXISTS "IX_DISPUTE_PROVIDER"')
    op.execute('ALTER TABLE "DISPUTES" DROP COLUMN IF EXISTS provider_id')