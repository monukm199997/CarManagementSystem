from datetime import date, datetime, time

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.car import Car
from app.models.service import Services
from app.models.fuel import Fuel
from app.models.expense import Expense
from app.models.driver import Driver
from app.models.trip import Trip
from app.models.vehicle_document import VehicleDocument
from app.core.roles import CUSTOMER


def get_dashboard_summary(
    db: Session,
    current_user,
    from_date: date | None = None,
    to_date: date | None = None,
):
    # --------------------------------------------------
    # Vehicles
    # --------------------------------------------------

    vehicle_query = db.query(Car)

    if current_user.role == CUSTOMER:
        vehicle_query = vehicle_query.filter(Car.owner_id == current_user.id)

    total_vehicles = vehicle_query.count()

    # --------------------------------------------------
    # Drivers
    # --------------------------------------------------

    if current_user.role == CUSTOMER:
        total_drivers = 0
    else:
        total_drivers = db.query(func.count(Driver.id)).scalar() or 0

    # --------------------------------------------------
    # Documents
    # --------------------------------------------------

    document_query = db.query(VehicleDocument).join(
        Car, Car.id == VehicleDocument.car_id
    )

    if current_user.role == CUSTOMER:
        document_query = document_query.filter(Car.owner_id == current_user.id)

    total_documents = document_query.count()

    # --------------------------------------------------
    # Services
    # --------------------------------------------------

    service_query = db.query(Services).join(Car, Car.id == Services.car_id)

    if current_user.role == CUSTOMER:
        service_query = service_query.filter(Car.owner_id == current_user.id)

    if from_date is not None:
        service_query = service_query.filter(Services.service_date >= from_date)

    if to_date is not None:
        service_query = service_query.filter(Services.service_date <= to_date)

    total_services = service_query.count()

    service_cost = (
        service_query.with_entities(func.coalesce(func.sum(Services.cost), 0)).scalar()
        or 0
    )

    # --------------------------------------------------
    # Fuel
    # --------------------------------------------------

    fuel_query = db.query(Fuel).join(Car, Car.id == Fuel.car_id)

    if current_user.role == CUSTOMER:
        fuel_query = fuel_query.filter(Car.owner_id == current_user.id)

    if from_date is not None:
        fuel_query = fuel_query.filter(Fuel.fuel_date >= from_date)

    if to_date is not None:
        fuel_query = fuel_query.filter(Fuel.fuel_date <= to_date)

    total_fuel_records = fuel_query.count()

    fuel_cost = (
        fuel_query.with_entities(func.coalesce(func.sum(Fuel.total_cost), 0)).scalar()
        or 0
    )

    # --------------------------------------------------
    # Expenses
    # --------------------------------------------------

    expense_query = db.query(Expense).join(Car, Car.id == Expense.car_id)

    if current_user.role == CUSTOMER:
        expense_query = expense_query.filter(Car.owner_id == current_user.id)

    if from_date is not None:
        expense_query = expense_query.filter(Expense.expense_date >= from_date)

    if to_date is not None:
        expense_query = expense_query.filter(Expense.expense_date <= to_date)

    total_expenses = expense_query.count()

    expense_cost = (
        expense_query.with_entities(func.coalesce(func.sum(Expense.amount), 0)).scalar()
        or 0
    )

    # --------------------------------------------------
    # Trips
    # --------------------------------------------------

    trip_query = db.query(Trip).join(Car, Car.id == Trip.car_id)

    if current_user.role == CUSTOMER:
        trip_query = trip_query.filter(Car.owner_id == current_user.id)

    if from_date is not None:
        trip_query = trip_query.filter(
            Trip.start_datetime
            >= datetime.combine(
                from_date,
                time.min,
            )
        )

    if to_date is not None:
        trip_query = trip_query.filter(
            Trip.start_datetime
            <= datetime.combine(
                to_date,
                time.max,
            )
        )

    total_trips = trip_query.count()

    # --------------------------------------------------
    # Convert costs
    # --------------------------------------------------

    service_cost = float(service_cost)
    fuel_cost = float(fuel_cost)
    expense_cost = float(expense_cost)

    total_vehicle_cost = service_cost + fuel_cost + expense_cost

    # --------------------------------------------------
    # Response
    # --------------------------------------------------

    return {
        "summary": {
            "total_vehicles": int(total_vehicles),
            "total_services": int(total_services),
            "total_fuel_records": int(total_fuel_records),
            "total_expenses": int(total_expenses),
            "total_drivers": int(total_drivers),
            "total_trips": int(total_trips),
            "total_documents": int(total_documents),
            "service_cost": service_cost,
            "fuel_cost": fuel_cost,
            "expense_cost": expense_cost,
            "total_vehicle_cost": total_vehicle_cost,
        }
    }
