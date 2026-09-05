from sqlalchemy import Column, Integer, String, Boolean, DateTime
from backend.app.db.base import Base
from datetime import datetime
from sqlalchemy.orm import relationship


class Users(Base):

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    phone = Column(String(15), unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="customer", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    cars = relationship("Car", back_populates="owner", cascade="all, delete-orphan",)