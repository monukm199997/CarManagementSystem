from datetime import date
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.dependencies.auth import get_current_user
from app.dependencies.role import require_roles
from app.dependencies.ownership import check_car_access

from app.models.car import Car
from app.models.fuel import Fuel

from app.schamas.fuel import (
    FuelCreate,
    FuelOut,
    FuelUpdate,
)

from app.core.roles import (
    SUPER_ADMIN,
    ADMIN,
    MANAGER,
    STAFF,
)


router = APIRouter(
    prefix="/fuel",
    tags=["Fuel"]
)


# ==========================================
# CREATE FUEL RECORD
# ==========================================

@router.post(
    "/",
    response_model=FuelOut
)
def create_fuel(
    payload: FuelCreate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            SUPER_ADMIN,
            ADMIN,
            MANAGER,
            STAFF
        )
    ),
):

    car = (
        db.query(Car)
        .filter(Car.id == payload.car_id)
        .first()
    )

    if not car:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Car not found"
        )


    check_car_access(
        car,
        current_user
    )


    fuel = Fuel(
        **payload.model_dump()
    )


    db.add(fuel)
    db.commit()
    db.refresh(fuel)


    return fuel


# ==========================================
# GET ALL FUEL RECORDS
# ==========================================

@router.get(
    "/",
    response_model=List[FuelOut]
)
def get_fuel_records(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):

    query = db.query(Fuel).join(
        Car,
        Car.id == Fuel.car_id
    )


    # Customers can only see their own
    # vehicle fuel records
    if current_user.role not in [
        SUPER_ADMIN,
        ADMIN,
        MANAGER,
        STAFF,
    ]:

        query = query.filter(
            Car.owner_id == current_user.id
        )


    return (
        query
        .order_by(
            Fuel.fuel_date.desc()
        )
        .all()
    )


# ==========================================
# GET FUEL BY ID
# ==========================================

@router.get(
    "/{fuel_id}",
    response_model=FuelOut
)
def get_fuel(
    fuel_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):

    fuel = (
        db.query(Fuel)
        .filter(Fuel.id == fuel_id)
        .first()
    )


    if not fuel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fuel record not found"
        )


    car = (
        db.query(Car)
        .filter(Car.id == fuel.car_id)
        .first()
    )


    if not car:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Car not found"
        )


    check_car_access(
        car,
        current_user
    )


    return fuel


# ==========================================
# GET FUEL HISTORY FOR CAR
# ==========================================

@router.get(
    "/car/{car_id}",
    response_model=List[FuelOut]
)
def get_car_fuel(
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
            detail="Car not found"
        )


    check_car_access(
        car,
        current_user
    )


    fuel_records = (
        db.query(Fuel)
        .filter(Fuel.car_id == car_id)
        .order_by(
            Fuel.fuel_date.desc()
        )
        .all()
    )


    return fuel_records


# ==========================================
# UPDATE FUEL
# ==========================================

@router.put(
    "/{fuel_id}",
    response_model=FuelOut
)
def update_fuel(
    fuel_id: int,
    payload: FuelUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            SUPER_ADMIN,
            ADMIN,
            MANAGER,
            STAFF
        )
    ),
):

    fuel = (
        db.query(Fuel)
        .filter(Fuel.id == fuel_id)
        .first()
    )


    if not fuel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fuel record not found"
        )


    car = (
        db.query(Car)
        .filter(Car.id == fuel.car_id)
        .first()
    )


    if not car:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Car not found"
        )


    check_car_access(
        car,
        current_user
    )


    update_data = payload.model_dump(
        exclude_unset=True
    )


    for key, value in update_data.items():
        setattr(
            fuel,
            key,
            value
        )


    db.commit()
    db.refresh(fuel)


    return fuel


# ==========================================
# DELETE FUEL
# ==========================================

@router.delete(
    "/{fuel_id}"
)
def delete_fuel(
    fuel_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            SUPER_ADMIN,
            ADMIN,
            MANAGER
        )
    ),
):

    fuel = (
        db.query(Fuel)
        .filter(Fuel.id == fuel_id)
        .first()
    )


    if not fuel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fuel record not found"
        )


    car = (
        db.query(Car)
        .filter(Car.id == fuel.car_id)
        .first()
    )


    if not car:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Car not found"
        )


    check_car_access(
        car,
        current_user
    )


    db.delete(fuel)
    db.commit()


    return {
        "message": "Fuel record deleted successfully"
    }