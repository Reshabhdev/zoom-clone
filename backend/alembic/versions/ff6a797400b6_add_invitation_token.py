"""add_invitation_token

Revision ID: ff6a797400b6
Revises: 
Create Date: 2026-02-26 09:35:37.464252

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ff6a797400b6'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('meetings', sa.Column('invitation_token', sa.String(), nullable=True))
    op.create_index(op.f('ix_meetings_invitation_token'), 'meetings', ['invitation_token'], unique=True)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_meetings_invitation_token'), table_name='meetings')
    op.drop_column('meetings', 'invitation_token')
