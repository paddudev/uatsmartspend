"""Make users.usergroup_fk not null

Revision ID: 05a4c54d362a
Revises: 853e80a5e648
Create Date: 2026-08-26 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '05a4c54d362a'
down_revision: Union[str, Sequence[str], None] = '853e80a5e648'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.alter_column('users', 'usergroup_fk',
               existing_type=sa.Integer(),
               nullable=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.alter_column('users', 'usergroup_fk',
               existing_type=sa.Integer(),
               nullable=True)
