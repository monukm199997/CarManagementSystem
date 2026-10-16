from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta
from app.db.session import SessionLocal
from app.schamas.user import UserOut, UserCreate
from app.schamas.auth import TokenResponse, LoginRequest
from app.models.user import Users
from app.core.security import hash_password, verify_password, create_access_token
from app.core.config import ACCESS_TOKEN_EXPIRE_MINUTES
from app.db.session import get_db
from app.models.company import Company
from app.schamas.user import CompanyRegister
from app.core.roles import ADMIN

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", response_model=UserOut)
def register(user: UserCreate, db: Session = Depends(get_db)):
    existing_email = db.query(Users).filter(Users.email == user.email).first()

    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Email already exists"
        )

    existing_phone = db.query(Users).filter(Users.phone == user.phone).first()

    if existing_phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Phone already exists"
        )

    new_user = Users(
        name=user.name,
        email=user.email,
        phone=user.phone,
        password_hash=hash_password(user.password),
        role="customer",
        is_active=True,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(Users).filter(Users.email == data.email).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )
    token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return {
        "access_token": token,
        "token_type": "bearer",
    }


@router.post("/register-company")
def register_company(
    payload: CompanyRegister,
    db: Session = Depends(get_db),
):
    email = payload.email.lower().strip()
    phone = payload.phone.strip()

    existing_user = (
        db.query(Users).filter((Users.email == email) | (Users.phone == phone)).first()
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email or phone already exists",
        )

    company = Company(
        name=payload.company_name.strip(),
        status="active",
    )

    try:
        db.add(company)
        db.flush()

        admin_user = Users(
            name=payload.name.strip(),
            email=email,
            phone=phone,
            password_hash=hash_password(payload.password),
            role=ADMIN,
            is_active=True,
            company_id=company.id,
        )

        db.add(admin_user)
        db.commit()
        db.refresh(company)
        db.refresh(admin_user)

        return {
            "message": "Company registered successfully",
            "company": {
                "id": company.id,
                "name": company.name,
            },
            "user": {
                "id": admin_user.id,
                "name": admin_user.name,
                "email": admin_user.email,
                "role": admin_user.role,
                "company_id": admin_user.company_id,
            },
        }

    except Exception:
        db.rollback()
        raise
