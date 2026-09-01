"""Add geography tables (country, state, district, pincode)

Revision ID: 3f2c9a7b5e14
Revises: 05a4c54d362a
Create Date: 2026-08-27 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '3f2c9a7b5e14'
down_revision: Union[str, Sequence[str], None] = '05a4c54d362a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'country',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('country', sa.String(length=50), nullable=False),
        sa.Column('flag', sa.Text(), nullable=True),
        sa.Column('country_code', sa.String(length=3), nullable=False),
        sa.Column('country_phone_code', sa.String(length=3), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('country'),
        sa.UniqueConstraint('country_code'),
        sa.UniqueConstraint('country_phone_code'),
    )
    op.create_index(op.f('ix_country_id'), 'country', ['id'], unique=False)

    op.create_table(
        'state',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('state', sa.String(length=25), nullable=False),
        sa.Column('country_fk', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['country_fk'], ['country.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('state'),
    )
    op.create_index(op.f('ix_state_id'), 'state', ['id'], unique=False)

    op.create_table(
        'district',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('city', sa.String(length=25), nullable=False),
        sa.Column('district', sa.String(length=25), nullable=False),
        sa.Column('tag', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('state_fk', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['state_fk'], ['state.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('district'),
    )
    op.create_index(op.f('ix_district_id'), 'district', ['id'], unique=False)

    op.create_table(
        'pincode',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('pincode', sa.String(length=6), nullable=False),
        sa.Column('district_fk', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['district_fk'], ['district.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_pincode_id'), 'pincode', ['id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_pincode_id'), table_name='pincode')
    op.drop_table('pincode')
    op.drop_index(op.f('ix_district_id'), table_name='district')
    op.drop_table('district')
    op.drop_index(op.f('ix_state_id'), table_name='state')
    op.drop_table('state')
    op.drop_index(op.f('ix_country_id'), table_name='country')
    op.drop_table('country')
