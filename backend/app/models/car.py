from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base import Base

class Car(Base):

    __tablename__ = "cars"

    id = Column(Integer, primary_key=True, index=True)
    registration_number  = Column(String(50), unique=True, index=True, nullable=False)
    brand = Column(String(100), nullable=False)
    model = Column(String(100), nullable= False)
    fuel_type = Column(String(30), nullable=False)
    year = Column(Integer, nullable=False)
    color = Column(String(50))
    status = Column(String(20), default='active', nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False,  index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("Users", back_populates="cars")
    services = relationship("Services", back_populates="car", cascade="all, delete-orphan",)
    expenses = relationship("Expenses", back_populates="car", cascade="all, delete-orphan",)
    fuel_records = relationship("Fuel", back_populates="car", cascade="all, delete-orphan",)
    driver_assignments = relationship("DriverVehicleAssignment", back_populates="car", cascade="all, delete-orphan")
    trips = relationship("Trip", back_populates="car")