from sqlalchemy import (
    Column,
    Integer,
    Boolean,
    ForeignKey,
    UniqueConstraint,
    DateTime,
)
from sqlalchemy.orm import relationship
from datetime import datetime

from app.db.base import Base


class NotificationPreference(Base):

    __tablename__ = "notification_preferences"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    document_expiry = Column(
        Boolean,
        nullable=False,
        default=True,
    )

    insurance_expiry = Column(
        Boolean,
        nullable=False,
        default=True,
    )

    service_due = Column(
        Boolean,
        nullable=False,
        default=True,
    )

    license_expiry = Column(
        Boolean,
        nullable=False,
        default=True,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    user = relationship(
        "Users",
        back_populates="notification_preferences",
    )

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            name="uq_notification_preferences_user_id",
        ),
    )
