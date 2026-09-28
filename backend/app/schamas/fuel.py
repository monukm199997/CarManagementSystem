from datetime import date, datetime

from pydantic import BaseModel, Field


class FuelBase(BaseModel):

    fuel_date: date
    odometer_reading: int = Field(..., ge=0)
    fuel_type: str = Field(..., min_length=1, max_length=50)
    litres: float = Field(..., gt=0)
    price_per_litre: float = Field(..., gt=0)
    total_cost: float = Field(..., gt=0)
    fuel_station: str | None = Field(default=None, max_length=150)
    notes: str | None = None

class FuelCreate(FuelBase):

    car_id: int


class FuelUpdate(BaseModel):

    fuel_date: date | None = None
    odometer_reading: int | None = Field(default=None, ge=0)
    fuel_type: str | None = Field(default=None, min_length=1, max_length=50)
    litres: float | None = Field(default=None, gt=0)
    price_per_litre: float | None = Field(default=None, gt=0)
    total_cost: float | None = Field(default=None, gt=0)
    fuel_station: str | None = Field(default=None, max_length=150)
    notes: str | None = None


class FuelOut(FuelBase):

    id: int
    car_id: int
    created_at: datetime

    class Config:
        from_attributes = True
