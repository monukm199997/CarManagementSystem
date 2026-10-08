from sqlalchemy.orm import Session

from app.models.service import Services
from app.models.car import Car
from app.core.roles import CUSTOMER
from app.services.reports.report_access import (
    validate_customer_car_access,
)


def get_service_report(
    db: Session,
    current_user,
    car_id: int | None = None,
    status: str | None = None,
    service_type: str | None = None,
    page: int = 1,
    page_size: int = 50,
):
    validate_customer_car_access(
        db=db,
        current_user=current_user,
        car_id=car_id,
    )

    query = db.query(
        Services,
        Car.registration_number,
        Car.brand,
        Car.model,
    ).join(Car, Car.id == Services.car_id)

    if current_user.role == CUSTOMER:
        query = query.filter(Car.owner_id == current_user.id)

    # Vehicle filter
    if car_id is not None:
        query = query.filter(Services.car_id == car_id)

    # Service status filter
    if status:
        query = query.filter(Services.status == status)

    # Service type filter
    if service_type:
        query = query.filter(Services.service_type == service_type)

    # Total records before pagination
    total_records = query.count()

    offset = (page - 1) * page_size

    rows = (
        query.order_by(Services.service_date.desc(), Services.id.desc())
        .offset(offset)
        .limit(page_size)
        .all()
    )

    data = []

    for service, registration_number, brand, model in rows:

        data.append(
            {
                "id": service.id,
                "car_id": service.car_id,
                "registration_number": registration_number,
                "brand": brand,
                "model": model,
                "service_type": service.service_type,
                "service_date": service.service_date,
                "odometer_reading": service.odometer_reading,
                "service_center": service.service_center,
                "cost": float(service.cost or 0),
                "next_service_due": service.next_service_due,
                "status": service.status,
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
