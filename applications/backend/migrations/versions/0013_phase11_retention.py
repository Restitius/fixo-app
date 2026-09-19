"""Phase 11 - Retention: ASSETS, RECURRING_SERVICES, MAINTENANCE_PLANS.

Raw DDL per architecture standard: CAPITAL quoted tables, CHECK-guarded
statuses, ownership indexes. No ORM entities anywhere downstream.
"""
from __future__ import annotations

from alembic import op

revision = "0013_phase11_retention"
down_revision = "0012_phase10_post"


def upgrade() -> None:
    # ---- ASSETS (Module 32) -------------------------------------------------
    op.execute("""
        CREATE TABLE IF NOT EXISTS "ASSETS" (
            asset_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            asset_code       VARCHAR(24)  NOT NULL UNIQUE,
            customer_id      UUID NOT NULL REFERENCES "CUSTOMERS"(customer_id) ON DELETE CASCADE,
            property_id      UUID REFERENCES "PROPERTIES"(property_id) ON DELETE SET NULL,
            name             VARCHAR(120) NOT NULL,
            asset_type       VARCHAR(40)  NOT NULL DEFAULT 'other',
            brand            VARCHAR(60),
            serial_number    VARCHAR(80),
            status           VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
            purchase_value   NUMERIC(12,2) NOT NULL DEFAULT 0,
            current_value    NUMERIC(12,2) NOT NULL DEFAULT 0,
            currency         VARCHAR(3)   NOT NULL DEFAULT 'TZS',
            purchased_at     DATE,
            warranty_until   DATE,
            last_serviced_at TIMESTAMPTZ,
            archived_at      TIMESTAMPTZ,
            notes            VARCHAR(300),
            created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
            CONSTRAINT "CK_ASSET_STATUS" CHECK (status IN ('ACTIVE','SOLD','DISPOSED','ARCHIVED')),
            CONSTRAINT "CK_ASSET_TYPE" CHECK (asset_type IN
                ('appliance','hvac','plumbing','electrical','furniture','security','other'))
        )
    """)
    op.execute('CREATE INDEX IF NOT EXISTS "IX_ASSETS_CUSTOMER" ON "ASSETS" (customer_id)')
    op.execute('CREATE INDEX IF NOT EXISTS "IX_ASSETS_PROPERTY" ON "ASSETS" (property_id)')

    # ---- RECURRING_SERVICES (Module 31) ------------------------------------
    op.execute("""
        CREATE TABLE IF NOT EXISTS "RECURRING_SERVICES" (
            recurring_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            recurring_number VARCHAR(24) NOT NULL UNIQUE,
            customer_id      UUID NOT NULL REFERENCES "CUSTOMERS"(customer_id) ON DELETE CASCADE,
            service_id       UUID NOT NULL REFERENCES "SERVICES"(service_id),
            address_id       UUID REFERENCES "CUSTOMER_ADDRESSES"(address_id) ON DELETE SET NULL,
            frequency        VARCHAR(12) NOT NULL,
            next_run_date    DATE NOT NULL,
            time_window      VARCHAR(12),
            instructions     VARCHAR(500),
            status           VARCHAR(12) NOT NULL DEFAULT 'ACTIVE',
            last_request_id  UUID,
            created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
            CONSTRAINT "CK_RECUR_FREQ" CHECK (frequency IN ('WEEKLY','BIWEEKLY','MONTHLY','QUARTERLY')),
            CONSTRAINT "CK_RECUR_STATUS" CHECK (status IN ('ACTIVE','PAUSED','CANCELLED'))
        )
    """)
    op.execute('CREATE INDEX IF NOT EXISTS "IX_RECUR_CUSTOMER" ON "RECURRING_SERVICES" (customer_id)')
    op.execute('CREATE INDEX IF NOT EXISTS "IX_RECUR_DUE" ON "RECURRING_SERVICES" (next_run_date) WHERE status = \'ACTIVE\'')

    # ---- MAINTENANCE_PLANS (Module 33) --------------------------------------
    op.execute("""
        CREATE TABLE IF NOT EXISTS "MAINTENANCE_PLANS" (
            plan_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            plan_number     VARCHAR(24) NOT NULL UNIQUE,
            customer_id     UUID NOT NULL REFERENCES "CUSTOMERS"(customer_id) ON DELETE CASCADE,
            asset_id        UUID NOT NULL REFERENCES "ASSETS"(asset_id) ON DELETE CASCADE,
            service_id      UUID NOT NULL REFERENCES "SERVICES"(service_id),
            interval_days   INTEGER NOT NULL DEFAULT 180,
            next_due_date   DATE NOT NULL,
            last_done_at    TIMESTAMPTZ,
            status          VARCHAR(12) NOT NULL DEFAULT 'ACTIVE',
            notes           VARCHAR(300),
            created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
            CONSTRAINT "CK_PLAN_INTERVAL" CHECK (interval_days > 0 AND interval_days <= 1095),
            CONSTRAINT "CK_PLAN_STATUS" CHECK (status IN ('ACTIVE','OVERDUE','DONE','CANCELLED'))
        )
    """)
    op.execute('CREATE INDEX IF NOT EXISTS "IX_PLANS_CUSTOMER" ON "MAINTENANCE_PLANS" (customer_id)')
    op.execute('CREATE INDEX IF NOT EXISTS "IX_PLANS_DUE" ON "MAINTENANCE_PLANS" (next_due_date) WHERE status IN (\'ACTIVE\',\'OVERDUE\')')


def downgrade() -> None:
    op.execute('DROP TABLE IF EXISTS "MAINTENANCE_PLANS"')
    op.execute('DROP TABLE IF EXISTS "RECURRING_SERVICES"')
    op.execute('DROP TABLE IF EXISTS "ASSETS"')
