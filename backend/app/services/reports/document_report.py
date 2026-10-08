from datetime import date
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.vehicle_document import VehicleDocument
from app.models.car import Car
from app.core.roles import CUSTOMER
from app.services.reports.report_access import (
    validate_customer_car_access,
)


def get_document_report(
    db: Session,
    current_user,
    car_id: int | None = None,
    document_type: str | None = None,
    status: str | None = None,
    insurance_status: str | None = None,
    page: int = 1,
    page_size: int = 50,
):

    validate_customer_car_access(
        db=db,
        current_user=current_user,
        car_id=car_id,
    )
    query = db.query(
        VehicleDocument,
        Car.registration_number,
        Car.brand,
        Car.model,
    ).join(Car, Car.id == VehicleDocument.car_id)

    if current_user.role == CUSTOMER:
        query = query.filter(Car.owner_id == current_user.id)

    # -----------------------------
    # Basic filters
    # -----------------------------

    if car_id is not None:
        query = query.filter(VehicleDocument.car_id == car_id)

    if document_type:
        query = query.filter(
            func.lower(VehicleDocument.document_type) == document_type.lower()
        )
    if status:
        query = query.filter(VehicleDocument.status == status)

    # -----------------------------
    # Insurance filter
    # -----------------------------

    if insurance_status:
        query = query.filter(func.lower(VehicleDocument.document_type) == "insurance")

    total_records = query.count()

    # -----------------------------
    # Pagination
    # -----------------------------

    offset = (page - 1) * page_size

    rows = (
        query.order_by(
            VehicleDocument.expiry_date.asc(),
            VehicleDocument.id.desc(),
        )
        .offset(offset)
        .limit(page_size)
        .all()
    )

    today = date.today()

    data = []

    for (
        document,
        registration_number,
        brand,
        model,
    ) in rows:

        days_to_expiry = None

        if document.expiry_date is not None:
            days_to_expiry = (document.expiry_date - today).days

        # -----------------------------
        # Expiry status
        # -----------------------------

        if document.expiry_date is None:
            expiry_status = "No Expiry Date"

        elif days_to_expiry < 0:
            expiry_status = "Expired"

        elif days_to_expiry <= 30:
            expiry_status = "Expiring Soon"

        else:
            expiry_status = "Active"

        is_insurance = document.document_type.lower() == "insurance"

        # -----------------------------
        # Insurance status filter
        # -----------------------------

        if insurance_status:
            if insurance_status == "expired":
                if not (
                    is_insurance and days_to_expiry is not None and days_to_expiry < 0
                ):
                    continue

            elif insurance_status == "expiring_soon":
                if not (
                    is_insurance
                    and days_to_expiry is not None
                    and 0 <= days_to_expiry <= 30
                ):
                    continue

            elif insurance_status == "active":
                if not (
                    is_insurance and days_to_expiry is not None and days_to_expiry > 30
                ):
                    continue

            elif insurance_status == "all":
                if not is_insurance:
                    continue

        data.append(
            {
                "id": document.id,
                "car_id": document.car_id,
                "registration_number": registration_number,
                "brand": brand,
                "model": model,
                "document_type": document.document_type,
                "document_number": document.document_number,
                "issue_date": document.issue_date,
                "expiry_date": document.expiry_date,
                "file_path": document.file_path,
                "notes": document.notes,
                "status": document.status,
                "days_to_expiry": days_to_expiry,
                "expiry_status": expiry_status,
                "is_insurance": is_insurance,
            }
        )

    total_pages = (
        (total_records + page_size - 1) // page_size if total_records > 0 else 0
    )

    return {
        "data": data,
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total_records": total_records,
            "total_pages": total_pages,
        },
    }
