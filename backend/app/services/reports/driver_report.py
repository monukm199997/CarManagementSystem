from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.driver import Driver
from app.models.trip import Trip
from app.models.expense import Expense


def get_driver_report(
    db: Session,
    driver_id: int | None = None,
    status: str | None = None,
    page: int = 1,
    page_size: int = 50,
):
    query = db.query(Driver)

    # -----------------------------
    # DRIVER FILTER
    # -----------------------------
    if driver_id is not None:
        query = query.filter(Driver.id == driver_id)

    # -----------------------------
    # STATUS FILTER
    # -----------------------------
    if status:
        query = query.filter(Driver.status == status)

    # -----------------------------
    # TOTAL RECORDS
    # -----------------------------
    total_records = query.count()

    offset = (page - 1) * page_size

    drivers = (
        query.order_by(
            Driver.name.asc(),
            Driver.id.asc(),
        )
        .offset(offset)
        .limit(page_size)
        .all()
    )

    data = []

    for driver in drivers:

        # -----------------------------
        # TOTAL TRIPS
        # -----------------------------
        total_trips = (
            db.query(func.count(Trip.id)).filter(Trip.driver_id == driver.id).scalar()
            or 0
        )

        # -----------------------------
        # TOTAL EXPENSES
        # -----------------------------
        total_expenses = (
            db.query(
                func.coalesce(
                    func.sum(Expense.amount),
                    0,
                )
            )
            .filter(Expense.driver_id == driver.id)
            .scalar()
            or 0
        )

        data.append(
            {
                "id": driver.id,
                "name": driver.name,
                "email": driver.email,
                "phone": driver.phone,
                "license_number": driver.license_number,
                "license_issue_date": (driver.license_issue_date),
                "license_expiry_date": (driver.license_expiry_date),
                "address": driver.address,
                "emergency_contact_name": (driver.emergency_contact_name),
                "emergency_contact_phone": (driver.emergency_contact_phone),
                "joining_date": driver.joining_date,
                "status": driver.status,
                "notes": driver.notes,
                "total_trips": total_trips,
                "total_expenses": float(total_expenses),
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
