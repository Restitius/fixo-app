"""phase provider request responses — incoming job request actions (Provider Req Phase 11)

Revision ID: 0030_provider_request_responses
Revises: 0029_provider_availability

The provider response ledger for the incoming job request feed: Accept /
Decline are terminal (one per (provider, request) via a partial unique
index), Ask Question is unrestricted. Submitting a quote writes to the
existing QUOTATIONS table — no new quote storage here.

Table names are CAPITAL-quoted per project convention. Raw DDL only.
"""
from __future__ import annotations

from alembic import op

revision = "0030_provider_request_responses"
down_revision = "0029_provider_availability"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS "PROVIDER_REQUEST_RESPONSES" (
            response_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            provider_id      UUID NOT NULL
                             REFERENCES "PROVIDERS"(provider_id) ON DELETE CASCADE,
            request_id       UUID NOT NULL
                             REFERENCES "SERVICE_REQUESTS"(request_id) ON DELETE CASCADE,
            response_type    VARCHAR(12) NOT NULL,
            question_text    VARCHAR(1000),
            response_message VARCHAR(500),
            responded_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
            CONSTRAINT CK_REQUEST_RESPONSE_TYPE CHECK (
                response_type IN ('ACCEPTED', 'DECLINED', 'QUESTION')
            ),
            CONSTRAINT CK_QUESTION_HAS_TEXT CHECK (
                response_type <> 'QUESTION' OR question_text IS NOT NULL
            )
        )
        """
    )
    op.execute(
        'CREATE UNIQUE INDEX IF NOT EXISTS "UX_PROVIDER_REQUEST_TERMINAL" '
        'ON "PROVIDER_REQUEST_RESPONSES" (provider_id, request_id) '
        "WHERE response_type IN ('ACCEPTED', 'DECLINED')"
    )
    op.execute(
        'CREATE INDEX IF NOT EXISTS "IX_PROVIDER_REQUEST_RESPONSES" '
        'ON "PROVIDER_REQUEST_RESPONSES" (provider_id, responded_at)'
    )


def downgrade() -> None:
    op.execute('DROP TABLE IF EXISTS "PROVIDER_REQUEST_RESPONSES"')
