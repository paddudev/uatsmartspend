"""Make product/service <-> category many-to-many

Moves productsandservices.categorymaster_fk into a productsandservices_categories
link table, and records the chosen category on each transaction (and on learned
bill item aliases), since a product can now sit in several categories.

Revision ID: d9a5b3e72c64
Revises: c8f4a2d61b53
Create Date: 2026-09-29 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd9a5b3e72c64'
down_revision: Union[str, Sequence[str], None] = 'c8f4a2d61b53'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'productsandservices_categories',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('productsandservices_fk', sa.Integer(), nullable=False),
        sa.Column('categorymaster_fk', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['productsandservices_fk'], ['productsandservices.id']),
        sa.ForeignKeyConstraint(['categorymaster_fk'], ['categorymaster.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('productsandservices_fk', 'categorymaster_fk'),
    )
    op.create_index(op.f('ix_productsandservices_categories_id'), 'productsandservices_categories', ['id'], unique=False)

    op.add_column('transactions', sa.Column('categorymaster_fk', sa.Integer(), nullable=True))
    op.add_column('bill_item_aliases', sa.Column('categorymaster_fk', sa.Integer(), nullable=True))

    # Carry each product's single existing category into the link table, and
    # stamp it onto the transactions/aliases that were implicitly using it.
    op.execute(
        """
        INSERT INTO productsandservices_categories (productsandservices_fk, categorymaster_fk)
        SELECT p.id, p.categorymaster_fk
        FROM productsandservices p
        JOIN categorymaster c ON c.id = p.categorymaster_fk
        """
    )
    op.execute(
        """
        UPDATE transactions t
        SET categorymaster_fk = p.categorymaster_fk
        FROM productsandservices p
        WHERE p.id = t.products_services_fk
        """
    )
    op.execute(
        """
        UPDATE bill_item_aliases a
        SET categorymaster_fk = p.categorymaster_fk
        FROM productsandservices p
        WHERE p.id = a.productsandservices_fk
        """
    )

    op.drop_column('productsandservices', 'categorymaster_fk')


def downgrade() -> None:
    """Downgrade schema."""
    op.add_column('productsandservices', sa.Column('categorymaster_fk', sa.Integer(), nullable=True))
    # Only one category survives the downgrade: keep the lowest-id link.
    op.execute(
        """
        UPDATE productsandservices p
        SET categorymaster_fk = (
            SELECT MIN(pc.categorymaster_fk)
            FROM productsandservices_categories pc
            WHERE pc.productsandservices_fk = p.id
        )
        """
    )
    op.execute(
        """
        UPDATE productsandservices
        SET categorymaster_fk = (SELECT MIN(id) FROM categorymaster)
        WHERE categorymaster_fk IS NULL
        """
    )
    op.alter_column('productsandservices', 'categorymaster_fk', nullable=False)

    op.drop_column('bill_item_aliases', 'categorymaster_fk')
    op.drop_column('transactions', 'categorymaster_fk')
    op.drop_index(op.f('ix_productsandservices_categories_id'), table_name='productsandservices_categories')
    op.drop_table('productsandservices_categories')
