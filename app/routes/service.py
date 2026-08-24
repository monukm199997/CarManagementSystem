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


router = APIRouter(prefix="/services", tags=["Services"])


@router.post("/", response_model=ServiceOut)
def create_services(
    payload: ServiceCreate, db: Session = Depends(get_db), admin=Depends(require_roles("admin","manager","staff"))
):

    car = db.query(Car).filter(Car.id == payload.car_id).first()
    if not car:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Car not found"
        )

    service = Services(**payload.dict())

    db.add(service)
    db.commit()
    db.refresh(service)
    return service


@router.get("/car/{car_id}", response_model=List[ServiceOut])
def get_car_services(
    car_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)
):

    car = db.query(Car).filter(Car.id == car_id).first()
    if not car:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Car not found"
        )

    if current_user.role != "admin" and car.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized"
        )

    service_list = db.query(Services).filter(Services.car_id == car_id).all()
    return service_list


@router.put("/{service_id}", response_model=ServiceOut)
def update_services(
    service_id: int,
    payload: ServiceUpdate,
    db: Session = Depends(get_db),
    admin=Depends(require_roles("admin","manager","staff")),
):
    service = db.query(Services).filter(Services.id == service_id).first()
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Car service not found"
        )
    for key, value in payload.dict(exclude_unset=True).items():
        setattr(service, key, value)
    db.commit()
    db.refresh(service)
    return service


@router.delete("/{service_id}")
def delete_service(
    service_id: int, db: Session = Depends(get_db), admin=Depends(require_roles("admin","manager"))
):
    service = db.query(Services).filter(Services.id == service_id).first()
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Car service not found"
        )
    db.delete(service)
    db.commit()
    return {"details": "Deleted successfully"}


@router.get("/upcoming_services", response_model=list[ServiceOut])
def upcoming_services(
    days: int = Query(7, ge=1),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    today = date.today()
    future_date = today + timedelta(days=days)

    query = db.query(Services).join(Car)
    query = query.filter(
        Services.next_service_due != None,
        Services.next_service_due >= today,
        Services.next_service_due <= future_date
    )
    if current_user.role not in ["admin", "manager"]:
        query = query.filter(Car.owner_id == current_user.id)

    return query.all()
