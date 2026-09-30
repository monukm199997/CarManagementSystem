from datetime import date, datetime
from typing import Literal
from pydantic import BaseModel, ConfigDict, EmailStr, Field

# ============================================
# DRIVER BASE
# ============================================


class DriverBase(BaseModel):

    name: str = Field(..., min_length=2, max_length=150)

    email: EmailStr | None = None

    phone: str = Field(..., min_length=7, max_length=15)

    license_number: str = Field(..., min_length=3, max_length=100)

    license_issue_date: date | None = None

    license_expiry_date: date | None = None

    address: str | None = None

    emergency_contact_name: str | None = None

    emergency_contact_phone: str | None = Field(
        default=None, min_length=7, max_length=15
    )

    joining_date: date | None = None

    notes: str | None = None


# ============================================
# CREATE DRIVER
# ============================================


class DriverCreate(DriverBase):
    pass


# ============================================
# UPDATE DRIVER
# ============================================


class DriverUpdate(BaseModel):

    name: str | None = Field(default=None, min_length=2, max_length=150)

    email: EmailStr | None = None

    phone: str | None = Field(default=None, min_length=7, max_length=15)

    license_number: str | None = Field(default=None, min_length=3, max_length=100)

    license_issue_date: date | None = None

    license_expiry_date: date | None = None

    address: str | None = None

    emergency_contact_name: str | None = None

    emergency_contact_phone: str | None = Field(
        default=None, min_length=7, max_length=15
    )

    joining_date: date | None = None

    status: Literal["active", "inactive", "suspended"] | None = None

    notes: str | None = None



class DriverStatusUpdate(BaseModel):
    status: Literal[
        "active",
        "inactive",
        "suspended"
    ]
# ============================================
# DRIVER OUTPUT
# ============================================

class AssignedCarOut(BaseModel):
    id: int
    registration_number: str
    brand: str | None = None
    model: str | None = None

    model_config = ConfigDict(
        from_attributes=True
    )


class DriverOut(DriverBase):

    id: int

    status: str

    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DriverListOut(DriverOut):
    assigned_car: AssignedCarOut | None = None