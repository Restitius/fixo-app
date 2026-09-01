"""phase4 service requests — requests, evidence, service areas.

Revision ID: 0005_phase4_service_requests
Revises: 0004_phase3_catalog
"""
from __future__ import annotations

from alembic import op

revision = "0005_phase4_service_requests"
down_revision = "0004_phase3_catalog"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # --------------------------- SERVICE AREAS ------------------------------
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS "SERVICE_AREAS" (
            area_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            kind      VARCHAR(10) NOT NULL,
            name      VARCHAR(80) NOT NULL,
            is_active BOOLEAN     NOT NULL DEFAULT TRUE
        )
        """
    )
    op.execute('ALTER TABLE "SERVICE_AREAS" DROP CONSTRAINT IF EXISTS "CK_AREA_KIND"')
    op.execute(
        'ALTER TABLE "SERVICE_AREAS" ADD CONSTRAINT "CK_AREA_KIND" '
        "CHECK (kind IN ('REGION', 'CITY'))"
    )
    op.execute(
        """
        INSERT INTO "SERVICE_AREAS" (kind, name)
        SELECT v.kind, v.name FROM (VALUES
            ('REGION', 'Dar es Salaam'),
            ('CITY',   'Ilala'),
            ('CITY',   'Kinondoni'),
            ('CITY',   'Temeke'),
            ('CITY',   'Ubungo'),
            ('CITY',   'Kigamboni'),
            ('CITY',   'Mwanza'),
            ('CITY',   'Arusha')
        ) AS v(kind, name)
        WHERE NOT EXISTS (
            SELECT 1 FROM "SERVICE_AREAS" a
             WHERE a.kind = v.kind AND a.name = v.name
        )
        """
    )

    # -------------------------- SERVICE REQUESTS ----------------------------
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS "SERVICE_REQUESTS" (
            request_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            request_number VARCHAR(24)  NOT NULL UNIQUE,
            customer_id    UUID         NOT NULL REFERENCES "CUSTOMERS"(customer_id) ON DELETE CASCADE,
            service_id     UUID         NOT NULL REFERENCES "SERVICES"(service_id),
            property_id    UUID REFERENCES "PROPERTIES"(property_id) ON DELETE SET NULL,
            address_id     UUID REFERENCES "CUSTOMER_ADDRESSES"(address_id) ON DELETE SET NULL,
            description    VARCHAR(2000) NOT NULL,
            preferred_date DATE,
            time_window    VARCHAR(12),
            status         VARCHAR(24)  NOT NULL DEFAULT 'DRAFT',
            validation_notes VARCHAR(1000),
            submitted_at   TIMESTAMPTZ,
            created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
            updated_at     TIMESTAMPTZ  NOT NULL DEFAULT now()
        )
        """
    )
    op.execute('ALTER TABLE "SERVICE_REQUESTS" DROP CONSTRAINT IF EXISTS "CK_REQUEST_STATUS"')
    op.execute(
        'ALTER TABLE "SERVICE_REQUESTS" ADD CONSTRAINT "CK_REQUEST_STATUS" '
        "CHECK (status IN ('DRAFT','SUBMITTED','VALIDATING','VALID',"
        "'NEEDS_INFORMATION','OUTSIDE_SERVICE_AREA','NO_PROVIDER_AVAILABLE','CANCELLED'))"
    )
    op.execute(
        'CREATE INDEX IF NOT EXISTS "IX_REQUEST_CUSTOMER" '
        'ON "SERVICE_REQUESTS" (customer_id, status, created_at DESC)'
    )

    # --------------------------- REQUEST EVIDENCE ---------------------------
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS "REQUEST_EVIDENCE" (
            evidence_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            request_id  UUID         NOT NULL REFERENCES "SERVICE_REQUESTS"(request_id) ON DELETE CASCADE,
            file_name   VARCHAR(255) NOT NULL,
            mime_type   VARCHAR(80)  NOT NULL,
            size_bytes  INTEGER      NOT NULL,
            storage_key VARCHAR(500) NOT NULL,
            uploaded_at TIMESTAMPTZ  NOT NULL DEFAULT now()
        )
        """
    )
    op.execute(
        'CREATE INDEX IF NOT EXISTS "IX_EVIDENCE_REQUEST" ON "REQUEST_EVIDENCE" (request_id)'
    )


def downgrade() -> None:
    op.execute('DROP TABLE IF EXISTS "REQUEST_EVIDENCE"')
    op.execute('DROP TABLE IF EXISTS "SERVICE_REQUESTS"')
    op.execute('DROP TABLE IF EXISTS "SERVICE_AREAS"')