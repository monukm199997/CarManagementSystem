from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


class DriverHistoryOut(BaseModel):

    id: int
    driver_id: int
    car_id: int
    registration_number: str | None = None
    brand: str | None = None
    model: str | None = None
    assigned_from: date
    assigned_to: date | None = None
    status: str
    notes: str | None = None
    created_at: datetime
    model_config = ConfigDict(
        from_attributes=True
    )