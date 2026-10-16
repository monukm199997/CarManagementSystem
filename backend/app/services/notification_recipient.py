from sqlalchemy.orm import Session

from app.models.user import Users
from app.models.car import Car
from app.models.driver import Driver

from app.core.roles import (
    SUPER_ADMIN,
    ADMIN,
    MANAGER,
    STAFF,
    CUSTOMER,
)

MANAGEMENT_ROLES = {
    SUPER_ADMIN,
    ADMIN,
    MANAGER,
    STAFF,
}


VEHICLE_NOTIFICATION_TYPES = {
    "document_expiry",
    "insurance_expiry",
    "service_due",
}


def get_notification_recipients(
    db: Session,
    notification_type: str,
    car_id: int | None = None,
    driver_id: int | None = None,
):
    """
    Resolve active users who should receive automatic notifications.

    Vehicle notifications:
        Management users -> users in the vehicle's company
        CUSTOMER         -> own vehicle, if in the same company

    License notifications:
        Management users -> users in the driver's company
        CUSTOMER         -> none

    If the relevant vehicle/driver cannot be found or has no company,
    no recipients are returned.
    """

    # ---------------------------------------------------------
    # VEHICLE RELATED NOTIFICATIONS
    # ---------------------------------------------------------
    if notification_type in VEHICLE_NOTIFICATION_TYPES:

        # A vehicle-specific notification must have a valid car.
        if car_id is not None:
            car = db.query(Car).filter(Car.id == car_id).first()

            if not car or not car.company_id:
                return []

            users = (
                db.query(Users)
                .filter(
                    Users.is_active.is_(True),
                    Users.company_id == car.company_id,
                )
                .all()
            )

            recipients = []

            for user in users:
                if user.role in MANAGEMENT_ROLES:
                    recipients.append(user)
                elif user.role == CUSTOMER and car.owner_id == user.id:
                    recipients.append(user)

            return recipients

        # No specific vehicle: return management users only.
        # Do not mix users across companies.
        return (
            db.query(Users)
            .filter(
                Users.is_active.is_(True),
                Users.role.in_(MANAGEMENT_ROLES),
                Users.company_id.isnot(None),
            )
            .all()
        )

    # ---------------------------------------------------------
    # DRIVER LICENSE EXPIRY
    # ---------------------------------------------------------
    if notification_type == "license_expiry":

        if driver_id is None:
            # Without a specific driver, avoid sending a global
            # notification to all companies' users.
            return []

        driver = db.query(Driver).filter(Driver.id == driver_id).first()

        if not driver or not driver.company_id:
            return []

        return (
            db.query(Users)
            .filter(
                Users.is_active.is_(True),
                Users.company_id == driver.company_id,
                Users.role.in_(MANAGEMENT_ROLES),
            )
            .all()
        )

    # ---------------------------------------------------------
    # OTHER / SYSTEM NOTIFICATIONS
    # ---------------------------------------------------------
    return []
