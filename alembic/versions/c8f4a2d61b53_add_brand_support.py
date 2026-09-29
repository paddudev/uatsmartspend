"""Add brand support (product-brand links, transaction/alias brand_fk)

Revision ID: c8f4a2d61b53
Revises: b7e3f0d19a42
Create Date: 2026-09-10 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c8f4a2d61b53'
down_revision: Union[str, Sequence[str], None] = 'b7e3f0d19a42'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('transactions', sa.Column('brand_fk', sa.Integer(), nullable=True))
    op.add_column('bill_item_aliases', sa.Column('brand_fk', sa.Integer(), nullable=True))

    op.create_table(
        'productsandservices_brands',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('productsandservices_fk', sa.Integer(), nullable=False),
        sa.Column('brand_fk', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['productsandservices_fk'], ['productsandservices.id']),
        sa.ForeignKeyConstraint(['brand_fk'], ['commonmaster.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('productsandservices_fk', 'brand_fk'),
    )
    op.create_index(op.f('ix_productsandservices_brands_id'), 'productsandservices_brands', ['id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_productsandservices_brands_id'), table_name='productsandservices_brands')
    op.drop_table('productsandservices_brands')
    op.drop_column('bill_item_aliases', 'brand_fk')
    op.drop_column('transactions', 'brand_fk')
