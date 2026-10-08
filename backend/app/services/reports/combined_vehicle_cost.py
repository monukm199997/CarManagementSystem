from datetime import date

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.car import Car
from app.models.service import Services
from app.models.fuel import Fuel
from app.models.expense import Expense
from app.core.roles import CUSTOMER
from app.services.reports.report_access import (
    validate_customer_car_access,
)


def get_combined_vehicle_cost_report(
    db: Session,
    current_user,
    car_id: int | None = None,
    from_date: date | None = None,
    to_date: date | None = None,
    page: int = 1,
    page_size: int = 50,
):
    validate_customer_car_access(
        db=db,
        current_user=current_user,
        car_id=car_id,
    )

    query = db.query(Car)

    if current_user.role == CUSTOMER:
        query = query.filter(Car.owner_id == current_user.id)

    if car_id is not None:
        query = query.filter(Car.id == car_id)

    total_records = query.count()

    offset = (page - 1) * page_size

    cars = query.order_by(Car.id.asc()).offset(offset).limit(page_size).all()

    data = []

    for car in cars:

        # --------------------------------------------------
        # Service Cost
        # --------------------------------------------------

        service_query = db.query(func.coalesce(func.sum(Services.cost), 0)).filter(
            Services.car_id == car.id
        )

        if from_date is not None:
            service_query = service_query.filter(Services.service_date >= from_date)

        if to_date is not None:
            service_query = service_query.filter(Services.service_date <= to_date)

        service_cost = service_query.scalar() or 0

        # --------------------------------------------------
        # Fuel Cost
        # --------------------------------------------------

        fuel_query = db.query(func.coalesce(func.sum(Fuel.total_cost), 0)).filter(
            Fuel.car_id == car.id
        )

        if from_date is not None:
            fuel_query = fuel_query.filter(Fuel.fuel_date >= from_date)

        if to_date is not None:
            fuel_query = fuel_query.filter(Fuel.fuel_date <= to_date)

        fuel_cost = fuel_query.scalar() or 0

        # --------------------------------------------------
        # Expense Cost
        # --------------------------------------------------

        expense_query = db.query(func.coalesce(func.sum(Expense.amount), 0)).filter(
            Expense.car_id == car.id
        )

        if from_date is not None:
            expense_query = expense_query.filter(Expense.expense_date >= from_date)

        if to_date is not None:
            expense_query = expense_query.filter(Expense.expense_date <= to_date)

        expense_cost = expense_query.scalar() or 0

        # --------------------------------------------------
        # Total
        # --------------------------------------------------

        service_cost = float(service_cost)
        fuel_cost = float(fuel_cost)
        expense_cost = float(expense_cost)

        total_cost = service_cost + fuel_cost + expense_cost

        data.append(
            {
                "car_id": car.id,
                "registration_number": car.registration_number,
                "brand": car.brand,
                "model": car.model,
                "service_cost": service_cost,
                "fuel_cost": fuel_cost,
                "expense_cost": expense_cost,
                "total_cost": total_cost,
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
