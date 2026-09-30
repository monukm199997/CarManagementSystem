from datetime import datetime

from sqlalchemy import (
    Column,
    Date,
    DateTime,
    Integer,
    String,
    Text,
    Index,
    ForeignKey
)

from sqlalchemy.orm import relationship
from app.db.base import Base


class DriverVehicleAssignment(Base):

    __tablename__ = "driver_vehicle_assignments"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    driver_id = Column(
        Integer,
        ForeignKey(
            "drivers.id",
            ondelete="CASCADE"
        ),
        nullable=False,
        index=True
    )

    car_id = Column(
        Integer,
        ForeignKey(
            "cars.id",
            ondelete="CASCADE"
        ),
        nullable=False,
        index=True
    )

    assigned_from = Column(
        Date,
        nullable=False,
        index=True
    )

    assigned_to = Column(
        Date,
        nullable=True,
        index=True
    )

    status = Column(
        String(30),
        nullable=False,
        default="active",
        index=True
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
    

    driver = relationship(
        "Driver",
        back_populates="assignments"
    )

    car = relationship(
        "Car",
        back_populates="driver_assignments"
    )

    __table_args__ = (

        Index(
            "ix_driver_vehicle_driver_status",
            "driver_id",
            "status"
        ),

        Index(
            "ix_driver_vehicle_car_status",
            "car_id",
            "status"
        ),

    )