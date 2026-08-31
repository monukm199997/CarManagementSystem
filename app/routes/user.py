from fastapi import APIRouter, Depends, HTTPException, status
from app.dependencies.auth import get_current_user
from app.schamas.user import UserOut, UserUpdate
from app.db.session import get_db
from sqlalchemy.orm import Session
from app.dependencies.role import require_roles
from app.models.user import Users

router = APIRouter(prefix="/user", tags=["Users"])

@router.get("/me")
def profile(user=Depends(get_current_user)):
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "phone": user.phone,
        "role": user.role,
    }

@router.get("/", response_model=list[UserOut])
def list_users(
    db: Session = Depends(get_db), 
    current_user=Depends(require_roles("admin"))
):
    user = db.query(Users).all()
    return user

@router.get("/{user_id}", response_model=UserOut)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("admin")),
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
    current_user=Depends(require_roles("admin")),
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

@router.delete("/{user_id}")
def delete_user(
    user_id: int, 
    db: Session = Depends(get_db), 
    current_user=Depends(require_roles("admin"))
):
    user = db.query(Users).filter(Users.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="User not found"
        )

    if user.id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="You cannot delete your own account",
        )
    
    db.delete(user)
    db.commit()
    return {"details": "delete successfully"}
