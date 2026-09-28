"""Make customer account closure work.

sp_delete_account updated CUSTOMERS.deleted_at / is_deleted, columns that do not
exist, so every closure request failed with a 500 and nothing was closed. It now
moves the account to CLOSURE_PENDING (login is refused for any status other than
ACTIVE), records the closure request and revokes every active session. Data is
retained, so the closure stays reversible by support during the retention window.
"""

from alembic import op

revision = "0079"
down_revision = "0078"


def upgrade() -> None:
    op.execute(
        """
        CREATE OR REPLACE FUNCTION sp_delete_account(p_customer_id uuid)
        RETURNS TABLE(closed boolean, reversible boolean)
        LANGUAGE plpgsql AS $$
        BEGIN
            UPDATE "CUSTOMERS"
               SET status = 'CLOSURE_PENDING', updated_at = now()
             WHERE customer_id = p_customer_id AND status = 'ACTIVE';
            IF NOT FOUND THEN
                RETURN QUERY SELECT FALSE, FALSE;
                RETURN;
            END IF;

            INSERT INTO "ACCOUNT_CLOSURES" (customer_id, reason, scheduled_at)
            VALUES (p_customer_id, 'customer_requested', now());

            UPDATE "AUTH_SESSIONS" SET revoked_at = now()
             WHERE customer_id = p_customer_id AND revoked_at IS NULL;

            RETURN QUERY SELECT TRUE, TRUE;
        END;
        $$;
        """
    )


def downgrade() -> None:
    # The previous body referenced columns that do not exist; nothing to restore.
    pass
