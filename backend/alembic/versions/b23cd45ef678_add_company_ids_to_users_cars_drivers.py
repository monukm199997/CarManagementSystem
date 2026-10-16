
"""add company ids to users, cars and drivers

Revision ID: b23cd45ef678
Revises: a12bc34de567
"""

from alembic import op
import sqlalchemy as sa


revision = "b23cd45ef678"
down_revision = "a12bc34de567"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add nullable columns first to avoid breaking existing inserts.
    op.add_column(
        "users",
        sa.Column("company_id", sa.Integer(), nullable=True),
    )
    op.add_column(
        "cars",
        sa.Column("company_id", sa.Integer(), nullable=True),
    )
    op.add_column(
        "drivers",
        sa.Column("company_id", sa.Integer(), nullable=True),
    )

    # Add foreign keys.
    op.create_foreign_key(
        "fk_users_company_id_companies",
        "users",
        "companies",
        ["company_id"],
        ["id"],
        ondelete="RESTRICT",
    )
    op.create_foreign_key(
        "fk_cars_company_id_companies",
        "cars",
        "companies",
        ["company_id"],
        ["id"],
        ondelete="RESTRICT",
    )
    op.create_foreign_key(
        "fk_drivers_company_id_companies",
        "drivers",
        "companies",
        ["company_id"],
        ["id"],
        ondelete="RESTRICT",
    )

    # Add indexes.
    op.create_index(
        "ix_users_company_id",
        "users",
        ["company_id"],
        unique=False,
    )
    op.create_index(
        "ix_cars_company_id",
        "cars",
        ["company_id"],
        unique=False,
    )
    op.create_index(
        "ix_drivers_company_id",
        "drivers",
        ["company_id"],
        unique=False,
    )

    # Backfill existing records using the Legacy Company created in Step 1.
    op.execute(
        """
        UPDATE users
        SET company_id = (
            SELECT id
            FROM companies
            WHERE name = 'Legacy Company'
            ORDER BY id
            LIMIT 1
        )
        WHERE company_id IS NULL
        """
    )

    op.execute(
        """
        UPDATE cars
        SET company_id = (
            SELECT id
            FROM companies
            WHERE name = 'Legacy Company'
            ORDER BY id
            LIMIT 1
        )
        WHERE company_id IS NULL
        """
    )

    op.execute(
        """
        UPDATE drivers
        SET company_id = (
            SELECT id
            FROM companies
            WHERE name = 'Legacy Company'
            ORDER BY id
            LIMIT 1
        )
        WHERE company_id IS NULL
        """
    )


def downgrade() -> None:
    op.drop_index("ix_drivers_company_id", table_name="drivers")
    op.drop_index("ix_cars_company_id", table_name="cars")
    op.drop_index("ix_users_company_id", table_name="users")

    op.drop_constraint(
        "fk_drivers_company_id_companies",
        "drivers",
        type_="foreignkey",
    )
    op.drop_constraint(
        "fk_cars_company_id_companies",
        "cars",
        type_="foreignkey",
    )
    op.drop_constraint(
        "fk_users_company_id_companies",
        "users",
        type_="foreignkey",
    )

    op.drop_column("drivers", "company_id")
    op.drop_column("cars", "company_id")
    op.drop_column("users", "company_id")
