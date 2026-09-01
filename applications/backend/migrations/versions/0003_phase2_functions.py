"""phase2 functions — atomic address operations as PL/pgSQL.

Revision ID: 0003_phase2_functions
Revises: 0002_phase2_environment

CTE-wrapped multi-UPDATE shares ONE snapshot in Postgres, so a demote+promote
pair violates UX_ADDR_SINGLE_DEFAULT. Sequential statements inside a function
see each other's effects — this is the correct place for such rules.
"""
from __future__ import annotations

from alembic import op

revision = "0003_phase2_functions"
down_revision = "0002_phase2_environment"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        CREATE OR REPLACE FUNCTION "SP_CREATE_ADDRESS"(
            p_customer_id          uuid,
            p_label                text,
            p_recipient_name       text,
            p_phone                text,
            p_street_address       text,
            p_city                 text,
            p_region               text          DEFAULT NULL,
            p_postal_code          text          DEFAULT NULL,
            p_latitude             numeric       DEFAULT NULL,
            p_longitude            numeric       DEFAULT NULL,
            p_delivery_instr       text          DEFAULT NULL,
            p_is_default           boolean       DEFAULT FALSE
        )
        RETURNS TABLE (
            address_id            uuid,
            label                 varchar,
            recipient_name        varchar,
            phone                 varchar,
            street_address        varchar,
            city                  varchar,
            region                varchar,
            postal_code           varchar,
            latitude              numeric,
            longitude             numeric,
            delivery_instructions varchar,
            is_default            boolean,
            created_at            timestamptz
        )
        LANGUAGE plpgsql AS $$
        BEGIN
            -- Demote the current default BEFORE promoting the new row.
            IF p_is_default THEN
                UPDATE "CUSTOMER_ADDRESSES"
                   SET is_default = FALSE
                 WHERE customer_id = p_customer_id
                   AND is_default
                   AND deleted_at IS NULL;
            END IF;

            RETURN QUERY
            INSERT INTO "CUSTOMER_ADDRESSES" (
                customer_id, label, recipient_name, phone, street_address, city,
                region, postal_code, latitude, longitude, delivery_instructions,
                is_default
            )
            VALUES (
                p_customer_id, p_label, p_recipient_name, p_phone,
                p_street_address, p_city, p_region, p_postal_code,
                p_latitude, p_longitude, p_delivery_instr, p_is_default
            )
            RETURNING
                address_id, label, recipient_name, phone,
                street_address, city, region, postal_code,
                latitude, longitude, delivery_instructions,
                is_default, created_at;
        END;
        $$;
        """
    )

    op.execute(
        """
        CREATE OR REPLACE FUNCTION "SP_SET_DEFAULT_ADDRESS"(
            p_customer_id uuid,
            p_address_id  uuid
        )
        RETURNS boolean
        LANGUAGE plpgsql AS $$
        BEGIN
            UPDATE "CUSTOMER_ADDRESSES"
               SET is_default = FALSE
             WHERE customer_id = p_customer_id
               AND is_default
               AND deleted_at IS NULL;

            UPDATE "CUSTOMER_ADDRESSES"
               SET is_default = TRUE,
                   updated_at = now()
             WHERE address_id = p_address_id
               AND customer_id = p_customer_id
               AND deleted_at IS NULL;

            RETURN FOUND;
        END;
        $$;
        """
    )


def downgrade() -> None:
    op.execute('DROP FUNCTION IF EXISTS "SP_SET_DEFAULT_ADDRESS"(uuid, uuid)')
    op.execute(
        'DROP FUNCTION IF EXISTS "SP_CREATE_ADDRESS"('
        "uuid, text, text, text, text, text, "
        "text, text, numeric, numeric, text, boolean)"
    )