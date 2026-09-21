"""Provider settings - notifications preferences, privacy, security (Phase 50).

Mirrors the customer-side account settings tables (CUSTOMER_PREFERENCES,
CONSENTS, DATA_EXPORT_REQUESTS from 0017_phase15_account) for providers.
Security (password change, session revocation) reuses the existing
PROVIDERS.password_hash and PROVIDER_AUTH_SESSIONS — no new table needed
for that facet. Personal/business info editing already exists
(provider_profile_service / provider_business_service) and is untouched.
"""

from alembic import op

revision = "0068"
down_revision = "0067"


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS "PROVIDER_PREFERENCES" (
            preference_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            provider_id   UUID NOT NULL REFERENCES "PROVIDERS"(provider_id) ON DELETE CASCADE,
            key           VARCHAR(80) NOT NULL,
            value         TEXT NOT NULL,
            updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
            UNIQUE (provider_id, key)
        )
        """
    )
    op.execute('CREATE INDEX IF NOT EXISTS "IX_PROVIDER_PREFS_PROVIDER" ON "PROVIDER_PREFERENCES" (provider_id)')

    op.execute(
        """
        CREATE TABLE IF NOT EXISTS "PROVIDER_CONSENTS" (
            consent_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            provider_id  UUID NOT NULL REFERENCES "PROVIDERS"(provider_id) ON DELETE CASCADE,
            kind         VARCHAR(40) NOT NULL,
            consented    BOOLEAN NOT NULL DEFAULT TRUE,
            revoked_at   TIMESTAMPTZ,
            consented_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            UNIQUE (provider_id, kind)
        )
        """
    )
    op.execute('CREATE INDEX IF NOT EXISTS "IX_PROVIDER_CONSENTS_PROVIDER" ON "PROVIDER_CONSENTS" (provider_id)')

    op.execute(
        """
        CREATE TABLE IF NOT EXISTS "PROVIDER_DATA_EXPORT_REQUESTS" (
            request_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            provider_id  UUID NOT NULL REFERENCES "PROVIDERS"(provider_id) ON DELETE CASCADE,
            status       VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','READY','FAILED')),
            requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            completed_at TIMESTAMPTZ,
            file_path    TEXT
        )
        """
    )
    op.execute(
        'CREATE INDEX IF NOT EXISTS "IX_PROVIDER_EXPORTS_PROVIDER" '
        'ON "PROVIDER_DATA_EXPORT_REQUESTS" (provider_id, requested_at DESC)'
    )


def downgrade() -> None:
    op.execute('DROP TABLE IF EXISTS "PROVIDER_DATA_EXPORT_REQUESTS"')
    op.execute('DROP TABLE IF EXISTS "PROVIDER_CONSENTS"')
    op.execute('DROP TABLE IF EXISTS "PROVIDER_PREFERENCES"')
