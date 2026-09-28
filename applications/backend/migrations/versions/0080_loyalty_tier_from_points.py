"""Derive LOYALTY_ACCOUNTS.tier from the points balance.

The tier column was written once (default SILVER) and never recalculated, so an
account with 100,000 points was still "Silver" and a new one started at Silver.
A trigger now sets the tier on every insert and points change, so it stays correct
no matter which code path moves the points. Thresholds are the ones the customer
apps display: Bronze 0, Silver 1,000, Gold 3,000, Platinum 6,000.
"""

from alembic import op

revision = "0080"
down_revision = "0079"


def upgrade() -> None:
    op.execute(
        """
        CREATE OR REPLACE FUNCTION "SP_SET_LOYALTY_TIER"() RETURNS trigger
        LANGUAGE plpgsql AS $$
        BEGIN
            NEW.tier := CASE
                WHEN NEW.points_balance >= 6000 THEN 'PLATINUM'
                WHEN NEW.points_balance >= 3000 THEN 'GOLD'
                WHEN NEW.points_balance >= 1000 THEN 'SILVER'
                ELSE 'BRONZE'
            END;
            RETURN NEW;
        END;
        $$;
        """
    )
    op.execute('DROP TRIGGER IF EXISTS "TR_LOYALTY_TIER" ON "LOYALTY_ACCOUNTS"')
    op.execute(
        """
        CREATE TRIGGER "TR_LOYALTY_TIER"
        BEFORE INSERT OR UPDATE OF points_balance ON "LOYALTY_ACCOUNTS"
        FOR EACH ROW EXECUTE FUNCTION "SP_SET_LOYALTY_TIER"()
        """
    )
    # Bring existing accounts in line (fires the trigger).
    op.execute('UPDATE "LOYALTY_ACCOUNTS" SET points_balance = points_balance')


def downgrade() -> None:
    op.execute('DROP TRIGGER IF EXISTS "TR_LOYALTY_TIER" ON "LOYALTY_ACCOUNTS"')
    op.execute('DROP FUNCTION IF EXISTS "SP_SET_LOYALTY_TIER"()')
