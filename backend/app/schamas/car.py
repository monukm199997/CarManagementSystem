from pydantic import BaseModel
from datetime import datetime

class CarBase(BaseModel):
    registration_number: str
    brand: str
    model: str
    fuel_type: str
    year: int
    color: str | None = None


class CarCreate(CarBase):
    owner_id: int

class CarUpdate(BaseModel):
    brand: str | None = None
    model: str | None = None
    fuel_type: str | None = None
    year: int | None = None
    color: str | None = None
    status: str | None = None

class CarOut(CarBase):
    id: int
    status: str
    owner_id: int
    created_at: datetime


    class Config:
        from_attributes = True