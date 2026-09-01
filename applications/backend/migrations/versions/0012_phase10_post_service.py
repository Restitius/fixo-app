"""Phase 10 — Post-Service: Reviews, Warranties, Favorites/Rebooking

Revision ID: 0012_phase10_post
Revises: 0011_phase9_financial
"""
from alembic import op

revision = "0012_phase10_post"
down_revision = "0011_phase9_financial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ---- REVIEWS + MEDIA ----
    op.execute("""
        CREATE TABLE IF NOT EXISTS "REVIEWS" (
            review_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            booking_id UUID NOT NULL UNIQUE REFERENCES "BOOKINGS"(booking_id) ON DELETE CASCADE,
            customer_id UUID NOT NULL REFERENCES "CUSTOMERS"(customer_id) ON DELETE CASCADE,
            provider_id UUID NOT NULL REFERENCES "PROVIDERS"(provider_id) ON DELETE CASCADE,
            rating SMALLINT NOT NULL,
            comment TEXT,
            status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            CONSTRAINT "CK_REVIEWS_RATING" CHECK (rating >= 1 AND rating <= 5),
            CONSTRAINT "CK_REVIEWS_STATUS" CHECK (status IN ('PENDING','APPROVED','REJECTED','SPAM'))
        )
    """)
    op.execute('CREATE INDEX IF NOT EXISTS "IX_REVIEWS_CUSTOMER" ON "REVIEWS" (customer_id)')
    op.execute('CREATE INDEX IF NOT EXISTS "IX_REVIEWS_PROVIDER" ON "REVIEWS" (provider_id)')

    op.execute("""
        CREATE TABLE IF NOT EXISTS "REVIEW_MEDIA" (
            media_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            review_id UUID NOT NULL REFERENCES "REVIEWS"(review_id) ON DELETE CASCADE,
            media_type VARCHAR(10) NOT NULL,
            url VARCHAR(500) NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            CONSTRAINT "CK_REVIEW_MEDIA_TYPE" CHECK (media_type IN ('image','video'))
        )
    """)

    # ---- WARRANTIES + CLAIMS ----
    op.execute("""
        CREATE TABLE IF NOT EXISTS "WARRANTIES" (
            warranty_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            booking_id UUID NOT NULL UNIQUE REFERENCES "BOOKINGS"(booking_id) ON DELETE CASCADE,
            customer_id UUID NOT NULL REFERENCES "CUSTOMERS"(customer_id) ON DELETE CASCADE,
            provider_id UUID NOT NULL REFERENCES "PROVIDERS"(provider_id) ON DELETE CASCADE,
            service_id UUID REFERENCES "SERVICES"(service_id) ON DELETE SET NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
            issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            expires_at TIMESTAMPTZ,
            claim_deadline TIMESTAMPTZ,
            terms JSONB,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            CONSTRAINT "CK_WARRANTY_STATUS" CHECK (status IN ('ACTIVE','CLAIMED','RESOLVED','EXPIRED','CANCELLED'))
        )
    """)
    op.execute('CREATE INDEX IF NOT EXISTS "IX_WARRANTIES_CUSTOMER" ON "WARRANTIES" (customer_id)')
    op.execute('CREATE INDEX IF NOT EXISTS "IX_WARRANTIES_PROVIDER" ON "WARRANTIES" (provider_id)')
    op.execute('CREATE INDEX IF NOT EXISTS "IX_WARRANTIES_EXPIRES" ON "WARRANTIES" (expires_at)')

    op.execute("""
        CREATE TABLE IF NOT EXISTS "WARRANTY_CLAIMS" (
            claim_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            warranty_id UUID NOT NULL REFERENCES "WARRANTIES"(warranty_id) ON DELETE CASCADE,
            customer_id UUID NOT NULL REFERENCES "CUSTOMERS"(customer_id) ON DELETE CASCADE,
            provider_id UUID NOT NULL REFERENCES "PROVIDERS"(provider_id) ON DELETE CASCADE,
            description TEXT NOT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
            priority VARCHAR(10) NOT NULL DEFAULT 'NORMAL',
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            resolved_at TIMESTAMPTZ,
            CONSTRAINT "CK_CLAIM_STATUS" CHECK (status IN ('OPEN','IN_PROGRESS','RESOLVED','REJECTED','CLOSED')),
            CONSTRAINT "CK_CLAIM_PRIORITY" CHECK (priority IN ('LOW','NORMAL','HIGH','URGENT'))
        )
    """)
    op.execute('CREATE INDEX IF NOT EXISTS "IX_CLAIMS_WARRANTY" ON "WARRANTY_CLAIMS" (warranty_id)')

    # ---- FAVORITES ----
    op.execute("""
        CREATE TABLE IF NOT EXISTS "FAVORITES" (
            favorite_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            customer_id UUID NOT NULL REFERENCES "CUSTOMERS"(customer_id) ON DELETE CASCADE,
            provider_id UUID NOT NULL REFERENCES "PROVIDERS"(provider_id) ON DELETE CASCADE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            notes VARCHAR(200),
            UNIQUE (customer_id, provider_id)
        )
    """)
    op.execute('CREATE INDEX IF NOT EXISTS "IX_FAVORITES_CUSTOMER" ON "FAVORITES" (customer_id)')

    # ---- BOOKINGS: warranty flag ----
    op.execute('ALTER TABLE "BOOKINGS" ADD COLUMN IF NOT EXISTS warranty_eligible BOOLEAN NOT NULL DEFAULT false')
    op.execute('CREATE INDEX IF NOT EXISTS "IX_BOOKINGS_WARRANTY" ON "BOOKINGS" (warranty_eligible)')

    # ---- auto-warranty trigger ----
    op.execute("DROP TRIGGER IF EXISTS \"TR_BOOKING_WARRANTY\" ON \"BOOKINGS\"")
    op.execute("DROP FUNCTION IF EXISTS \"SP_CREATE_WARRANTY\"()")
    op.execute("CREATE OR REPLACE FUNCTION \"SP_CREATE_WARRANTY\"() "
        "RETURNS TRIGGER AS $body$ "
        "BEGIN "
        "IF TG_OP = 'UPDATE' AND NEW.status = 'CLOSED' AND NEW.warranty_eligible IS TRUE THEN "
        "INSERT INTO \"WARRANTIES\" (booking_id, customer_id, provider_id, service_id, status, "
        "expires_at, claim_deadline, terms) "
        "VALUES (NEW.booking_id, NEW.customer_id, NEW.provider_id, NEW.service_id, 'ACTIVE', "
        "now() + INTERVAL '90 days', "
        "now() + INTERVAL '60 days', "
        "jsonb_build_object('coverage','parts_and_labor','duration_days',90)); "
        "END IF; "
        "RETURN NEW; "
        "END; "
        "$body$ LANGUAGE plpgsql")
    op.execute("CREATE TRIGGER \"TR_BOOKING_WARRANTY\" "
        "AFTER UPDATE ON \"BOOKINGS\" "
        "FOR EACH ROW "
        "WHEN (OLD.status IS DISTINCT FROM NEW.status) "
        "EXECUTE FUNCTION \"SP_CREATE_WARRANTY\"()")


