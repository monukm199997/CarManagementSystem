from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.dependencies.auth import get_current_user
from app.dependencies.role import require_roles
from app.db.session import get_db
from app.schamas.user import UserOut, UserUpdate, UserRoleUpdate
from app.models.user import Users
from app.core.roles import (
    ADMIN,
    ALLOWED_ROLES,
    SUPER_ADMIN,
    ADMIN_ROLES,
)

router = APIRouter(prefix="/user", tags=["Users"])


def ensure_admin_company(current_user: Users) -> int:
    """Return the admin's company ID; global super-admin is exempt."""
    if current_user.role == SUPER_ADMIN:
        return current_user.company_id

    company = current_user.company
    if not current_user.company_id or company is None or company.status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your company is inactive or unavailable.",
        )

    return current_user.company_id


def get_managed_user(
    db: Session,
    current_user: Users,
    user_id: int,
) -> Users:
    """Find a target user within the caller's allowed scope."""
    query = db.query(Users).filter(Users.id == user_id)

    if current_user.role != SUPER_ADMIN:
        company_id = ensure_admin_company(current_user)
        query = query.filter(Users.company_id == company_id)

    target = query.first()

    if not target:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    return target


def active_admin_count(db: Session, current_user: Users) -> int:
    """Count active administrators within the relevant scope."""
    query = db.query(Users).filter(
        Users.is_active.is_(True),
        Users.role.in_(ADMIN_ROLES),
    )

    if current_user.role != SUPER_ADMIN:
        company_id = ensure_admin_company(current_user)
        query = query.filter(Users.company_id == company_id)

    return query.count()


@router.get("/me", response_model=UserOut)
def profile(current_user: Users = Depends(get_current_user)):
    return current_user


@router.get("/users", response_model=list[UserOut])
def list_users(
    db: Session = Depends(get_db),
    current_user: Users = Depends(require_roles(ADMIN, SUPER_ADMIN)),
):
    query = db.query(Users)

    if current_user.role != SUPER_ADMIN:
        company_id = ensure_admin_company(current_user)
        query = query.filter(Users.company_id == company_id)

    return query.order_by(Users.id.desc()).all()


@router.patch("/users/{user_id}/role", response_model=UserOut)
def update_user_role(
    user_id: int,
    role_data: UserRoleUpdate,
    db: Session = Depends(get_db),
    current_user: Users = Depends(require_roles(ADMIN, SUPER_ADMIN)),
):
    target_user = get_managed_user(db, current_user, user_id)
    new_role = role_data.role.strip().lower()

    if new_role not in ALLOWED_ROLES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Invalid role. Allowed roles are: "
                "customer, staff, manager, admin, super_admin"
            ),
        )

    if target_user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot change your own role.",
        )

    if current_user.role == ADMIN:
        if target_user.role == SUPER_ADMIN or new_role == SUPER_ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "Only the Super Admin can modify or assign " "the Super Admin role."
                ),
            )

    # Do not remove the last active administrator in this scope.
    if (
        target_user.is_active
        and target_user.role in ADMIN_ROLES
        and new_role not in ADMIN_ROLES
        and active_admin_count(db, current_user) <= 1
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot remove the last active administrator.",
        )

    target_user.role = new_role

    db.commit()
    db.refresh(target_user)
    return target_user


@router.patch("/users/{user_id}/status", response_model=UserOut)
def update_user_status(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: Users = Depends(require_roles(ADMIN, SUPER_ADMIN)),
):
    target_user = get_managed_user(db, current_user, user_id)

    if target_user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot deactivate your own account.",
        )

    if target_user.role == SUPER_ADMIN and current_user.role != SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "Only the Super Admin can change a " "Super Admin account's status."
            ),
        )

    if (
        target_user.is_active
        and target_user.role in ADMIN_ROLES
        and active_admin_count(db, current_user) <= 1
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot deactivate the last active administrator.",
        )

    target_user.is_active = not target_user.is_active

    db.commit()
    db.refresh(target_user)
    return target_user


@router.get("/{user_id}", response_model=UserOut)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: Users = Depends(require_roles(ADMIN, SUPER_ADMIN)),
):
    return get_managed_user(db, current_user, user_id)


@router.put("/{user_id}")
def update_user(
    user_id: int,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: Users = Depends(require_roles(ADMIN, SUPER_ADMIN)),
):
    user = get_managed_user(db, current_user, user_id)

    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot update your own account through this endpoint.",
        )

    # Role, account status and tenant ownership have dedicated controls.
    data = payload.dict(exclude_unset=True)
    protected_fields = {"role", "is_active", "company_id"}
    attempted_fields = protected_fields.intersection(data)

    if attempted_fields:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Role, account status and company assignment "
                "cannot be changed through this endpoint."
            ),
        )

    for key, value in data.items():
        setattr(user, key, value)

    db.commit()
    db.refresh(user)

    return {
        "details": "update successfully",
        "user_data": user,
    }
