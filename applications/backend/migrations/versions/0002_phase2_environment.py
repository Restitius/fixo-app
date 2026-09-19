"""phase2 customer environment — addresses, properties, property rooms.

Revision ID: 0002_phase2_environment
Revises: 0001_phase1_entry
Create Date: 2026-08-25

Raw DDL per architecture rules: CAPITAL quoted table names, no ORM.
"""
from __future__ import annotations

from alembic import op

revision = "0002_phase2_environment"
down_revision = "0001_phase1_entry"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ------------------------- CUSTOMER ADDRESSES ---------------------------
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS "CUSTOMER_ADDRESSES" (
            address_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            customer_id           UUID         NOT NULL REFERENCES "CUSTOMERS"(customer_id) ON DELETE CASCADE,
            label                 VARCHAR(40)  NOT NULL,
            recipient_name        VARCHAR(120) NOT NULL,
            phone                 VARCHAR(20)  NOT NULL,
            street_address        VARCHAR(255) NOT NULL,
            city                  VARCHAR(80)  NOT NULL,
            region                VARCHAR(80),
            postal_code           VARCHAR(20),
            latitude              NUMERIC(9, 6),
            longitude             NUMERIC(9, 6),
            delivery_instructions VARCHAR(500),
            is_default            BOOLEAN      NOT NULL DEFAULT FALSE,
            deleted_at            TIMESTAMPTZ,
            created_at            TIMESTAMPTZ  NOT NULL DEFAULT now(),
            updated_at            TIMESTAMPTZ  NOT NULL DEFAULT now()
        )
        """
    )
    op.execute(
        'CREATE INDEX IF NOT EXISTS "IX_ADDR_CUSTOMER" '
        'ON "CUSTOMER_ADDRESSES" (customer_id, deleted_at)'
    )
    # DB-level guarantee: at most ONE default address per customer.
    op.execute(
        'CREATE UNIQUE INDEX IF NOT EXISTS "UX_ADDR_SINGLE_DEFAULT" '
        'ON "CUSTOMER_ADDRESSES" (customer_id) '
        'WHERE is_default AND deleted_at IS NULL'
    )

    # ----------------------------- PROPERTIES -------------------------------
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS "PROPERTIES" (
            property_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            customer_id   UUID         NOT NULL REFERENCES "CUSTOMERS"(customer_id) ON DELETE CASCADE,
            name          VARCHAR(120) NOT NULL,
            property_type VARCHAR(30)  NOT NULL DEFAULT 'HOUSE',
            address_id    UUID REFERENCES "CUSTOMER_ADDRESSES"(address_id) ON DELETE SET NULL,
            bedrooms      SMALLINT,
            bathrooms     SMALLINT,
            year_built    SMALLINT,
            notes         VARCHAR(1000),
            is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
            created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
            updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
        )
        """
    )
    op.execute(
        'CREATE INDEX IF NOT EXISTS "IX_PROPERTY_CUSTOMER" ON "PROPERTIES" (customer_id, is_active)'
    )
    op.execute(
        'ALTER TABLE "PROPERTIES" DROP CONSTRAINT IF EXISTS "CK_PROPERTY_TYPE"'
    )
    op.execute(
        'ALTER TABLE "PROPERTIES" ADD CONSTRAINT "CK_PROPERTY_TYPE" '
        "CHECK (property_type IN ('HOUSE', 'APARTMENT', 'CONDO', 'OFFICE', 'OTHER'))"
    )

    # --------------------------- PROPERTY ROOMS -----------------------------
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS "PROPERTY_ROOMS" (
            room_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            property_id   UUID         NOT NULL REFERENCES "PROPERTIES"(property_id) ON DELETE CASCADE,
            room_type     VARCHAR(30)  NOT NULL,
            name          VARCHAR(80)  NOT NULL,
            notes         VARCHAR(500),
            created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
        )
        """
    )
    op.execute(
        'CREATE INDEX IF NOT EXISTS "IX_ROOM_PROPERTY" ON "PROPERTY_ROOMS" (property_id)'
    )


def downgrade() -> None:
    op.execute('DROP TABLE IF EXISTS "PROPERTY_ROOMS"')
    op.execute('DROP TABLE IF EXISTS "PROPERTIES"')
    op.execute('DROP TABLE IF EXISTS "CUSTOMER_ADDRESSES"')