"""Make notification inbox writes idempotent and delivery retries claimable."""

from alembic import op

revision = "0074"
down_revision = "0073"


def upgrade() -> None:
    op.execute('ALTER TABLE "NOTIFICATION_OUTBOX" ADD COLUMN claimed_at TIMESTAMPTZ')
    op.execute(
        'UPDATE "NOTIFICATION_OUTBOX" '
        "SET claimed_at = now() - interval '6 minutes' WHERE status = 'processing'"
    )
    op.execute(
        'ALTER TABLE "NOTIFICATION_DELIVERY_ATTEMPTS" '
        "ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now()"
    )
    op.execute(
        'ALTER TABLE "CUSTOMER_NOTIFICATIONS" '
        'ADD COLUMN outbox_id UUID REFERENCES "NOTIFICATION_OUTBOX"(outbox_id)'
    )
    op.execute(
        'CREATE UNIQUE INDEX "UQ_CUSTOMER_NOTIFICATIONS_OUTBOX" '
        'ON "CUSTOMER_NOTIFICATIONS" (outbox_id) WHERE outbox_id IS NOT NULL'
    )
    op.execute(
        'ALTER TABLE "PROVIDER_NOTIFICATIONS" '
        'ADD COLUMN outbox_id UUID REFERENCES "NOTIFICATION_OUTBOX"(outbox_id)'
    )
    op.execute(
        'CREATE UNIQUE INDEX "UQ_PROVIDER_NOTIFICATIONS_OUTBOX" '
        'ON "PROVIDER_NOTIFICATIONS" (outbox_id) WHERE outbox_id IS NOT NULL'
    )
    # A booking can produce several distinct notification events over its life.
    op.execute('DROP INDEX IF EXISTS "uq_notifications_reference"')
    op.execute('ALTER TABLE "NOTIFICATION_DELIVERY_ATTEMPTS" DROP CONSTRAINT "CK_DELIVERY_STATUS"')
    op.execute(
        'ALTER TABLE "NOTIFICATION_DELIVERY_ATTEMPTS" '
        'ADD CONSTRAINT "CK_DELIVERY_STATUS" '
        "CHECK (status IN ('pending', 'processing', 'submitted', 'delivered', 'failed'))"
    )


def downgrade() -> None:
    op.execute(
        "UPDATE \"NOTIFICATION_DELIVERY_ATTEMPTS\" SET status = 'failed' "
        "WHERE status IN ('processing', 'submitted')"
    )
    op.execute('ALTER TABLE "NOTIFICATION_DELIVERY_ATTEMPTS" DROP CONSTRAINT "CK_DELIVERY_STATUS"')
    op.execute(
        'ALTER TABLE "NOTIFICATION_DELIVERY_ATTEMPTS" '
        'ADD CONSTRAINT "CK_DELIVERY_STATUS" '
        "CHECK (status IN ('pending', 'delivered', 'failed'))"
    )
    op.execute(
        'CREATE UNIQUE INDEX "uq_notifications_reference" '
        'ON "PROVIDER_NOTIFICATIONS" ("provider_id", "reference_type", "reference_id") '
        'WHERE "reference_type" IS NOT NULL AND "reference_id" IS NOT NULL'
    )
    op.execute('DROP INDEX "UQ_PROVIDER_NOTIFICATIONS_OUTBOX"')
    op.execute('ALTER TABLE "PROVIDER_NOTIFICATIONS" DROP COLUMN outbox_id')
    op.execute('DROP INDEX "UQ_CUSTOMER_NOTIFICATIONS_OUTBOX"')
    op.execute('ALTER TABLE "CUSTOMER_NOTIFICATIONS" DROP COLUMN outbox_id')
    op.execute('ALTER TABLE "NOTIFICATION_DELIVERY_ATTEMPTS" DROP COLUMN updated_at')
    op.execute('ALTER TABLE "NOTIFICATION_OUTBOX" DROP COLUMN claimed_at')
