from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.car import Car
from app.core.roles import CUSTOMER


def get_report_company_id(current_user) -> int:
    """
    Validate the user's company before allowing report access.
    Return the authenticated user's company ID.
    """

    company_id = current_user.company_id

    if not company_id:
        raise HTTPException(
            status_code=403,
            detail="Your account is not assigned to a company.",
        )

    company = current_user.company

    if company is None or company.status != "active":
        raise HTTPException(
            status_code=403,
            detail="Your company is inactive or unavailable.",
        )

    return company_id


def validate_customer_car_access(
    db: Session,
    current_user,
    car_id: int | None,
):
    """
    Validate that a requested vehicle belongs to the user's company.
    Customers must additionally own the requested vehicle.
    """

    company_id = get_report_company_id(current_user)

    if car_id is None:
        return

    car = (
        db.query(Car)
        .filter(
            Car.id == car_id,
            Car.company_id == company_id,
        )
        .first()
    )

    if not car:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found.",
        )

    if current_user.role == CUSTOMER and car.owner_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You do not have access to this vehicle.",
        )


def company_vehicle_filter(
    query,
    current_user,
):
    """
    Restrict vehicle queries to the authenticated user's company.
    Customers are further restricted to their own vehicles.
    """

    company_id = get_report_company_id(current_user)

    query = query.filter(
        Car.company_id == company_id,
    )

    if current_user.role == CUSTOMER:
        query = query.filter(
            Car.owner_id == current_user.id,
        )

    return query


def customer_vehicle_filter(
    query,
    current_user,
):
    return company_vehicle_filter(query, current_user)
