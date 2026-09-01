"""phase5 marketplace — providers, matches, quotations, extended workflow.

Revision ID: 0007_phase5_marketplace
Revises: 0006_fix_sp_create_address
"""
from __future__ import annotations

from alembic import op

revision = "0007_phase5_marketplace"
down_revision = "0006_fix_sp_create_address"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ------------------------------- PROVIDERS -------------------------------
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS "PROVIDERS" (
            provider_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            display_name   VARCHAR(120) NOT NULL,
            headline       VARCHAR(160),
            bio            VARCHAR(1000),
            city           VARCHAR(80)  NOT NULL,
            region         VARCHAR(80)  NOT NULL,
            rating_avg     NUMERIC(3,2) NOT NULL DEFAULT 0,
            rating_count   INTEGER      NOT NULL DEFAULT 0,
            jobs_completed INTEGER      NOT NULL DEFAULT 0,
            is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
            created_at     TIMESTAMPTZ  NOT NULL DEFAULT now()
        )
        """
    )
    op.execute('CREATE INDEX IF NOT EXISTS "IX_PROVIDER_LOCATION" ON "PROVIDERS" (city, region, is_active)')

    # --------------------------- PROVIDER SERVICES ---------------------------
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS "PROVIDER_SERVICES" (
            provider_id UUID         NOT NULL REFERENCES "PROVIDERS"(provider_id) ON DELETE CASCADE,
            service_id  UUID         NOT NULL REFERENCES "SERVICES"(service_id) ON DELETE CASCADE,
            base_amount NUMERIC(10,2) NOT NULL,
            PRIMARY KEY (provider_id, service_id)
        )
        """
    )

    # ---------------------------- MATCH CANDIDATES ---------------------------
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS "MATCH_CANDIDATES" (
            match_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            request_id  UUID        NOT NULL REFERENCES "SERVICE_REQUESTS"(request_id) ON DELETE CASCADE,
            provider_id UUID        NOT NULL REFERENCES "PROVIDERS"(provider_id) ON DELETE CASCADE,
            strategy    VARCHAR(24) NOT NULL,
            score       NUMERIC(5,2) NOT NULL,
            rank_pos    SMALLINT    NOT NULL,
            reasons     VARCHAR(500),
            created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
            UNIQUE (request_id, provider_id)
        )
        """
    )

    # ------------------------------- QUOTATIONS ------------------------------
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS "QUOTATIONS" (
            quote_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            request_id       UUID        NOT NULL REFERENCES "SERVICE_REQUESTS"(request_id) ON DELETE CASCADE,
            provider_id      UUID        NOT NULL REFERENCES "PROVIDERS"(provider_id) ON DELETE CASCADE,
            amount           NUMERIC(10,2) NOT NULL,
            currency         VARCHAR(3)  NOT NULL DEFAULT 'TZS',
            lead_time_days   SMALLINT    NOT NULL DEFAULT 1,
            message          VARCHAR(500),
            status           VARCHAR(12) NOT NULL DEFAULT 'SUBMITTED',
            valid_until      TIMESTAMPTZ NOT NULL DEFAULT now() + interval '48 hours',
            created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
            UNIQUE (request_id, provider_id)
        )
        """
    )
    op.execute('ALTER TABLE "QUOTATIONS" DROP CONSTRAINT IF EXISTS "CK_QUOTE_STATUS"')
    op.execute(
        'ALTER TABLE "QUOTATIONS" ADD CONSTRAINT "CK_QUOTE_STATUS" '
        "CHECK (status IN ('SUBMITTED', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'WITHDRAWN'))"
    )
    op.execute('CREATE INDEX IF NOT EXISTS "IX_QUOTES_REQUEST" ON "QUOTATIONS" (request_id, status)')

    # ------------------- REQUEST: selected provider + states -----------------
    op.execute(
        'ALTER TABLE "SERVICE_REQUESTS" ADD COLUMN IF NOT EXISTS '
        'selected_provider_id UUID REFERENCES "PROVIDERS"(provider_id) ON DELETE SET NULL'
    )
    op.execute('ALTER TABLE "SERVICE_REQUESTS" DROP CONSTRAINT IF EXISTS "CK_REQUEST_STATUS"')
    op.execute(
        'ALTER TABLE "SERVICE_REQUESTS" ADD CONSTRAINT "CK_REQUEST_STATUS" '
        "CHECK (status IN ('DRAFT','SUBMITTED','VALIDATING','VALID','MATCHING',"
        "'PROVIDER_SELECTED','QUOTE_ACCEPTED','NEEDS_INFORMATION',"
        "'OUTSIDE_SERVICE_AREA','NO_PROVIDER_AVAILABLE','CANCELLED'))"
    )

    # ------------------------------ SEED PROVIDERS ----------------------------
    op.execute(
        """
        INSERT INTO "PROVIDERS" (display_name, headline, bio, city, region,
                                 rating_avg, rating_count, jobs_completed)
        SELECT v.name, v.headline, v.bio, v.city, v.region,
               v.rating, 12 + (abs(hashtext(v.name)) % 180),
               20 + (abs(hashtext(v.name)) % 240)
        FROM (VALUES
            ('Amani Mwakalinga', 'Certified plumber, 8 yrs',  'Specialist in leak detection and bathroom fittings.', 'Kinondoni', 'Dar es Salaam', 4.8),
            ('Grace Ndosi',      'Emergency plumbing crew',  'Fast response team covering central Dar.',            'Ilala',     'Dar es Salaam', 4.6),
            ('Juma Hassan',      'Electrical faults expert', 'Wiring, sockets and backup power installations.',     'Ubungo',    'Dar es Salaam', 4.9),
            ('Neema Kileo',      'Home cleaning teams',      'Deep-cleaning crews with eco supplies.',              'Temeke',    'Dar es Salaam', 4.7),
            ('Baraka Mushi',     'AC technicians',           'Installation, servicing and gas refills.',            'Kinondoni', 'Dar es Salaam', 4.5),
            ('Salma Rajabu',     'Painting & finishing',     'Interior and exterior painting with warranty.',       'Mwanza',    'Mwanza',        4.8),
            ('Peter Msigwa',     'Carpentry workshop',       'Doors, locks, custom shelves and repairs.',           'Arusha',    'Arusha',        4.4),
            ('Zawadi Mwakyusa',  'Appliance repair lab',     'Fridge and washing-machine specialists.',             'Ilala',     'Dar es Salaam', 4.6),
            ('Emanuel Sanga',    'Garden & lawn care',       'Regular maintenance and landscaping.',                'Kigamboni', 'Dar es Salaam', 4.3),
            ('Fatuma Ally',      'Pest control certified',   'Safe treatments for homes with kids.',                'Kinondoni', 'Dar es Salaam', 4.7)
        ) AS v(name, headline, bio, city, region, rating)
        WHERE NOT EXISTS (SELECT 1 FROM "PROVIDERS" p WHERE p.display_name = v.name)
        """
    )
    op.execute(
        """
        INSERT INTO "PROVIDER_SERVICES" (provider_id, service_id, base_amount)
        SELECT p.provider_id, s.service_id, v.base_amount
        FROM (VALUES
            ('Amani Mwakalinga', 'leak-repair',            35000.00),
            ('Amani Mwakalinga', 'water-heater-install',  120000.00),
            ('Grace Ndosi',      'leak-repair',            30000.00),
            ('Grace Ndosi',      'emergency-plumber',      55000.00),
            ('Juma Hassan',      'wiring-rewiring',       150000.00),
            ('Juma Hassan',      'socket-switch-fix',      20000.00),
            ('Neema Kileo',      'deep-home-cleaning',     60000.00),
            ('Neema Kileo',      'sofa-carpet-shampoo',    45000.00),
            ('Baraka Mushi',     'ac-servicing',           40000.00),
            ('Baraka Mushi',     'ac-installation',        90000.00),
            ('Salma Rajabu',     'interior-painting',     180000.00),
            ('Peter Msigwa',     'door-lock-fitting',      25000.00),
            ('Zawadi Mwakyusa',  'fridge-repair',          50000.00),
            ('Zawadi Mwakyusa',  'washing-machine-repair', 48000.00),
            ('Emanuel Sanga',    'lawn-care',              30000.00),
            ('Fatuma Ally',      'cockroach-treatment',    42000.00),
            ('Fatuma Ally',      'termite-control',        95000.00)
        ) AS v(pname, slug, base_amount)
        JOIN "PROVIDERS" p ON p.display_name = v.pname
        JOIN "SERVICES" s  ON s.slug = v.slug
        WHERE NOT EXISTS (
            SELECT 1 FROM "PROVIDER_SERVICES" ps
             WHERE ps.provider_id = p.provider_id AND ps.service_id = s.service_id
        )
        """
    )


    # --------------------- SP_ACCEPT_QUOTE (Phase 5) --------------------------
    op.execute(
        """
        CREATE OR REPLACE FUNCTION "SP_ACCEPT_QUOTE"(
            p_customer_id uuid,
            p_request_id  uuid,
            p_quote_id    uuid
        )
        RETURNS boolean
        LANGUAGE plpgsql AS $$
        DECLARE
            v_provider uuid;
        BEGIN
            SELECT q.provider_id INTO v_provider
              FROM "QUOTATIONS" q
              JOIN "SERVICE_REQUESTS" r ON r.request_id = q.request_id
             WHERE q.quote_id = p_quote_id
               AND q.request_id = p_request_id
               AND q.status = 'SUBMITTED'
               AND r.customer_id = p_customer_id;

            IF v_provider IS NULL THEN
                RETURN FALSE;
            END IF;

            UPDATE "QUOTATIONS"
               SET status = 'EXPIRED'
             WHERE request_id = p_request_id
               AND status = 'SUBMITTED';

            UPDATE "QUOTATIONS"
               SET status = 'ACCEPTED'
             WHERE quote_id = p_quote_id;

            UPDATE "SERVICE_REQUESTS"
               SET selected_provider_id = v_provider,
                   updated_at = now()
             WHERE request_id = p_request_id;

            RETURN TRUE;
        END;
        $$;
        """
    )


def downgrade() -> None:
    op.execute('DROP TABLE IF EXISTS "QUOTATIONS"')
    op.execute('DROP TABLE IF EXISTS "MATCH_CANDIDATES"')
    op.execute('DROP TABLE IF EXISTS "PROVIDER_SERVICES"')
    op.execute("DELETE FROM \"SERVICE_REQUESTS\" WHERE selected_provider_id IS NOT NULL")
    op.execute('ALTER TABLE "SERVICE_REQUESTS" DROP COLUMN IF EXISTS selected_provider_id')
    op.execute('DROP TABLE IF EXISTS "PROVIDERS"')