"""Make product/service names unique regardless of case

The existing ix_productsandservices_name unique index is case-sensitive, so
"Burger" and "burger" could both be saved. Add a unique index on lower(name).

Revision ID: e2c7d4f81a95
Revises: d9a5b3e72c64
Create Date: 2026-09-29 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e2c7d4f81a95'
down_revision: Union[str, Sequence[str], None] = 'd9a5b3e72c64'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute("UPDATE productsandservices SET name = trim(name) WHERE name <> trim(name)")
    op.create_index(
        'uq_productsandservices_name_lower',
        'productsandservices',
        [sa.text('lower(name)')],
        unique=True,
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index('uq_productsandservices_name_lower', table_name='productsandservices')
