from sqlalchemy import func
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.driver import Driver
from app.models.trip import Trip
from app.models.expense import Expense
from app.models.car import Car
from app.core.roles import CUSTOMER
from app.services.reports.report_access import get_report_company_id


def get_driver_report(
    db: Session,
    current_user,
    driver_id: int | None = None,
    status: str | None = None,
    page: int = 1,
    page_size: int = 50,
):
    company_id = get_report_company_id(current_user)

    # -----------------------------
    # DRIVER QUERY: COMPANY SCOPE
    # -----------------------------
    query = db.query(Driver).filter(
        Driver.company_id == company_id
    )

    # Customers can only see drivers linked to their own vehicles
    # through trips.
    if current_user.role == CUSTOMER:
        query = query.filter(
            Driver.id.in_(
                db.query(Trip.driver_id)
                .join(Car, Car.id == Trip.car_id)
                .filter(
                    Car.company_id == company_id,
                    Car.owner_id == current_user.id,
                    Trip.driver_id.isnot(None),
                )
            )
        )

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
        # TOTAL TRIPS: COMPANY SCOPE
        # -----------------------------
        trips_query = (
            db.query(func.count(Trip.id))
            .join(Car, Car.id == Trip.car_id)
            .filter(
                Trip.driver_id == driver.id,
                Car.company_id == company_id,
            )
        )

        if current_user.role == CUSTOMER:
            trips_query = trips_query.filter(
                Car.owner_id == current_user.id
            )

        total_trips = trips_query.scalar() or 0

        # -----------------------------
        # TOTAL EXPENSES: COMPANY SCOPE
        # -----------------------------
        expenses_query = (
            db.query(
                func.coalesce(func.sum(Expense.amount), 0)
            )
            .join(Car, Car.id == Expense.car_id)
            .filter(
                Expense.driver_id == driver.id,
                Car.company_id == company_id,
            )
        )

        if current_user.role == CUSTOMER:
            expenses_query = expenses_query.filter(
                Car.owner_id == current_user.id
            )

        total_expenses = expenses_query.scalar() or 0

        data.append(
            {
                "id": driver.id,
                "name": driver.name,
                "email": driver.email,
                "phone": driver.phone,
                "license_number": driver.license_number,
                "license_issue_date": driver.license_issue_date,
                "license_expiry_date": driver.license_expiry_date,
                "address": driver.address,
                "emergency_contact_name": driver.emergency_contact_name,
                "emergency_contact_phone": driver.emergency_contact_phone,
                "joining_date": driver.joining_date,
                "status": driver.status,
                "notes": driver.notes,
                "total_trips": total_trips,
                "total_expenses": float(total_expenses),
            }
        )

    total_pages = (
        (total_records + page_size - 1) // page_size
        if total_records > 0
        else 0
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
