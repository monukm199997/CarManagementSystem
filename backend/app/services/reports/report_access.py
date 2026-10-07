from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.car import Car
from app.core.roles import CUSTOMER


def validate_customer_car_access(
    db: Session,
    current_user,
    car_id: int | None,
):
    """
    If current user is a CUSTOMER and car_id is provided,
    verify that the vehicle belongs to that customer.

    Admin / Manager / Staff / Super Admin are not restricted.
    """

    if current_user.role != CUSTOMER:
        return

    if car_id is None:
        return

    car = (
        db.query(Car)
        .filter(Car.id == car_id)
        .first()
    )

    if not car:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found.",
        )

    if car.owner_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You do not have access to this vehicle.",
        )


def customer_vehicle_filter(
    query,
    current_user,
):
    """
    Restrict vehicle query to customer's own vehicles.

    This is used when car_id is NOT provided.
    """

    if current_user.role == CUSTOMER:
        query = query.filter(
            Car.owner_id == current_user.id
        )

    return query