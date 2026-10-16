from sqlalchemy.orm import Session

from app.models.expense import Expense
from app.models.car import Car
from app.models.driver import Driver
from app.models.trip import Trip

from app.services.reports.report_access import (
    validate_customer_car_access,
    company_vehicle_filter,
)


def get_expense_report(
    db: Session,
    current_user,
    car_id: int | None = None,
    driver_id: int | None = None,
    trip_id: int | None = None,
    category: str | None = None,
    status: str | None = None,
    page: int = 1,
    page_size: int = 50,
):
    validate_customer_car_access(
        db=db,
        current_user=current_user,
        car_id=car_id,
    )

    query = (
        db.query(
            Expense,
            Car.registration_number,
            Car.brand,
            Car.model,
            Driver.name.label("driver_name"),
            Driver.phone.label("driver_phone"),
            Trip.status.label("trip_status"),
        )
        .join(
            Car,
            Car.id == Expense.car_id,
        )
        .outerjoin(
            Driver,
            Driver.id == Expense.driver_id,
        )
        .outerjoin(
            Trip,
            Trip.id == Expense.trip_id,
        )
    )

    # Restrict expenses to vehicles belonging to this company.
    # Customers are additionally restricted to their own vehicles.
    query = company_vehicle_filter(
        query,
        current_user,
    )

    # Defensive protection against inconsistent cross-company links.
    query = query.filter(
        (Expense.driver_id.is_(None)) | (Driver.company_id == Car.company_id),
        (Expense.trip_id.is_(None))
        | ((Trip.car_id == Expense.car_id) & (Trip.driver_id == Expense.driver_id)),
    )

    # Vehicle filter
    if car_id is not None:
        query = query.filter(Expense.car_id == car_id)

    # Driver filter
    if driver_id is not None:
        query = query.filter(Expense.driver_id == driver_id)

    # Trip filter
    if trip_id is not None:
        query = query.filter(Expense.trip_id == trip_id)

    # Category filter
    if category:
        query = query.filter(Expense.category == category)

    # Status filter
    if status:
        query = query.filter(Expense.status == status)

    total_records = query.count()

    offset = (page - 1) * page_size

    rows = (
        query.order_by(
            Expense.expense_date.desc(),
            Expense.id.desc(),
        )
        .offset(offset)
        .limit(page_size)
        .all()
    )

    data = []

    for (
        expense,
        registration_number,
        brand,
        model,
        driver_name,
        driver_phone,
        trip_status,
    ) in rows:
        data.append(
            {
                "id": expense.id,
                "car_id": expense.car_id,
                "registration_number": registration_number,
                "brand": brand,
                "model": model,
                "driver_id": expense.driver_id,
                "driver_name": driver_name,
                "driver_phone": driver_phone,
                "trip_id": expense.trip_id,
                "trip_status": trip_status,
                "expense_date": expense.expense_date,
                "category": expense.category,
                "amount": float(expense.amount or 0),
                "description": expense.description,
                "vendor": expense.vendor,
                "payment_method": expense.payment_method,
                "receipt_number": expense.receipt_number,
                "notes": expense.notes,
                "status": expense.status,
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
