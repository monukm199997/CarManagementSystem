from sqlalchemy.orm import Session

from app.models.user import Users
from app.models.car import Car

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
):
    """
    Resolve users who should receive an automatic notification.

    Vehicle notifications:
        SUPER_ADMIN -> all vehicles
        ADMIN       -> all vehicles
        MANAGER     -> all vehicles
        STAFF       -> all vehicles
        CUSTOMER    -> only own vehicle

    License notifications:
        SUPER_ADMIN -> all drivers
        ADMIN       -> all drivers
        MANAGER     -> all drivers
        STAFF       -> all drivers
        CUSTOMER    -> none

    System notifications:
        No automatic recipients.
    """

    users = (
        db.query(Users)
        .filter(Users.is_active.is_(True))
        .all()
    )

    # ---------------------------------------------------------
    # VEHICLE RELATED NOTIFICATIONS
    # ---------------------------------------------------------
    if notification_type in VEHICLE_NOTIFICATION_TYPES:

        # If there is no specific car, only management users
        # should receive the notification.
        if car_id is None:
            return [
                user
                for user in users
                if user.role in MANAGEMENT_ROLES
            ]

        car = (
            db.query(Car)
            .filter(Car.id == car_id)
            .first()
        )

        if not car:
            return []

        recipients = []

        for user in users:

            # Management roles can see all vehicles.
            if user.role in MANAGEMENT_ROLES:
                recipients.append(user)
                continue

            # Customer can see only their own vehicle.
            if (
                user.role == CUSTOMER
                and car.owner_id == user.id
            ):
                recipients.append(user)

        return recipients

    # ---------------------------------------------------------
    # DRIVER LICENSE EXPIRY
    # ---------------------------------------------------------
    if notification_type == "license_expiry":

        return [
            user
            for user in users
            if user.role in MANAGEMENT_ROLES
        ]

    # ---------------------------------------------------------
    # OTHER / SYSTEM NOTIFICATIONS
    # ---------------------------------------------------------
    return []