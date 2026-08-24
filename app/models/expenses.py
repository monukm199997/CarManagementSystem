from sqlalchemy import Column, Integer, String, Float, ForeignKey, Date, DateTime
from app.db.base import Base
from datetime import datetime
from sqlalchemy.orm import relationship

class Expenses(Base):
    __tablename__ = "expenses"
    
    id = Column(Integer, primary_key=True, index= True)
    car_id = Column(Integer, ForeignKey("cars.id"), nullable=False)
    expense_type = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    expenses_date = Column(Date, nullable=False)
    description = Column(String)
    creates_at = Column(DateTime, default=datetime.utcnow)

    car = relationship("Car")