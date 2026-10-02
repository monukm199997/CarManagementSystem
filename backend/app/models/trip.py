from datetime import datetime

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text, Index

from sqlalchemy.orm import relationship

from app.db.base import Base


class Trip(Base):

    __tablename__ = "trips"

    id = Column(Integer, primary_key=True, index=True)
    driver_id = Column(
        Integer,
        ForeignKey("drivers.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    car_id = Column(
        Integer, ForeignKey("cars.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    start_location = Column(String(255), nullable=False)
    destination = Column(String(255), nullable=False)
    start_datetime = Column(DateTime, nullable=False, index=True)
    end_datetime = Column(DateTime, nullable=True)
    start_odometer = Column(Float, nullable=True)
    end_odometer = Column(Float, nullable=True)
    purpose = Column(String(255), nullable=True)
    status = Column(String(30), nullable=False, default="planned", index=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    driver = relationship("Driver", back_populates="trips")
    car = relationship("Car", back_populates="trips")
    expenses = relationship("Expense", back_populates="trip")       

    __table_args__ = (
        Index("ix_trips_driver_status", "driver_id", "status"),
        Index("ix_trips_car_status", "car_id", "status"),
        Index("ix_trips_start_datetime", "start_datetime"),
    )
