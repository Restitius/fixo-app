"""phase provider onboarding — 7-step guided onboarding (Provider Req Phase 2)

Revision ID: 0021_phase_provider_onboarding
Revises: 0020_phase_provider_accounts

Adds the provider onboarding step catalogue (mirrors the customer
"ONBOARDING_STEPS" catalogue) plus per-provider progress that AUTO-SAVES the
data captured in each step ("progress should be saved automatically" /
"leave and continue later"). completed_at NULL = saved draft, set = step done.

Table names are CAPITAL-quoted per project convention. Raw DDL only.
"""
from __future__ import annotations

from alembic import op

revision = "0021_phase_provider_onboarding"
down_revision = "0020_phase_provider_accounts"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ------------------- PROVIDER ONBOARDING STEPS (catalogue) --------------
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS "PROVIDER_ONBOARDING_STEPS" (
            step_id     SERIAL PRIMARY KEY,
            code        VARCHAR(40)  NOT NULL UNIQUE,
            title       VARCHAR(120) NOT NULL,
            description VARCHAR(500),
            sort_order  SMALLINT     NOT NULL,
            is_required BOOLEAN      NOT NULL DEFAULT TRUE
        )
        """
    )
    op.execute(
        """
        INSERT INTO "PROVIDER_ONBOARDING_STEPS" (code, title, description, sort_order, is_required) VALUES
            ('PERSONAL_INFO',         'Personal information',  'Tell us who will be delivering the services.',            1, TRUE),
            ('BUSINESS_INFO',         'Business information',  'If you operate as a company, add its registration details.', 2, FALSE),
            ('IDENTITY_VERIFICATION', 'Identity verification', 'Upload identity documents so we can verify you.',         3, TRUE),
            ('SERVICE_CONFIGURATION', 'Service configuration', 'Define exactly which services you offer.',                4, TRUE),
            ('SERVICE_AREAS',         'Service areas',         'Set the areas you are willing to serve.',                 5, TRUE),
            ('PAYMENT_INFORMATION',   'Payment information',   'How you get paid — mobile money, bank, or card payout.',  6, TRUE),
            ('AGREEMENTS',            'Agreements',            'Review and accept the provider agreements.',              7, TRUE)
        ON CONFLICT (code) DO NOTHING
        """
    )

    # ---------------- PROVIDER ONBOARDING PROGRESS (auto-save) --------------
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS "PROVIDER_ONBOARDING_PROGRESS" (
            provider_id  UUID        NOT NULL REFERENCES "PROVIDERS"(provider_id) ON DELETE CASCADE,
            step_id      INTEGER     NOT NULL REFERENCES "PROVIDER_ONBOARDING_STEPS"(step_id),
            step_data    JSONB       NOT NULL DEFAULT '{}'::jsonb,
            completed_at TIMESTAMPTZ,
            updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
            PRIMARY KEY (provider_id, step_id)
        )
        """
    )
    op.execute(
        'CREATE INDEX IF NOT EXISTS "IX_PROVIDER_ONBOARDING_PROGRESS_PROVIDER" '
        'ON "PROVIDER_ONBOARDING_PROGRESS" (provider_id, updated_at)'
    )


def downgrade() -> None:
    op.execute('DROP TABLE IF EXISTS "PROVIDER_ONBOARDING_PROGRESS"')
    op.execute('DROP TABLE IF EXISTS "PROVIDER_ONBOARDING_STEPS"')
