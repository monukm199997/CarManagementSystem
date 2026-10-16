from datetime import date

from sqlalchemy.orm import Session

from app.models.notification import Notification
from app.services.notification_recipient import (
    get_notification_recipients,
)
from app.models.vehicle_document import VehicleDocument
from app.models.car import Car


INSURANCE_WARNING_DAYS = 30


def get_insurance_alert_level(expiry_date: date):
    """Determine notification priority based on insurance expiry."""

    today = date.today()
    days_remaining = (expiry_date - today).days

    if days_remaining < 0:
        return {
            "level": "expired",
            "priority": "critical",
            "days_remaining": days_remaining,
        }

    if days_remaining <= 7:
        return {
            "level": "urgent",
            "priority": "high",
            "days_remaining": days_remaining,
        }

    if days_remaining <= INSURANCE_WARNING_DAYS:
        return {
            "level": "warning",
            "priority": "medium",
            "days_remaining": days_remaining,
        }

    return None


def get_insurance_message(document, car, alert_info):
    """Generate insurance notification title and message."""

    registration_number = (
        car.registration_number
        if car
        else f"Car #{document.car_id}"
    )

    days_remaining = alert_info["days_remaining"]
    level = alert_info["level"]

    if level == "expired":
        title = "Insurance has expired"
        message = (
            f"Insurance for vehicle {registration_number} has expired."
        )

    elif level == "urgent":
        if days_remaining == 0:
            remaining_text = "today"
        elif days_remaining == 1:
            remaining_text = "in 1 day"
        else:
            remaining_text = f"in {days_remaining} days"

        title = "Insurance expiring soon"
        message = (
            f"Insurance for vehicle {registration_number} "
            f"will expire {remaining_text}."
        )

    else:
        title = "Insurance expiring soon"
        message = (
            f"Insurance for vehicle {registration_number} "
            f"will expire in {days_remaining} days."
        )

    return title, message


def notification_already_exists(
    db: Session,
    user_id: int,
    document_id: int,
    priority: str,
):
    """Prevent duplicate insurance notifications."""

    existing = (
        db.query(Notification)
        .filter(
            Notification.user_id == user_id,
            Notification.type == "insurance_expiry",
            Notification.entity_type == "vehicle_document",
            Notification.entity_id == document_id,
            Notification.priority == priority,
        )
        .first()
    )

    return existing is not None


def generate_insurance_expiry_notifications(db: Session):
    """
    Generate notifications for active insurance documents.
    Recipients must belong to the associated vehicle's company.
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
    checked_documents = 0

    for document in documents:
        document_type = (
            document.document_type.strip().lower()
            if document.document_type
            else ""
        )

        if document_type != "insurance":
            continue

        checked_documents += 1

        alert_info = get_insurance_alert_level(
            document.expiry_date
        )

        if not alert_info:
            continue

        # Only process vehicles assigned to a company.
        car = (
            db.query(Car)
            .filter(
                Car.id == document.car_id,
                Car.company_id.isnot(None),
            )
            .first()
        )

        if not car:
            continue

        title, message = get_insurance_message(
            document,
            car,
            alert_info,
        )

        priority = alert_info["priority"]

        recipients = get_notification_recipients(
            db=db,
            notification_type="insurance_expiry",
            car_id=car.id,
        )

        for user in recipients:
            # Defensive company-isolation check.
            if user.company_id != car.company_id:
                continue

            preference = user.notification_preferences

            if preference and not preference.insurance_expiry:
                continue

            if notification_already_exists(
                db=db,
                user_id=user.id,
                document_id=document.id,
                priority=priority,
            ):
                continue

            notification = Notification(
                user_id=user.id,
                type="insurance_expiry",
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
        "checked_documents": checked_documents,
    }
