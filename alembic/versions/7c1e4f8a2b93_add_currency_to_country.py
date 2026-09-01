"""Add currency JSONB column to country

Revision ID: 7c1e4f8a2b93
Revises: 3f2c9a7b5e14
Create Date: 2026-09-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '7c1e4f8a2b93'
down_revision: Union[str, Sequence[str], None] = '3f2c9a7b5e14'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('country', sa.Column('currency', postgresql.JSONB(astext_type=sa.Text()), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('country', 'currency')
