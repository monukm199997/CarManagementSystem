from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


class DriverVehicleAssignmentCreate(BaseModel):
    driver_id: int
    car_id: int
    assigned_from: date
    assigned_to: date | None = None
    notes: str | None = None


class DriverVehicleAssignmentUpdate(BaseModel):
    assigned_from: date | None = None
    assigned_to: date | None = None
    status: str | None = None
    notes: str | None = None


class DriverVehicleAssignmentOut(BaseModel):
    id: int
    driver_id: int
    car_id: int
    assigned_from: date
    assigned_to: date | None
    status: str
    notes: str | None
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )