from datetime import date

from sqlalchemy.orm import Session

from app.models.notification import Notification
from app.models.user import Users
from app.models.driver import Driver

LICENSE_WARNING_DAYS = 30


def get_license_alert_level(expiry_date: date):
    """
    Determine notification priority based on
    driver license expiry date.
    """

    today = date.today()

    days_remaining = (expiry_date - today).days

    # License already expired
    if days_remaining < 0:
        return {
            "level": "expired",
            "priority": "critical",
            "days_remaining": days_remaining,
        }

    # License expires within 7 days
    if days_remaining <= 7:
        return {
            "level": "urgent",
            "priority": "high",
            "days_remaining": days_remaining,
        }

    # License expires within 30 days
    if days_remaining <= LICENSE_WARNING_DAYS:
        return {
            "level": "warning",
            "priority": "medium",
            "days_remaining": days_remaining,
        }

    return None


def get_license_expiry_message(
    driver: Driver,
    alert_info,
):
    """
    Generate notification title and message.
    """

    driver_name = driver.name

    days_remaining = alert_info["days_remaining"]

    level = alert_info["level"]

    # -----------------------------------------
    # EXPIRED
    # -----------------------------------------

    if level == "expired":

        title = "Driver license has expired"

        message = f"Driver license of {driver_name} " f"has expired."

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

        title = "Driver license expiring soon"

        message = f"Driver license of {driver_name} " f"will expire {remaining_text}."

    # -----------------------------------------
    # WARNING
    # -----------------------------------------

    else:

        title = "Driver license expiring soon"

        message = (
            f"Driver license of {driver_name} "
            f"will expire in "
            f"{days_remaining} days."
        )

    return title, message


def notification_already_exists(
    db: Session,
    user_id: int,
    driver_id: int,
    priority: str,
):
    """
    Prevent duplicate notifications for the
    same driver, user and priority.
    """

    existing = (
        db.query(Notification)
        .filter(
            Notification.user_id == user_id,
            Notification.type == "license_expiry",
            Notification.entity_type == "driver",
            Notification.entity_id == driver_id,
            Notification.priority == priority,
        )
        .first()
    )

    return existing is not None


def generate_driver_license_expiry_notifications(
    db: Session,
):
    """
    Check active drivers and create license
    expiry notifications for active users.
    """

    drivers = (
        db.query(Driver)
        .filter(
            Driver.status == "active",
            Driver.license_expiry_date.isnot(None),
        )
        .all()
    )

    users = db.query(Users).filter(Users.is_active.is_(True)).all()

    created_count = 0

    for driver in drivers:

        alert_info = get_license_alert_level(driver.license_expiry_date)

        # More than 30 days remaining
        if not alert_info:
            continue

        title, message = get_license_expiry_message(
            driver,
            alert_info,
        )

        priority = alert_info["priority"]

        for user in users:

            if notification_already_exists(
                db=db,
                user_id=user.id,
                driver_id=driver.id,
                priority=priority,
            ):
                continue

            notification = Notification(
                user_id=user.id,
                type="license_expiry",
                title=title,
                message=message,
                priority=priority,
                entity_type="driver",
                entity_id=driver.id,
            )

            db.add(notification)

            created_count += 1

    db.commit()

    return {
        "created_count": created_count,
        "checked_drivers": len(drivers),
    }
