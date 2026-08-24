"""Add network access, ip allowlist, and usergroup mapping to users

Revision ID: 853e80a5e648
Revises: ca1195a15f6c
Create Date: 2026-08-24 15:15:15.983380

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from passlib.context import CryptContext

# revision identifiers, used by Alembic.
revision: str = '853e80a5e648'
down_revision: Union[str, Sequence[str], None] = 'ca1195a15f6c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def upgrade() -> None:
    """Upgrade schema."""
    op.alter_column('users', 'hashed_password',
               existing_type=sa.VARCHAR(length=25),
               type_=sa.String(length=255))
    op.add_column('users', sa.Column('network_access', sa.String(length=20), server_default='open', nullable=False))
    op.add_column('users', sa.Column('ip_addresses', postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column('users', sa.Column('usergroup_fk', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_users_usergroup_fk_usergroup', 'users', 'usergroup', ['usergroup_fk'], ['id'])

    # Existing rows predate password hashing and store the plaintext
    # password directly; re-hash them in place so login keeps working.
    connection = op.get_bind()
    users_table = sa.table('users', sa.column('id', sa.Integer), sa.column('hashed_password', sa.String))
    rows = connection.execute(sa.select(users_table.c.id, users_table.c.hashed_password)).fetchall()
    for row in rows:
        if not row.hashed_password.startswith(('$2a$', '$2b$', '$2y$')):
            connection.execute(
                users_table.update()
                .where(users_table.c.id == row.id)
                .values(hashed_password=pwd_context.hash(row.hashed_password))
            )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint('fk_users_usergroup_fk_usergroup', 'users', type_='foreignkey')
    op.drop_column('users', 'usergroup_fk')
    op.drop_column('users', 'ip_addresses')
    op.drop_column('users', 'network_access')
    op.alter_column('users', 'hashed_password',
               existing_type=sa.String(length=255),
               type_=sa.VARCHAR(length=25))
    # Note: password hashes cannot be reversed back to plaintext.
