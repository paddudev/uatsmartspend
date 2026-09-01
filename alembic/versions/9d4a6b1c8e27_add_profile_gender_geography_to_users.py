"""Add profile_photo, gender_fk, country_fk, pincode_fk to users

Revision ID: 9d4a6b1c8e27
Revises: 7c1e4f8a2b93
Create Date: 2026-09-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '9d4a6b1c8e27'
down_revision: Union[str, Sequence[str], None] = '7c1e4f8a2b93'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('users', sa.Column('profile_photo', sa.Text(), nullable=True))
    op.add_column('users', sa.Column('gender_fk', sa.Integer(), nullable=True))
    op.add_column('users', sa.Column('country_fk', sa.Integer(), nullable=True))
    op.add_column('users', sa.Column('pincode_fk', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_users_gender_fk_commonmaster', 'users', 'commonmaster', ['gender_fk'], ['id'])
    op.create_foreign_key('fk_users_country_fk_country', 'users', 'country', ['country_fk'], ['id'])
    op.create_foreign_key('fk_users_pincode_fk_pincode', 'users', 'pincode', ['pincode_fk'], ['id'])


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint('fk_users_pincode_fk_pincode', 'users', type_='foreignkey')
    op.drop_constraint('fk_users_country_fk_country', 'users', type_='foreignkey')
    op.drop_constraint('fk_users_gender_fk_commonmaster', 'users', type_='foreignkey')
    op.drop_column('users', 'pincode_fk')
    op.drop_column('users', 'country_fk')
    op.drop_column('users', 'gender_fk')
    op.drop_column('users', 'profile_photo')
