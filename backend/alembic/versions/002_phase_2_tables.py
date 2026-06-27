"""Phase 2 business tables

Revision ID: 002
Revises: 001
Create Date: 2026-06-24
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Custom enums for RFQ and Quote status
    rfq_status = sa.Enum("draft", "open", "closed", "awarded", name="rfq_status")
    quote_status = sa.Enum("pending", "accepted", "rejected", name="quote_status")

    rfq_status.create(op.get_bind(), checkfirst=True)
    quote_status.create(op.get_bind(), checkfirst=True)

    # 1. products
    op.create_table(
        "products",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("company_id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("sku", sa.String(length=100), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("price", sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column("currency", sa.String(length=3), server_default="USD", nullable=False),
        sa.Column("stock_quantity", sa.Integer(), server_default="0", nullable=False),
        sa.Column("image_url", sa.String(length=500), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_products_company_id", "products", ["company_id"])
    op.create_index("ix_products_sku", "products", ["sku"])

    # 2. rfqs
    op.create_table(
        "rfqs",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("company_id", sa.UUID(), nullable=False),
        sa.Column("created_by_id", sa.UUID(), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("target_price", sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column("status", rfq_status, server_default="open", nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"]),
        sa.ForeignKeyConstraint(["created_by_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_rfqs_company_id", "rfqs", ["company_id"])
    op.create_index("ix_rfqs_created_by_id", "rfqs", ["created_by_id"])

    # 3. quotes
    op.create_table(
        "quotes",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("rfq_id", sa.UUID(), nullable=False),
        sa.Column("company_id", sa.UUID(), nullable=False),
        sa.Column("created_by_id", sa.UUID(), nullable=False),
        sa.Column("price", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column("lead_time_days", sa.Integer(), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("status", quote_status, server_default="pending", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"]),
        sa.ForeignKeyConstraint(["created_by_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["rfq_id"], ["rfqs.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_quotes_rfq_id", "quotes", ["rfq_id"])
    op.create_index("ix_quotes_company_id", "quotes", ["company_id"])
    op.create_index("ix_quotes_created_by_id", "quotes", ["created_by_id"])

    # 4. messages
    op.create_table(
        "messages",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("sender_id", sa.UUID(), nullable=False),
        sa.Column("receiver_id", sa.UUID(), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("read_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["receiver_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["sender_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_messages_receiver_id", "messages", ["receiver_id"])
    op.create_index("ix_messages_sender_id", "messages", ["sender_id"])

    # 5. reviews
    op.create_table(
        "reviews",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("company_id", sa.UUID(), nullable=False),
        sa.Column("reviewer_company_id", sa.UUID(), nullable=False),
        sa.Column("rating", sa.Integer(), nullable=False),
        sa.Column("comment", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"]),
        sa.ForeignKeyConstraint(["reviewer_company_id"], ["companies.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_reviews_company_id", "reviews", ["company_id"])
    op.create_index("ix_reviews_reviewer_company_id", "reviews", ["reviewer_company_id"])


def downgrade() -> None:
    op.drop_table("reviews")
    op.drop_table("messages")
    op.drop_table("quotes")
    op.drop_table("rfqs")
    op.drop_table("products")
    sa.Enum(name="quote_status").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="rfq_status").drop(op.get_bind(), checkfirst=True)
