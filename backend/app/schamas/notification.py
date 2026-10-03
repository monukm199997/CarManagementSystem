from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

NotificationType = Literal[
    "document_expiry",
    "license_expiry",
    "service_due",
    "insurance_expiry",
    "tax_expiry",
    "trip_alert",
    "expense_alert",
    "system",
]


NotificationPriority = Literal[
    "low",
    "medium",
    "high",
    "critical",
]


class NotificationBase(BaseModel):
    type: NotificationType

    title: str = Field(..., min_length=2, max_length=255)

    message: str = Field(..., min_length=2)

    priority: NotificationPriority = "medium"

    entity_type: str | None = Field(default=None, max_length=50)

    entity_id: int | None = Field(default=None, gt=0)


class NotificationCreate(NotificationBase):
    user_id: int = Field(..., gt=0)


class NotificationOut(NotificationBase):
    id: int
    user_id: int
    is_read: bool
    read_at: datetime | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class NotificationReadUpdate(BaseModel):
    is_read: bool
