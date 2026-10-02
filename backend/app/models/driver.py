from datetime import datetime

from sqlalchemy import Column, Date, DateTime, Integer, String, Text, Index
from sqlalchemy.orm import relationship
from app.db.base import Base


class Driver(Base):

    __tablename__ = "drivers"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String(150), nullable=False, index=True)

    email = Column(String(150), nullable=True, index=True)

    phone = Column(String(15), nullable=False, unique=True, index=True)

    license_number = Column(String(100), nullable=False, unique=True, index=True)

    license_issue_date = Column(Date, nullable=True)

    license_expiry_date = Column(Date, nullable=True, index=True)

    address = Column(Text, nullable=True)

    emergency_contact_name = Column(String(150), nullable=True)

    emergency_contact_phone = Column(String(15), nullable=True)

    joining_date = Column(Date, nullable=True)

    status = Column(String(30), nullable=False, default="active", index=True)

    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    assignments = relationship(
        "DriverVehicleAssignment", back_populates="driver", cascade="all, delete-orphan"
    )

    trips = relationship("Trip", back_populates="driver")
    expenses = relationship("Expense", back_populates="driver")

    __table_args__ = (
        Index("ix_drivers_status_expiry", "status", "license_expiry_date"),
    )
