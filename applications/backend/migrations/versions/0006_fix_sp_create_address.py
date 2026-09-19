"""phase4 fix — SP_CREATE_ADDRESS variable-conflict directive.

Revision ID: 0006_fix_sp_create_address
Revises: 0005_phase4_service_requests

RETURNS TABLE(...) introduces OUT params named like real columns, which makes
bare references inside RETURNING ambiguous for plpgsql. '#variable_conflict
use_column' resolves them to table columns (all function params are p_-prefixed,
so nothing else collides).
"""
from __future__ import annotations

from alembic import op

revision = "0006_fix_sp_create_address"
down_revision = "0005_phase4_service_requests"
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
        #variable_conflict use_column
        BEGIN
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


def downgrade() -> None:
    pass  # prior version had identical behaviour minus the directive