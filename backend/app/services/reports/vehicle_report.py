from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.car import Car
from app.models.user import Users
from app.models.service import Services
from app.models.fuel import Fuel
from app.models.expense import Expense
from app.models.trip import Trip


def get_vehicle_report(
    db: Session,
    car_id: int | None = None,
    status: str | None = None,
    page: int = 1,
    page_size: int = 50,
):
    query = db.query(
        Car,
        Users.name.label("owner_name"),
        Users.email.label("owner_email"),
        Users.phone.label("owner_phone"),
    ).join(Users, Users.id == Car.owner_id)

    if car_id is not None:
        query = query.filter(Car.id == car_id)

    if status:
        query = query.filter(Car.status == status)

    total_records = query.count()

    offset = (page - 1) * page_size

    rows = query.order_by(Car.id.desc()).offset(offset).limit(page_size).all()

    data = []

    for car, owner_name, owner_email, owner_phone in rows:

        total_services = (
            db.query(func.count(Services.id)).filter(Services.car_id == car.id).scalar()
            or 0
        )

        total_fuel_records = (
            db.query(func.count(Fuel.id)).filter(Fuel.car_id == car.id).scalar() or 0
        )

        total_expenses = (
            db.query(func.coalesce(func.sum(Expense.amount), 0))
            .filter(Expense.car_id == car.id)
            .scalar()
            or 0
        )

        total_trips = (
            db.query(func.count(Trip.id)).filter(Trip.car_id == car.id).scalar() or 0
        )

        data.append(
            {
                "id": car.id,
                "registration_number": car.registration_number,
                "brand": car.brand,
                "model": car.model,
                "fuel_type": car.fuel_type,
                "year": car.year,
                "color": car.color,
                "status": car.status,
                "owner_id": car.owner_id,
                "owner_name": owner_name,
                "owner_email": owner_email,
                "owner_phone": owner_phone,
                "total_services": total_services,
                "total_fuel_records": total_fuel_records,
                "total_expenses": float(total_expenses),
                "total_trips": total_trips,
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
