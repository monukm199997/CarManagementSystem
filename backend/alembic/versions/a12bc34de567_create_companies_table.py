"""create companies table

Revision ID: a12bc34de567
Revises: f405b2955611
"""

from alembic import op
import sqlalchemy as sa

revision = "a12bc34de567"
down_revision = "f405b2955611"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "companies",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=150), nullable=False),
        sa.Column("email", sa.String(length=150), nullable=True),
        sa.Column("phone", sa.String(length=20), nullable=True),
        sa.Column("address", sa.Text(), nullable=True),
        sa.Column(
            "status",
            sa.String(length=20),
            nullable=False,
            server_default="active",
        ),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )

    op.create_index(
        "ix_companies_id",
        "companies",
        ["id"],
        unique=False,
    )

    op.create_index(
        "ix_companies_name",
        "companies",
        ["name"],
        unique=False,
    )

    # Placeholder for existing data.
    # Existing users/cars/drivers will be linked in a later migration.
    op.execute(sa.text("""
            INSERT INTO companies (name, status, created_at, updated_at)
            VALUES (
                'Legacy Company',
                'active',
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            )
            """))


def downgrade() -> None:
    op.drop_index("ix_companies_name", table_name="companies")
    op.drop_index("ix_companies_id", table_name="companies")
    op.drop_table("companies")
