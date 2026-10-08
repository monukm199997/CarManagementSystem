from sqlalchemy.orm import Session

from app.models.fuel import Fuel
from app.models.car import Car
from app.core.roles import CUSTOMER
from app.services.reports.report_access import (
    validate_customer_car_access,
)


def get_fuel_report(
    db: Session,
    current_user,
    car_id: int | None = None,
    fuel_type: str | None = None,
    page: int = 1,
    page_size: int = 50,
):

    validate_customer_car_access(
        db=db,
        current_user=current_user,
        car_id=car_id,
    )
    
    query = db.query(
        Fuel,
        Car.registration_number,
        Car.brand,
        Car.model,
    ).join(Car, Car.id == Fuel.car_id)

    if current_user.role == CUSTOMER:
        query = query.filter(Car.owner_id == current_user.id)

    # Vehicle filter
    if car_id is not None:
        query = query.filter(Fuel.car_id == car_id)

    # Fuel type filter
    if fuel_type:
        query = query.filter(Fuel.fuel_type == fuel_type)

    total_records = query.count()

    offset = (page - 1) * page_size

    rows = (
        query.order_by(Fuel.fuel_date.desc(), Fuel.id.desc())
        .offset(offset)
        .limit(page_size)
        .all()
    )

    data = []

    for fuel, registration_number, brand, model in rows:

        data.append(
            {
                "id": fuel.id,
                "car_id": fuel.car_id,
                "registration_number": registration_number,
                "brand": brand,
                "model": model,
                "fuel_date": fuel.fuel_date,
                "odometer_reading": fuel.odometer_reading,
                "fuel_type": fuel.fuel_type,
                "litres": float(fuel.litres or 0),
                "price_per_litre": float(fuel.price_per_litre or 0),
                "total_cost": float(fuel.total_cost or 0),
                "fuel_station": fuel.fuel_station,
                "notes": fuel.notes,
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
