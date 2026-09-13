"""Provider DSL requests, DSL execution logs, and DSL provider lifetime metrics.

Phase 38 — DSL based cancellation/rescheduling request workflow.

Tables:
- PROVIDER_DSL_REQUESTS
- PROVIDER_DSL_EXECUTION_LOGS
- PROVIDER_DSL_PROVIDER_METRICS
"""

from typing import Union
from alembic import op
import sqlalchemy as sa

def upgrade() -> None:
    op.create_table(
        'PROVIDER_DSL_REQUESTS',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('provider_id', sa.String(length=36), nullable=False),
        sa.Column('dsl_kind', sa.String(length=64), nullable=False),
        sa.Column('subject_type', sa.String(length=64), nullable=False),
        sa.Column('subject_id', sa.String(length=36), nullable=False),
        sa.Column('title', sa.String(length=256), nullable=False),
        sa.Column('dsl', sa.dialects.postgresql.JSONB, nullable=False),
        sa.Column('status', sa.String(length=32), nullable=False),
        sa.Column('priority', sa.String(length=32), nullable=False, server_default=sa.text("'medium'" )),
        sa.Column('reason', sa.Text(), nullable=True),
        sa.Column('requested_by', sa.String(length=36), nullable=False),
        sa.Column('resolved_by', sa.String(length=36), nullable=True),
        sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('parent_id', sa.String(length=36), nullable=True),
        sa.Column('root_request_id', sa.String(length=36), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint('id'),
    )
    op.create_index(
        'IX_PROVIDER_DSL_REQUESTS_PROVIDER_STATUS_CREATED',
        'PROVIDER_DSL_REQUESTS',
        ['provider_id', 'status', sa.text('created_at DESC')],
    )
    op.create_index(
        'IX_PROVIDER_DSL_REQUESTS_PARENT',
        'PROVIDER_DSL_REQUESTS',
        ['parent_id'],
    )
    op.create_index(
        'IX_PROVIDER_DSL_REQUESTS_ROOT',
        'PROVIDER_DSL_REQUESTS',
        ['root_request_id'],
    )
    op.create_index(
        'IX_PROVIDER_DSL_REQUESTS_PROVIDER_KIND',
        'PROVIDER_DSL_REQUESTS',
        ['provider_id', 'dsl_kind'],
    )
    op.create_index(
        'UQ_PROVIDER_DSL_REQUESTS_PROVIDER_SUBJECT',
        'PROVIDER_DSL_REQUESTS',
        ['provider_id', 'subject_type', 'subject_id'],
        unique=True,
    )
    op.create_table(
        'PROVIDER_DSL_EXECUTION_LOGS',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('dsl_request_id', sa.String(length=36), nullable=False),
        sa.Column('step_order', sa.Integer(), nullable=False),
        sa.Column('action', sa.String(length=128), nullable=False),
        sa.Column('status', sa.String(length=32), nullable=False),
        sa.Column('summary', sa.dialects.postgresql.JSONB, nullable=True),
        sa.Column('error', sa.dialects.postgresql.JSONB, nullable=True),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('finished_at', sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint('id'),
    )
    op.create_index(
        'IX_PROVIDER_DSL_EXECUTION_LOGS_REQUEST_ORDER',
        'PROVIDER_DSL_EXECUTION_LOGS',
        ['dsl_request_id', 'step_order'],
    )
    op.create_table(
        'PROVIDER_DSL_PROVIDER_METRICS',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('provider_id', sa.String(length=36), nullable=False),
        sa.Column('period', sa.String(length=64), nullable=False),
        sa.Column('total_requests', sa.Integer(), nullable=False, server_default=sa.text('0')),
        sa.Column('resolved_requests', sa.Integer(), nullable=False, server_default=sa.text('0')),
        sa.Column('canceled_requests', sa.Integer(), nullable=False, server_default=sa.text('0')),
        sa.Column('escalated_requests', sa.Integer(), nullable=False, server_default=sa.text('0')),
        sa.Column('avg_resolution_hours', sa.Float(), nullable=False, server_default=sa.text('0')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint('id'),
    )
    op.create_index(
        'UQ_PROVIDER_DSL_PROVIDER_METRICS_PROVIDER_PERIOD',
        'PROVIDER_DSL_PROVIDER_METRICS',
        ['provider_id', 'period'],
        unique=True,
    )

def downgrade() -> None:
    op.drop_table('PROVIDER_DSL_PROVIDER_METRICS')
    op.drop_table('PROVIDER_DSL_EXECUTION_LOGS')
    op.drop_table('PROVIDER_DSL_REQUESTS')
