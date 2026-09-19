"""Notification delivery infrastructure — outbox, delivery attempts, webhook receipts.

Adds the durable-delivery layer for the notification catalogue: a
NOTIFICATION_OUTBOX row is written atomically (via CTE, in the same
statement as the triggering business write) so a crash between "state
changed" and "notification sent" can never silently lose the notification.
A scheduler job drains the outbox; each channel attempt is recorded in
NOTIFICATION_DELIVERY_ATTEMPTS so retries and webhook callbacks (via
WEBHOOK_RECEIPTS, deduplicated on provider+message_id+event) can be
reconciled back to a specific attempt by provider_reference.

Does not touch CUSTOMER_NOTIFICATIONS or PROVIDER_NOTIFICATIONS (both
already exist) — those remain the "database channel" destination that
the outbox drain writes into.
"""

from alembic import op

revision = "0073"
down_revision = "0072"


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS "NOTIFICATION_OUTBOX" (
            outbox_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            event_key      VARCHAR(80)  NOT NULL,
            recipient_type VARCHAR(16)  NOT NULL,
            recipient_id   UUID         NOT NULL,
            payload        JSONB        NOT NULL DEFAULT '{}'::jsonb,
            status         VARCHAR(16)  NOT NULL DEFAULT 'pending',
            created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
            dispatched_at  TIMESTAMPTZ,
            CONSTRAINT "CK_OUTBOX_RECIPIENT_TYPE" CHECK (recipient_type IN ('customer', 'provider')),
            CONSTRAINT "CK_OUTBOX_STATUS" CHECK (status IN ('pending', 'processing', 'dispatched', 'failed'))
        )
        """
    )
    op.execute(
        'CREATE INDEX IF NOT EXISTS "IX_OUTBOX_PENDING" '
        'ON "NOTIFICATION_OUTBOX" (status, created_at) WHERE status = \'pending\''
    )

    op.execute(
        """
        CREATE TABLE IF NOT EXISTS "NOTIFICATION_DELIVERY_ATTEMPTS" (
            attempt_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            outbox_id          UUID NOT NULL REFERENCES "NOTIFICATION_OUTBOX"(outbox_id) ON DELETE CASCADE,
            channel            VARCHAR(16) NOT NULL,
            provider_reference VARCHAR(120),
            status             VARCHAR(16) NOT NULL DEFAULT 'pending',
            attempt_no         SMALLINT NOT NULL DEFAULT 1,
            next_retry_at      TIMESTAMPTZ,
            failure_reason     VARCHAR(500),
            created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
            CONSTRAINT "CK_DELIVERY_CHANNEL" CHECK (channel IN ('database', 'sms', 'email')),
            CONSTRAINT "CK_DELIVERY_STATUS" CHECK (status IN ('pending', 'delivered', 'failed'))
        )
        """
    )
    op.execute(
        'CREATE INDEX IF NOT EXISTS "IX_DELIVERY_ATTEMPTS_OUTBOX" '
        'ON "NOTIFICATION_DELIVERY_ATTEMPTS" (outbox_id)'
    )
    op.execute(
        'CREATE INDEX IF NOT EXISTS "IX_DELIVERY_ATTEMPTS_RETRY" '
        'ON "NOTIFICATION_DELIVERY_ATTEMPTS" (next_retry_at) WHERE status = \'pending\''
    )
    op.execute(
        'CREATE UNIQUE INDEX IF NOT EXISTS "UQ_DELIVERY_ATTEMPTS_PROVIDER_REF" '
        'ON "NOTIFICATION_DELIVERY_ATTEMPTS" (channel, provider_reference) '
        "WHERE provider_reference IS NOT NULL"
    )

    op.execute(
        """
        CREATE TABLE IF NOT EXISTS "WEBHOOK_RECEIPTS" (
            receipt_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            provider    VARCHAR(40)  NOT NULL,
            message_id  VARCHAR(120) NOT NULL,
            event       VARCHAR(40)  NOT NULL,
            payload     JSONB        NOT NULL DEFAULT '{}'::jsonb,
            received_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
            UNIQUE (provider, message_id, event)
        )
        """
    )


def downgrade() -> None:
    op.execute('DROP TABLE IF EXISTS "WEBHOOK_RECEIPTS"')
    op.execute('DROP TABLE IF EXISTS "NOTIFICATION_DELIVERY_ATTEMPTS"')
    op.execute('DROP TABLE IF EXISTS "NOTIFICATION_OUTBOX"')
