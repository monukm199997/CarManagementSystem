from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.car import Car
from app.core.roles import CUSTOMER


def validate_customer_car_access(
    db: Session,
    current_user,
    car_id: int | None,
):
    if current_user.role != CUSTOMER:
        return

    if car_id is None:
        return

    car = db.query(Car).filter(Car.id == car_id).first()

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


def apply_customer_car_filter(
    query,
    current_user,
    car_model=Car,
):
    """
    Restrict report query to customer's own vehicles.
    """

    if current_user.role == CUSTOMER:
        query = query.filter(car_model.owner_id == current_user.id)

    return query
