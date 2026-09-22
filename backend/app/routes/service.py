from fastapi import APIRouter, Depends, HTTPException, status, Query
from app.schamas.service import ServiceCreate, ServiceOut, ServiceUpdate
from app.models.service import Services
from app.models.car import Car
from app.models.service import Services
from app.db.session import get_db
from sqlalchemy.orm import Session
from app.dependencies.role import require_roles
from app.dependencies.auth import get_current_user
from typing import List
from datetime import date, timedelta
from app.core.roles import ADMIN, MANAGER, STAFF, SUPER_ADMIN
from app.dependencies.ownership import check_car_access


router = APIRouter(prefix="/services", tags=["Services"])

@router.get("/", response_model=List[ServiceOut])
def get_services(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    query = db.query(Services).join(Car)

    # Customer sirf apni cars ke services dekh sakta hai
    if current_user.role not in [SUPER_ADMIN, ADMIN, MANAGER, STAFF]:
        query = query.filter(Car.owner_id == current_user.id)

    return query.order_by(Services.service_date.desc()).all()

@router.post("/", response_model=ServiceOut)
def create_services(
    payload: ServiceCreate, 
    db: Session = Depends(get_db), 
    current_user=Depends(require_roles(SUPER_ADMIN, ADMIN, MANAGER, STAFF))
):

    car = db.query(Car).filter(Car.id == payload.car_id).first()
    if not car:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Car not found"
        )
    check_car_access(car, current_user)

    service = Services(**payload.dict())

    db.add(service)
    db.commit()
    db.refresh(service)
    return service

@router.get("/car/{car_id}", response_model=List[ServiceOut])
def get_car_services(
    car_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    car = (
        db.query(Car)
        .filter(Car.id == car_id)
        .first()
    )

    if not car:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Car not found",
        )

    # Check whether current user can access this car
    check_car_access(car, current_user)

    services = (
        db.query(Services)
        .filter(Services.car_id == car_id)
        .order_by(Services.service_date.desc())
        .all()
    )

    return services

@router.get("/upcoming_services", response_model=list[ServiceOut])
def upcoming_services(
    days: int = Query(7, ge=1, le=365),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    today = date.today()

    future_date = (
        today + timedelta(days=days)
    )

    query = (
        db.query(Services)
        .join(Car, Car.id == Services.car_id)
        .filter(
            Services.next_service_due.isnot(None),
            Services.next_service_due >= today,
            Services.next_service_due <= future_date,
        )
    )


    if current_user.role not in [
        SUPER_ADMIN,
        ADMIN,
        MANAGER,
    ]:
        query = query.filter(
            Car.owner_id == current_user.id
        )


    return (
        query
        .order_by(
            Services.next_service_due.asc()
        )
        .all()
    )

@router.get("/{service_id}", response_model=ServiceOut)
def get_service(
    service_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    service = (
        db.query(Services)
        .filter(Services.id == service_id)
        .first()
    )

    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Car service not found",
        )

    car = (
        db.query(Car)
        .filter(Car.id == service.car_id)
        .first()
    )

    if not car:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Car not found",
        )

    check_car_access(car, current_user)

    return service

@router.patch("/{service_id}/complete", response_model=ServiceOut)
def complete_service(
    service_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(SUPER_ADMIN, ADMIN, MANAGER, STAFF)
    ),
):
    service = (
        db.query(Services)
        .filter(Services.id == service_id)
        .first()
    )

    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Car service not found",
        )

    car = (
        db.query(Car)
        .filter(Car.id == service.car_id)
        .first()
    )

    if not car:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Car not found",
        )

    check_car_access(car, current_user)

    if service.status == "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Service is already completed",
        )

    if service.status == "cancelled":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cancelled service cannot be completed",
        )

    service.status = "completed"

    db.commit()
    db.refresh(service)

    return service

@router.patch("/{service_id}/cancel", response_model=ServiceOut)
def cancel_service(
    service_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(SUPER_ADMIN, ADMIN, MANAGER)
    ),
):
    service = (
        db.query(Services)
        .filter(Services.id == service_id)
        .first()
    )

    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Car service not found",
        )

    car = (
        db.query(Car)
        .filter(Car.id == service.car_id)
        .first()
    )

    if not car:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Car not found",
        )

    check_car_access(car, current_user)

    if service.status == "cancelled":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Service is already cancelled",
        )

    if service.status == "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Completed service cannot be cancelled",
        )

    service.status = "cancelled"

    db.commit()
    db.refresh(service)

    return service

@router.put("/{service_id}", response_model=ServiceOut)
def update_services(
    service_id: int,
    payload: ServiceUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(SUPER_ADMIN, ADMIN, MANAGER, STAFF)),
):
    service = db.query(Services).filter(Services.id == service_id).first()

    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Car service not found"
        )
    
    car = (db.query(Car).filter(Car.id == service.car_id).first())

    check_car_access(car, current_user)
    
    for key, value in payload.dict(exclude_unset=True).items():
        setattr(service, key, value)
    db.commit()
    db.refresh(service)
    return service

@router.delete("/{service_id}")
def delete_service(
    service_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(SUPER_ADMIN, ADMIN, MANAGER))
):
    service = db.query(Services).filter(Services.id == service_id).first()
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Car service not found"
        )
    db.delete(service)
    db.commit()
    return {"details": "Deleted successfully"}

