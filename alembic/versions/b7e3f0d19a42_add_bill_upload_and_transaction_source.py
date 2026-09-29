"""Add bill_uploads, bill_item_aliases, and transaction source/bill fields

Revision ID: b7e3f0d19a42
Revises: 9d4a6b1c8e27
Create Date: 2026-09-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b7e3f0d19a42'
down_revision: Union[str, Sequence[str], None] = '9d4a6b1c8e27'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'bill_uploads',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('userid_fk', sa.Integer(), nullable=False),
        sa.Column('file_data', sa.Text(), nullable=False),
        sa.Column('file_type', sa.String(), nullable=False),
        sa.Column('uploaded_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('status', sa.String(), nullable=False, server_default='processed'),
        sa.Column('raw_ocr_text', sa.Text(), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
    )

    op.create_table(
        'bill_item_aliases',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('productsandservices_fk', sa.Integer(), nullable=False),
        sa.Column('userid_fk', sa.Integer(), nullable=False),
        sa.Column('alias_text', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    op.alter_column('transactions', 'products_services_fk', nullable=True)
    op.add_column('transactions', sa.Column('source', sa.String(), nullable=False, server_default='manual'))
    op.add_column('transactions', sa.Column('bill_upload_fk', sa.Integer(), nullable=True))
    op.add_column('transactions', sa.Column('raw_item_text', sa.Text(), nullable=True))
    op.add_column('transactions', sa.Column('classification_confidence', sa.Float(), nullable=True))

    capabilitymaster = sa.table(
        'capabilitymaster',
        sa.column('name', sa.String),
        sa.column('description', sa.String),
        sa.column('tag', sa.String),
    )
    op.bulk_insert(
        capabilitymaster,
        [
            {'name': 'post_bill', 'description': 'Insert into bill upload', 'tag': 'bill upload'},
            {'name': 'get_bill', 'description': 'read from bill upload', 'tag': 'bill upload'},
        ],
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.execute("DELETE FROM capabilitymaster WHERE name IN ('post_bill', 'get_bill')")
    op.drop_column('transactions', 'classification_confidence')
    op.drop_column('transactions', 'raw_item_text')
    op.drop_column('transactions', 'bill_upload_fk')
    op.drop_column('transactions', 'source')
    op.alter_column('transactions', 'products_services_fk', nullable=False)
    op.drop_table('bill_item_aliases')
    op.drop_table('bill_uploads')
