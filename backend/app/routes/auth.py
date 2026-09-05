from fastapi import APIRouter, Depends, HTTPException,status
from sqlalchemy.orm import Session
from datetime import timedelta
from backend.app.db.session import SessionLocal
from backend.app.schamas.user import UserOut, UserCreate
from backend.app.schamas.auth import TokenResponse, LoginRequest
from backend.app.models.user import Users
from backend.app.core.security import hash_password, verify_password, create_access_token
from backend.app.core.config import ACCESS_TOKEN_EXPIRE_MINUTES
from backend.app.db.session import get_db



router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/register", response_model = UserOut)
def register(user:UserCreate, db: Session =  Depends(get_db)):
    existing_email = (
    db.query(Users)
    .filter(Users.email == user.email)
    .first()
    )

    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already exists"
        )
    
    existing_phone = (
    db.query(Users)
    .filter(Users.phone == user.phone)
    .first()
    )

    if existing_phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone already exists"
        )
    
    
    new_user = Users(
        name = user.name,
        email = user.email,
        phone=user.phone,
        password_hash = hash_password(user.password),
        role="customer",
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user


@router.post("/login", response_model = TokenResponse)
def login(data:LoginRequest, db: Session = Depends(get_db)):
    user = db.query(Users).filter(Users.email == data.email).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Invalid credentials"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )
    token = create_access_token(
        data={"sub":str(user.id)},
        expires_delta=timedelta(
            minutes=ACCESS_TOKEN_EXPIRE_MINUTES
            ),
            )
    return {
        "access_token":token,
         "token_type": "bearer",
        }
