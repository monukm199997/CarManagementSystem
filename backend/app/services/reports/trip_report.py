from sqlalchemy.orm import Session

from app.models.trip import Trip
from app.models.car import Car
from app.models.driver import Driver


def get_trip_report(
    db: Session,
    car_id: int | None = None,
    driver_id: int | None = None,
    status: str | None = None,
    page: int = 1,
    page_size: int = 50,
):
    query = (
        db.query(
            Trip,
            Car.registration_number,
            Car.brand,
            Car.model,
            Driver.name.label("driver_name"),
            Driver.phone.label("driver_phone"),
        )
        .join(
            Car,
            Car.id == Trip.car_id,
        )
        .join(
            Driver,
            Driver.id == Trip.driver_id,
        )
    )

    # -----------------------------
    # VEHICLE FILTER
    # -----------------------------
    if car_id is not None:
        query = query.filter(Trip.car_id == car_id)

    # -----------------------------
    # DRIVER FILTER
    # -----------------------------
    if driver_id is not None:
        query = query.filter(Trip.driver_id == driver_id)

    # -----------------------------
    # STATUS FILTER
    # -----------------------------
    if status:
        query = query.filter(Trip.status == status)

    # -----------------------------
    # TOTAL RECORDS
    # -----------------------------
    total_records = query.count()

    offset = (page - 1) * page_size

    rows = (
        query.order_by(
            Trip.start_datetime.desc(),
            Trip.id.desc(),
        )
        .offset(offset)
        .limit(page_size)
        .all()
    )

    data = []

    for (
        trip,
        registration_number,
        brand,
        model,
        driver_name,
        driver_phone,
    ) in rows:

        distance = None

        if trip.start_odometer is not None and trip.end_odometer is not None:
            distance = float(trip.end_odometer) - float(trip.start_odometer)

        data.append(
            {
                "id": trip.id,
                "car_id": trip.car_id,
                "registration_number": registration_number,
                "brand": brand,
                "model": model,
                "driver_id": trip.driver_id,
                "driver_name": driver_name,
                "driver_phone": driver_phone,
                "start_location": trip.start_location,
                "destination": trip.destination,
                "start_datetime": trip.start_datetime,
                "end_datetime": trip.end_datetime,
                "start_odometer": (
                    float(trip.start_odometer)
                    if trip.start_odometer is not None
                    else None
                ),
                "end_odometer": (
                    float(trip.end_odometer) if trip.end_odometer is not None else None
                ),
                "distance": distance,
                "purpose": trip.purpose,
                "status": trip.status,
                "notes": trip.notes,
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
