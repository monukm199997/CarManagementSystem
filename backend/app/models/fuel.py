from datetime import datetime

from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Date,
    DateTime,
    ForeignKey,
    Text,
)

from sqlalchemy.orm import relationship

from app.db.base import Base


class Fuel(Base):

    __tablename__ = "fuel_records"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    car_id = Column(
        Integer,
        ForeignKey("cars.id"),
        nullable=False,
        index=True
    )

    fuel_date = Column(
        Date,
        nullable=False,
        index=True
    )

    odometer_reading = Column(
        Integer,
        nullable=False
    )

    fuel_type = Column(
        String(50),
        nullable=False
    )

    litres = Column(
        Float,
        nullable=False
    )

    price_per_litre = Column(
        Float,
        nullable=False
    )

    total_cost = Column(
        Float,
        nullable=False
    )

    fuel_station = Column(
        String(150),
        nullable=True
    )

    notes = Column(
        Text,
        nullable=True
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    car = relationship(
        "Car",
        back_populates="fuel_records"
    )