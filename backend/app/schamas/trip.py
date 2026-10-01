from datetime import datetime
from typing import Literal

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    model_validator
)


TripStatus = Literal[
    "planned",
    "ongoing",
    "completed",
    "cancelled"
]


class TripBase(BaseModel):

    driver_id: int = Field(
        ...,
        gt=0
    )

    car_id: int = Field(
        ...,
        gt=0
    )

    start_location: str = Field(
        ...,
        min_length=2,
        max_length=255
    )

    destination: str = Field(
        ...,
        min_length=2,
        max_length=255
    )

    start_datetime: datetime

    end_datetime: datetime | None = None

    start_odometer: float | None = Field(
        default=None,
        ge=0
    )

    end_odometer: float | None = Field(
        default=None,
        ge=0
    )

    purpose: str | None = Field(
        default=None,
        max_length=255
    )

    notes: str | None = None


class TripCreate(TripBase):
    pass


class TripUpdate(BaseModel):

    start_location: str | None = Field(
        default=None,
        min_length=2,
        max_length=255
    )

    destination: str | None = Field(
        default=None,
        min_length=2,
        max_length=255
    )

    start_datetime: datetime | None = None

    end_datetime: datetime | None = None

    start_odometer: float | None = Field(
        default=None,
        ge=0
    )

    end_odometer: float | None = Field(
        default=None,
        ge=0
    )

    purpose: str | None = Field(
        default=None,
        max_length=255
    )

    status: TripStatus | None = None

    notes: str | None = None


class TripOut(TripBase):

    id: int

    status: str

    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )