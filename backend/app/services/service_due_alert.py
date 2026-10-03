from datetime import date

from sqlalchemy.orm import Session

from app.models.notification import Notification
from app.models.user import Users
from app.models.service import Services
from app.models.car import Car

SERVICE_WARNING_DAYS = 30


def get_service_alert_level(
    due_date: date,
):
    """
    Determine notification priority based on
    next service due date.
    """

    today = date.today()

    days_remaining = (due_date - today).days

    # Service is overdue
    if days_remaining < 0:
        return {
            "level": "overdue",
            "priority": "critical",
            "days_remaining": days_remaining,
        }

    # Service due within 7 days
    if days_remaining <= 7:
        return {
            "level": "urgent",
            "priority": "high",
            "days_remaining": days_remaining,
        }

    # Service due within 30 days
    if days_remaining <= SERVICE_WARNING_DAYS:
        return {
            "level": "warning",
            "priority": "medium",
            "days_remaining": days_remaining,
        }

    return None


def get_service_due_message(
    service: Services,
    car: Car | None,
    alert_info,
):
    """
    Generate notification title and message.
    """

    registration_number = car.registration_number if car else f"Car #{service.car_id}"

    service_type = service.service_type or "Vehicle service"

    days_remaining = alert_info["days_remaining"]

    level = alert_info["level"]

    # -----------------------------------------
    # OVERDUE
    # -----------------------------------------

    if level == "overdue":

        title = "Service overdue"

        overdue_days = abs(days_remaining)

        if overdue_days == 1:
            overdue_text = "1 day"
        else:
            overdue_text = f"{overdue_days} days"

        message = (
            f"{service_type} for vehicle "
            f"{registration_number} is overdue "
            f"by {overdue_text}."
        )

    # -----------------------------------------
    # URGENT
    # -----------------------------------------

    elif level == "urgent":

        if days_remaining == 0:

            remaining_text = "today"

        elif days_remaining == 1:

            remaining_text = "in 1 day"

        else:

            remaining_text = f"in {days_remaining} days"

        title = "Service due soon"

        message = (
            f"{service_type} for vehicle "
            f"{registration_number} is due "
            f"{remaining_text}."
        )

    # -----------------------------------------
    # WARNING
    # -----------------------------------------

    else:

        title = "Service due soon"

        message = (
            f"{service_type} for vehicle "
            f"{registration_number} is due "
            f"in {days_remaining} days."
        )

    return title, message


def notification_already_exists(
    db: Session,
    user_id: int,
    service_id: int,
    priority: str,
):
    """
    Prevent duplicate notifications for the
    same service, user and alert priority.
    """

    existing = (
        db.query(Notification)
        .filter(
            Notification.user_id == user_id,
            Notification.type == "service_due",
            Notification.entity_type == "service",
            Notification.entity_id == service_id,
            Notification.priority == priority,
        )
        .first()
    )

    return existing is not None


def generate_service_due_notifications(
    db: Session,
):
    
    services = (
        db.query(Services)
        .filter(
            Services.next_service_due.isnot(None),
        )
        .all()
    )

    users = db.query(Users).filter(Users.is_active.is_(True)).all()

    created_count = 0

    for service in services:

        alert_info = get_service_alert_level(service.next_service_due)

        # More than 30 days remaining
        if not alert_info:
            continue

        car = db.query(Car).filter(Car.id == service.car_id).first()

        title, message = get_service_due_message(
            service,
            car,
            alert_info,
        )

        priority = alert_info["priority"]

        for user in users:

            if notification_already_exists(
                db=db,
                user_id=user.id,
                service_id=service.id,
                priority=priority,
            ):
                continue

            notification = Notification(
                user_id=user.id,
                type="service_due",
                title=title,
                message=message,
                priority=priority,
                entity_type="service",
                entity_id=service.id,
            )

            db.add(notification)

            created_count += 1

    db.commit()

    return {
        "created_count": created_count,
        "checked_services": len(services),
    }
