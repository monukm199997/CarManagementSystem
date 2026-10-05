from datetime import datetime

from pydantic import BaseModel, ConfigDict


class NotificationPreferenceBase(BaseModel):
    document_expiry: bool = True
    insurance_expiry: bool = True
    service_due: bool = True
    license_expiry: bool = True


class NotificationPreferenceUpdate(NotificationPreferenceBase):
    pass


class NotificationPreferenceOut(NotificationPreferenceBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
