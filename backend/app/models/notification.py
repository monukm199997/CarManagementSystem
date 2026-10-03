from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from app.db.base import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    type = Column(String(50), nullable=False, index=True)

    title = Column(String(255), nullable=False)

    message = Column(Text, nullable=False)

    priority = Column(String(20), nullable=False, default="medium", index=True)

    entity_type = Column(String(50), nullable=True, index=True)

    entity_id = Column(Integer, nullable=True, index=True)

    is_read = Column(Boolean, nullable=False, default=False, index=True)

    read_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    user = relationship("Users", back_populates="notifications")

    __table_args__ = (
        Index("ix_notifications_user_read", "user_id", "is_read"),
        Index("ix_notifications_user_created", "user_id", "created_at"),
        Index("ix_notifications_entity", "entity_type", "entity_id"),
    )
