from datetime import datetime

from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    JSON,
    String,
    Index,
)

from app.db.base import Base


class ReportDownloadHistory(Base):

    __tablename__ = "report_download_history"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id = Column(
        Integer,
        ForeignKey(
            "users.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    report_type = Column(
        String(50),
        nullable=False,
        index=True,
    )

    export_format = Column(
        String(20),
        nullable=False,
        index=True,
    )

    file_name = Column(
        String(255),
        nullable=False,
    )

    filters = Column(
        JSON,
        nullable=True,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
        index=True,
    )

    __table_args__ = (
        Index(
            "ix_report_download_history_user_date",
            "user_id",
            "created_at",
        ),
        Index(
            "ix_report_download_history_report_format",
            "report_type",
            "export_format",
        ),
    )
