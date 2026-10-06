from sqlalchemy.orm import Session

from app.models.expense import Expense
from app.models.car import Car
from app.models.driver import Driver
from app.models.trip import Trip


def get_expense_report(
    db: Session,
    car_id: int | None = None,
    driver_id: int | None = None,
    trip_id: int | None = None,
    category: str | None = None,
    status: str | None = None,
    page: int = 1,
    page_size: int = 50,
):
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

    # -----------------------------
    # VEHICLE FILTER
    # -----------------------------
    if car_id is not None:
        query = query.filter(Expense.car_id == car_id)

    # -----------------------------
    # DRIVER FILTER
    # -----------------------------
    if driver_id is not None:
        query = query.filter(Expense.driver_id == driver_id)

    # -----------------------------
    # TRIP FILTER
    # -----------------------------
    if trip_id is not None:
        query = query.filter(Expense.trip_id == trip_id)

    # -----------------------------
    # CATEGORY FILTER
    # -----------------------------
    if category:
        query = query.filter(Expense.category == category)

    # -----------------------------
    # STATUS FILTER
    # -----------------------------
    if status:
        query = query.filter(Expense.status == status)

    # -----------------------------
    # TOTAL RECORDS
    # -----------------------------
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
