from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.app.db.base import Base

class Car(Base):

    __tablename__ = "cars"

    id = Column(Integer, primary_key=True, index=True)
    registration_number  = Column(String, unique=True, index=True, nullable=False)
    brand = Column(String, nullable=False)
    model = Column(String, nullable= False)
    fuel_type = Column(String, nullable=False)
    year = Column(Integer, nullable=False)
    color = Column(String)
    status = Column(String, default='active', nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("Users", back_populates="cars")
    services = relationship("Services", back_populates="car", cascade="all, delete-orphan",)
    expenses = relationship("Expenses", back_populates="car", cascade="all, delete-orphan",)