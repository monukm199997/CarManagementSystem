from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional

class ServiceBase(BaseModel):
    service_type: str
    service_date: date
    odometer_reading: Optional[int] = None
    service_center: Optional[str] = None
    cost: Optional[float] = None
    next_service_due: Optional[date] = None
    status: Optional[str] = "completed"

class ServiceCreate(ServiceBase):
    car_id: int

class ServiceUpdate(BaseModel):
    service_type: Optional[str] = None
    cost: Optional[float] = None
    next_service_due: Optional[date] = None
    status: Optional[str] = None

class ServiceOut(ServiceBase):
    id: int
    car_id: int
    created_at: datetime

    class Config:
        from_attributes = True
