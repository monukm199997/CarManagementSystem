from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from huggingface_hub import User
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.dependencies.auth import get_current_user
from app.models.notification import Notification
from app.models.user import Users
from app.schamas.notification import (
    NotificationCreate,
    NotificationOut,
    NotificationReadUpdate,
)

from app.services.document_expiry_alert import (
    generate_document_expiry_notifications,
)
from app.services.driver_license_expiry_alert import (
    generate_driver_license_expiry_notifications,
)
from app.services.service_due_alert import (
    generate_service_due_notifications,
)
from app.services.insurance_expiry_alert import (
    generate_insurance_expiry_notifications,
)
from app.core.roles import (
    ADMIN,
    CUSTOMER,
    MANAGER,
    STAFF,
    SUPER_ADMIN,
)

router = APIRouter(
    prefix="/notifications",
    tags=["Notifications"],
)


ALL_ROLES = (
    SUPER_ADMIN,
    ADMIN,
    MANAGER,
    STAFF,
    CUSTOMER,
)

CREATE_ROLES = (
    SUPER_ADMIN,
    ADMIN,
)


# ---------------------------------------------------------
# CREATE NOTIFICATION
# ---------------------------------------------------------


@router.post(
    "/",
    response_model=NotificationOut,
    status_code=status.HTTP_201_CREATED,
)
def create_notification(
    notification_data: NotificationCreate,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    if current_user.role not in CREATE_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to create notifications.",
        )

    user = db.query(Users).filter(Users.id == notification_data.user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    notification = Notification(
        user_id=notification_data.user_id,
        type=notification_data.type,
        title=notification_data.title,
        message=notification_data.message,
        priority=notification_data.priority,
        entity_type=notification_data.entity_type,
        entity_id=notification_data.entity_id,
    )

    db.add(notification)
    db.commit()
    db.refresh(notification)

    return notification


# ---------------------------------------------------------
# GET MY NOTIFICATIONS
# ---------------------------------------------------------


@router.get("/", response_model=list[NotificationOut])
def get_my_notifications(
    is_read: bool | None = Query(
        default=None,
        description="Filter by read/unread status",
    ),
    notification_type: str | None = Query(
        default=None,
        description="Filter by notification type",
    ),
    limit: int = Query(
        default=50,
        ge=1,
        le=100,
    ),
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    query = db.query(Notification).filter(Notification.user_id == current_user.id)

    if is_read is not None:
        query = query.filter(Notification.is_read == is_read)

    if notification_type:
        query = query.filter(Notification.type == notification_type)

    return (
        query.order_by(
            Notification.created_at.desc(),
            Notification.id.desc(),
        )
        .limit(limit)
        .all()
    )


# ---------------------------------------------------------
# UNREAD COUNT
# --------------------------------------------------------


@router.get("/unread-count")
def get_unread_notification_count(
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    unread_count = (
        db.query(Notification)
        .filter(
            Notification.user_id == current_user.id,
            Notification.is_read.is_(False),
        )
        .count()
    )

    return {"unread_count": unread_count}


# ---------------------------------------------------------
# GET SINGLE NOTIFICATION
# ---------------------------------------------------------


@router.get("/{notification_id}", response_model=NotificationOut)
def get_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    notification = (
        db.query(Notification)
        .filter(
            Notification.id == notification_id,
            Notification.user_id == current_user.id,
        )
        .first()
    )

    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found.",
        )

    return notification


# ---------------------------------------------------------
# MARK SINGLE NOTIFICATION READ / UNREAD
# ---------------------------------------------------------


@router.patch("/{notification_id}/read", response_model=NotificationOut)
def update_notification_read_status(
    notification_id: int,
    data: NotificationReadUpdate,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    notification = (
        db.query(Notification)
        .filter(
            Notification.id == notification_id,
            Notification.user_id == current_user.id,
        )
        .first()
    )

    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found.",
        )

    notification.is_read = data.is_read

    if data.is_read:
        notification.read_at = datetime.utcnow()
    else:
        notification.read_at = None

    db.commit()
    db.refresh(notification)

    return notification


# ---------------------------------------------------------
# MARK ALL AS READ
# ---------------------------------------------------------


@router.patch("/read-all")
def mark_all_notifications_as_read(
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    notifications = (
        db.query(Notification)
        .filter(
            Notification.user_id == current_user.id,
            Notification.is_read.is_(False),
        )
        .all()
    )

    now = datetime.utcnow()

    for notification in notifications:
        notification.is_read = True
        notification.read_at = now

    db.commit()

    return {
        "message": "All notifications marked as read.",
        "updated_count": len(notifications),
    }


# ---------------------------------------------------------
# DELETE NOTIFICATION
# ---------------------------------------------------------


@router.delete("/{notification_id}")
def delete_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    notification = (
        db.query(Notification)
        .filter(
            Notification.id == notification_id,
            Notification.user_id == current_user.id,
        )
        .first()
    )

    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found.",
        )

    db.delete(notification)
    db.commit()

    return {"message": "Notification deleted successfully."}


@router.post("/generate/document-expiry")
def generate_document_expiry_alerts(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if current_user.role not in CREATE_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "You do not have permission " "to generate document expiry alerts."
            ),
        )

    result = generate_document_expiry_notifications(db)

    return {
        "message": ("Document expiry notifications " "generated successfully."),
        **result,
    }


@router.post("/generate/license-expiry")
def generate_license_expiry_alerts(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if current_user.role not in CREATE_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=("You do not have permission " "to generate driver license alerts."),
        )

    result = generate_driver_license_expiry_notifications(db)

    return {
        "message": ("Driver license expiry notifications " "generated successfully."),
        **result,
    }


@router.post("/generate/service-due")
def generate_service_due_alerts(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if current_user.role not in CREATE_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=("You do not have permission " "to generate service due alerts."),
        )

    result = generate_service_due_notifications(db)

    return {
        "message": ("Service due notifications " "generated successfully."),
        **result,
    }


@router.post("/generate/insurance-expiry")
def generate_insurance_expiry_alerts(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if current_user.role not in CREATE_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "You do not have permission " "to generate insurance expiry alerts."
            ),
        )

    result = generate_insurance_expiry_notifications(db)

    return {
        "message": ("Insurance expiry notifications " "generated successfully."),
        **result,
    }

