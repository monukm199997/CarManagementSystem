from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.dependencies.auth import get_current_user

from app.models.notification import Notification
from app.models.user import Users
from app.models.car import Car
from app.models.notification_preference import NotificationPreference

from app.schamas.notification import (
    NotificationCreate,
    NotificationOut,
    NotificationReadUpdate,
)

from app.schamas.notification_preference import (
    NotificationPreferenceUpdate,
    NotificationPreferenceOut,
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

from app.utils.helpers import ensure_company_access

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


# =====================================================
# COMPANY ACCESS HELPERS
# =====================================================


def get_company_user_or_404(
    db: Session,
    user_id: int,
    company_id: int,
):
    user = (
        db.query(Users)
        .filter(
            Users.id == user_id,
            Users.company_id == company_id,
        )
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    return user


def get_company_car_or_404(
    db: Session,
    car_id: int,
    company_id: int,
):
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
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Car not found.",
        )

    return car


def require_notification_creator(current_user: Users):
    if current_user.role not in CREATE_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to create notifications.",
        )


def require_global_notification_admin(current_user: Users):
    if current_user.role != SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only SUPER_ADMIN can manually trigger global notification generation.",
        )


# =====================================================
# CREATE NOTIFICATION
# =====================================================


@router.post("/", response_model=NotificationOut, status_code=status.HTTP_201_CREATED)
def create_notification(
    notification_data: NotificationCreate,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    require_notification_creator(current_user)

    company_id = ensure_company_access(
        db,
        current_user,
    )

    # Recipient must belong to the authenticated admin's company.
    user = get_company_user_or_404(
        db,
        notification_data.user_id,
        company_id,
    )

    notification = Notification(
        user_id=user.id,
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


# =====================================================
# GET MY NOTIFICATIONS
# =====================================================


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
    query = db.query(Notification).filter(
        Notification.user_id == current_user.id,
    )

    if is_read is not None:
        query = query.filter(
            Notification.is_read == is_read,
        )

    if notification_type:
        query = query.filter(
            Notification.type == notification_type,
        )

    return (
        query.order_by(
            Notification.created_at.desc(),
            Notification.id.desc(),
        )
        .limit(limit)
        .all()
    )

@router.get("/preferences", response_model=NotificationPreferenceOut)
def get_notification_preferences(
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    preference = (
        db.query(NotificationPreference)
        .filter(
            NotificationPreference.user_id == current_user.id,
        )
        .first()
    )

    if not preference:
        preference = NotificationPreference(
            user_id=current_user.id,
            document_expiry=True,
            insurance_expiry=True,
            service_due=True,
            license_expiry=True,
        )

        db.add(preference)
        db.commit()
        db.refresh(preference)

    return preference


# =====================================================
# UPDATE NOTIFICATION PREFERENCES
# =====================================================

@router.put("/preferences", response_model=NotificationPreferenceOut)
def update_notification_preferences(
    preference_data: NotificationPreferenceUpdate,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    preference = (
        db.query(NotificationPreference)
        .filter(
            NotificationPreference.user_id == current_user.id,
        )
        .first()
    )

    if not preference:
        preference = NotificationPreference(
            user_id=current_user.id,
        )
        db.add(preference)

    preference.document_expiry = preference_data.document_expiry
    preference.insurance_expiry = preference_data.insurance_expiry
    preference.service_due = preference_data.service_due
    preference.license_expiry = preference_data.license_expiry

    db.commit()
    db.refresh(preference)

    return preference


# =====================================================
# UNREAD COUNT
# =====================================================


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

    return {
        "unread_count": unread_count,
    }


# =====================================================
# GET SINGLE NOTIFICATION
# =====================================================


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


# =====================================================
# MARK SINGLE NOTIFICATION READ / UNREAD
# =====================================================


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
    notification.read_at = datetime.utcnow() if data.is_read else None

    db.commit()
    db.refresh(notification)

    return notification


# =====================================================
# MARK ALL NOTIFICATIONS AS READ
# =====================================================


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


# =====================================================
# DELETE NOTIFICATION
# =====================================================

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

    return {
        "message": "Notification deleted successfully.",
    }


# =====================================================
# GENERATE DOCUMENT EXPIRY NOTIFICATIONS
# =====================================================


@router.post("/generate/document-expiry")
def generate_document_expiry_alerts(
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    require_global_notification_admin(current_user)

    result = generate_document_expiry_notifications(db)

    return {
        "message": "Document expiry notifications generated successfully.",
        **result,
    }

# =====================================================
# GENERATE DRIVER LICENSE EXPIRY NOTIFICATIONS
# =====================================================

@router.post("/generate/license-expiry")
def generate_license_expiry_alerts(
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    require_global_notification_admin(current_user)

    result = generate_driver_license_expiry_notifications(db)

    return {
        "message": "Driver license expiry notifications generated successfully.",
        **result,
    }

# =====================================================
# GENERATE SERVICE DUE NOTIFICATIONS
# =====================================================

@router.post("/generate/service-due")
def generate_service_due_alerts(
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    require_global_notification_admin(current_user)

    result = generate_service_due_notifications(db)

    return {
        "message": "Service due notifications generated successfully.",
        **result,
    }

# =====================================================
# GENERATE INSURANCE EXPIRY NOTIFICATIONS
# =====================================================

@router.post("/generate/insurance-expiry")
def generate_insurance_expiry_alerts(
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    require_global_notification_admin(current_user)

    result = generate_insurance_expiry_notifications(db)

    return {
        "message": "Insurance expiry notifications generated successfully.",
        **result,
    }

# =====================================================
# TEST NOTIFICATION RECIPIENTS
# =====================================================

@router.get("/test-recipients/{notification_type}")
def test_notification_recipients(
    notification_type: str,
    car_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    # This is a diagnostic endpoint; do not expose the
    # recipient directory to ordinary users.
    require_notification_creator(current_user)

    company_id = ensure_company_access(
        db,
        current_user,
    )

    if car_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="car_id is required to test company-scoped recipients.",
        )

    get_company_car_or_404(
        db,
        car_id,
        company_id,
    )

    from app.services.notification_recipient import (
        get_notification_recipients,
    )

    recipients = get_notification_recipients(
        db=db,
        notification_type=notification_type,
        car_id=car_id,
    )

    # Defensive filter: even if the recipient helper returns
    # users from another company, never expose them here.
    recipients = [user for user in recipients if user.company_id == company_id]

    return {
        "notification_type": notification_type,
        "car_id": car_id,
        "recipients": [
            {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "role": user.role,
            }
            for user in recipients
        ],
    }

