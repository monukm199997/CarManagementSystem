from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


class VehicleDocumentBase(BaseModel):

    car_id: int

    document_type: str

    document_number: str | None = None

    issue_date: date | None = None

    expiry_date: date | None = None

    file_path: str | None = None

    notes: str | None = None


class VehicleDocumentCreate(
    VehicleDocumentBase
):
    pass


class VehicleDocumentUpdate(BaseModel):

    document_type: str | None = None

    document_number: str | None = None

    issue_date: date | None = None

    expiry_date: date | None = None

    file_path: str | None = None

    notes: str | None = None

    status: str | None = None


class VehicleDocumentOut(
    VehicleDocumentBase
):

    id: int

    status: str

    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )