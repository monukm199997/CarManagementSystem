from fastapi import APIRouter, Depends, HTTPException, status
from app.dependencies.auth import get_current_user
from app.schamas.user import UserOut, UserUpdate, UserRoleUpdate
from app.db.session import get_db
from sqlalchemy.orm import Session
from app.dependencies.role import require_roles
from app.models.user import Users
from app.core.roles import ADMIN, ALLOWED_ROLES, SUPER_ADMIN, ADMIN_ROLES

router = APIRouter(prefix="/user", tags=["Users"])


@router.get("/me", response_model=UserOut)
def profile(current_user: Users = Depends(get_current_user)):
    return current_user


@router.get("/users", response_model=list[UserOut])
def list_users(
    db: Session = Depends(get_db), current_user=Depends(require_roles(ADMIN, SUPER_ADMIN))
):
    user = db.query(Users).order_by(Users.id.desc()).all()
    return user


@router.patch("/users/{user_id}/role",response_model=UserOut)
def update_user_role(
    user_id: int,
    role_data: UserRoleUpdate,
    db: Session = Depends(get_db),
    current_user: Users = Depends(
        require_roles(ADMIN, SUPER_ADMIN)
    ),
):
    new_role = role_data.role.strip().lower()

    if new_role not in ALLOWED_ROLES:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Invalid role. Allowed roles are: "
                "customer, staff, manager, admin, super_admin"
            ),
        )

    target_user = (db.query(Users).filter(Users.id == user_id).first())

    if not target_user:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    if target_user.id == current_user.id:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot change your own role",
        )

    if current_user.role == ADMIN:

        if target_user.role == SUPER_ADMIN:

            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "Only the Super Admin can modify "
                    "a Super Admin account"
                ),
            )

        if new_role == SUPER_ADMIN:

            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "Only the Super Admin can assign "
                    "the Super Admin role"
                ),
            )

    if target_user.role in ADMIN_ROLES:

        if new_role not in ADMIN_ROLES:

            active_admin_count = (
                db.query(Users)
                .filter(
                    Users.is_active.is_(True),
                    Users.role.in_(ADMIN_ROLES),
                )
                .count()
            )


            if active_admin_count <= 1:

                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        "Cannot remove the last active "
                        "administrator"
                    ),
                )

    target_user.role = new_role

    db.commit()
    db.refresh(target_user)

    return target_user

@router.patch("/users/{user_id}/status", response_model=UserOut)
def update_user_status(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: Users = Depends(
        require_roles(ADMIN, SUPER_ADMIN)
    ),
):
    target_user = (db.query(Users).filter(Users.id == user_id).first())

    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    if target_user.id == current_user.id:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot deactivate your own account",
        )

    if (
        target_user.role == SUPER_ADMIN
        and current_user.role != SUPER_ADMIN
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "Only the Super Admin can deactivate "
                "a Super Admin account"
            ),
        )

    if (
        target_user.is_active
        and target_user.role in ADMIN_ROLES
    ):

        active_admin_count = (db.query(Users).filter(Users.is_active.is_(True), Users.role.in_(ADMIN_ROLES),).count())

        if active_admin_count <= 1:

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Cannot deactivate the last active "
                    "administrator"
                ),
            )


    target_user.is_active = ( not target_user.is_active )

    db.commit()
    db.refresh(target_user)

    return target_user

@router.get("/{user_id}", response_model=UserOut)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(ADMIN, SUPER_ADMIN)),
):
    user = db.query(Users).filter(Users.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="User not found"
        )
    return user


@router.put("/{user_id}")
def update_user(
    user_id: int,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(ADMIN, SUPER_ADMIN)),
):
    user = db.query(Users).filter(Users.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="User not found"
        )
    for key, value in payload.dict(exclude_unset=True).items():
        setattr(user, key, value)

    # OR
    #     user.name = payload.name
    #     user.phone = payload.phone
    #     user.is_active = payload.is_active

    db.commit()
    db.refresh(user)
    return {"details": "update successfully", "user_data": user}

