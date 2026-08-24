from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional

class ExpenseBase(BaseModel):
    expense_type: str
    amount: float
    expenses_date: date
    description: Optional[str] = None

class ExpenseCreate(ExpenseBase):
    car_id: int

class ExpenseUpdate(BaseModel):
    expense_type: Optional[str] = None
    amount: Optional[float] = None
    expenses_date: Optional[date] = None
    description: Optional[str] = None

class ExpenseOut(ExpenseBase):
    id: int
    car_id: int
    creates_at: datetime


    class Config:
        from_attributes = True