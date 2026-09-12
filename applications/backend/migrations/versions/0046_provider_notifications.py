"""Provider notifications (Phase 32).

Adds the PROVIDER_NOTIFICATIONS table for provider-facing notification
persistence, with ownership filtering by provider_id in the adapter layer.
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0046_provider_notifications"
down_revision = "0045_provider_commission_fees"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "PROVIDER_NOTIFICATIONS",
        sa.Column("id", sa.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("provider_id", sa.UUID(as_uuid=True), sa.ForeignKey("PROVIDERS.id", ondelete="CASCADE"), nullable=False),
        sa.Column("channel", sa.Text(), nullable=False),
        sa.Column("category", sa.Text(), nullable=False),
        sa.Column("title", sa.Text(), nullable=False),
        sa.Column("body", sa.Text(), nullable=True),
        sa.Column("is_read", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("reference_type", sa.Text(), nullable=True),
        sa.Column("reference_id", sa.UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.TIMESTAMP(timezone=True), nullable=True),
    )
    op.create_index(
        "ix_provider_notifications_provider_read_created",
        "PROVIDER_NOTIFICATIONS",
        ["provider_id", "is_read", "created_at"],
        postgresql_using="btree",
    )


def downgrade() -> None:
    op.drop_index("ix_provider_notifications_provider_read_created", table_name="PROVIDER_NOTIFICATIONS")
    op.drop_table("PROVIDER_NOTIFICATIONS")
