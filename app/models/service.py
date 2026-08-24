from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Date, Float
from app.db.base import Base
from datetime import datetime
from sqlalchemy.orm import relationship


class Services(Base):
    __tablename__ = "services"

    id = Column(Integer, primary_key=True, index=True)
    car_id = Column(Integer,ForeignKey("cars.id"), nullable=False)
    service_type = Column(String, nullable=False)
    service_date = Column(Date, nullable=False)
    odometer_reading = Column(Integer)
    service_center = Column(String)
    cost = Column(Float)
    next_service_due = Column(Date)
    status = Column(String, default="completed")
    created_at = Column(DateTime, default=datetime.utcnow)

    car = relationship("Car")

    