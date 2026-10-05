from datetime import date

from sqlalchemy.orm import Session

from app.models.notification import Notification
from app.services.notification_recipient import (
    get_notification_recipients,
)
from app.models.vehicle_document import VehicleDocument
from app.models.car import Car

EXPIRY_WARNING_DAYS = 30


def get_document_alert_level(expiry_date: date):
    """
    Determine notification priority based on
    vehicle document expiry date.
    """

    today = date.today()

    days_remaining = (expiry_date - today).days

    # Already expired
    if days_remaining < 0:
        return {
            "level": "expired",
            "priority": "critical",
            "days_remaining": days_remaining,
        }

    # Expiring within 7 days
    if days_remaining <= 7:
        return {
            "level": "urgent",
            "priority": "high",
            "days_remaining": days_remaining,
        }

    # Expiring within 30 days
    if days_remaining <= EXPIRY_WARNING_DAYS:
        return {
            "level": "warning",
            "priority": "medium",
            "days_remaining": days_remaining,
        }

    return None


def get_document_expiry_message(
    document,
    car,
    alert_info,
):
    """
    Generate notification title and message.
    """

    document_type = document.document_type or "Vehicle document"

    registration_number = car.registration_number if car else f"Car #{document.car_id}"

    days_remaining = alert_info["days_remaining"]

    level = alert_info["level"]

    # -----------------------------
    # EXPIRED
    # -----------------------------

    if level == "expired":

        title = f"{document_type} has expired"

        message = f"{document_type} for vehicle " f"{registration_number} has expired."

    # -----------------------------
    # URGENT
    # -----------------------------

    elif level == "urgent":

        if days_remaining == 0:

            remaining_text = "today"

        elif days_remaining == 1:

            remaining_text = "in 1 day"

        else:

            remaining_text = f"in {days_remaining} days"

        title = f"{document_type} expiring soon"

        message = (
            f"{document_type} for vehicle "
            f"{registration_number} will expire "
            f"{remaining_text}."
        )

    # -----------------------------
    # WARNING
    # -----------------------------

    else:

        title = f"{document_type} expiring soon"

        message = (
            f"{document_type} for vehicle "
            f"{registration_number} will expire "
            f"in {days_remaining} days."
        )

    return title, message


def notification_already_exists(
    db: Session,
    user_id: int,
    document_id: int,
    priority: str,
):
    """
    Prevent duplicate notifications for
    the same document, user and priority.
    """

    existing = (
        db.query(Notification)
        .filter(
            Notification.user_id == user_id,
            Notification.type == "document_expiry",
            Notification.entity_type == "vehicle_document",
            Notification.entity_id == document_id,
            Notification.priority == priority,
        )
        .first()
    )

    return existing is not None


def generate_document_expiry_notifications(
    db: Session,
):
    """
    Check active vehicle documents and create
    expiry notifications for eligible users.

    Recipients are resolved through the centralized
    notification recipient resolver.

    Preferences are checked before creating notifications.
    """

    documents = (
        db.query(VehicleDocument)
        .filter(
            VehicleDocument.status == "active",
            VehicleDocument.expiry_date.isnot(None),
        )
        .all()
    )

    created_count = 0

    for document in documents:

        document_type = (
            document.document_type.strip().lower() if document.document_type else ""
        )

        # Insurance has its own dedicated alert service.
        if document_type == "insurance":
            continue

        alert_info = get_document_alert_level(document.expiry_date)

        # More than 30 days remaining
        if not alert_info:
            continue

        # VehicleDocument has only car_id,
        # so explicitly load the car.
        car = db.query(Car).filter(Car.id == document.car_id).first()

        # Resolve users according to:
        # - role
        # - vehicle ownership
        recipients = get_notification_recipients(
            db=db,
            notification_type="document_expiry",
            car_id=document.car_id,
        )

        title, message = get_document_expiry_message(
            document,
            car,
            alert_info,
        )

        priority = alert_info["priority"]

        for user in recipients:

            # -------------------------------------------------
            # CHECK USER NOTIFICATION PREFERENCE
            # -------------------------------------------------

            preference = user.notification_preferences

            if preference and not preference.document_expiry:
                continue

            # -------------------------------------------------
            # DUPLICATE CHECK
            # -------------------------------------------------

            if notification_already_exists(
                db=db,
                user_id=user.id,
                document_id=document.id,
                priority=priority,
            ):
                continue

            notification = Notification(
                user_id=user.id,
                type="document_expiry",
                title=title,
                message=message,
                priority=priority,
                entity_type="vehicle_document",
                entity_id=document.id,
            )

            db.add(notification)

            created_count += 1

    db.commit()

    return {
        "created_count": created_count,
        "checked_documents": len(documents),
    }
