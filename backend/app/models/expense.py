from datetime import datetime

from sqlalchemy import (
    Column,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    Index,
)

from sqlalchemy.orm import relationship

from app.db.base import Base


class Expense(Base):

    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    car_id = Column(
        Integer, ForeignKey("cars.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    driver_id = Column(
        Integer,
        ForeignKey("drivers.id", ondelete="RESTRICT"),
        nullable=True,
        index=True,
    )

    trip_id = Column(
        Integer, ForeignKey("trips.id", ondelete="RESTRICT"), nullable=True, index=True
    )
    expense_date = Column(Date, nullable=False, index=True)
    category = Column(String(50), nullable=False, index=True)
    amount = Column(Float, nullable=False)
    description = Column(String(255), nullable=True)
    vendor = Column(String(150), nullable=True)
    payment_method = Column(String(50), nullable=True)
    receipt_number = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    status = Column(String(20), nullable=False, default="active", index=True)

    car = relationship("Car", back_populates="expenses")
    driver = relationship("Driver", back_populates="expenses")
    trip = relationship("Trip", back_populates="expenses")

    __table_args__ = (
        Index("ix_expenses_car_date", "car_id", "expense_date"),
        Index("ix_expenses_car_category", "car_id", "category"),
        Index("ix_expenses_driver_date", "driver_id", "expense_date"),
        Index("ix_expenses_trip_date", "trip_id", "expense_date"),
    )