def downgrade() -> None:
    op.execute('DROP TRIGGER IF EXISTS "TR_BOOKING_WARRANTY" ON "BOOKINGS"')
    op.execute('DROP FUNCTION IF EXISTS "SP_CREATE_WARRANTY"()')
    op.execute('DROP INDEX IF EXISTS "IX_BOOKINGS_WARRANTY"')
    op.execute('ALTER TABLE "BOOKINGS" DROP COLUMN IF EXISTS warranty_eligible')
    op.execute('DROP INDEX IF EXISTS "IX_FAVORITES_CUSTOMER"')
    op.execute('DROP TABLE IF EXISTS "FAVORITES"')
    op.execute('DROP INDEX IF EXISTS "IX_CLAIMS_WARRANTY"')
    op.execute('DROP TABLE IF EXISTS "WARRANTY_CLAIMS"')
    op.execute('DROP INDEX IF EXISTS "IX_WARRANTIES_EXPIRES"')
    op.execute('DROP INDEX IF EXISTS "IX_WARRANTIES_PROVIDER"')
    op.execute('DROP INDEX IF EXISTS "IX_WARRANTIES_CUSTOMER"')
    op.execute('DROP TABLE IF EXISTS "WARRANTIES"')
    op.execute('DROP TABLE IF EXISTS "REVIEW_MEDIA"')
    op.execute('DROP INDEX IF EXISTS "IX_REVIEWS_PROVIDER"')
    op.execute('DROP INDEX IF EXISTS "IX_REVIEWS_CUSTOMER"')
    op.execute('DROP TABLE IF EXISTS "REVIEWS"')
