from typing import List

from fastapi import APIRouter, Depends
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

from app.utils.helpers import (
    ensure_company_access,
    get_company_car_or_404,
    get_company_fuel_or_404,
)

router = APIRouter(prefix="/fuel", tags=["Fuel"])


MANAGEMENT_ROLES = {
    SUPER_ADMIN,
    ADMIN,
    MANAGER,
    STAFF,
}


# ==========================================
# CREATE FUEL RECORD
# ==========================================


@router.post("/", response_model=FuelOut)
def create_fuel(
    payload: FuelCreate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            SUPER_ADMIN,
            ADMIN,
            MANAGER,
            STAFF,
        )
    ),
):
    company_id = ensure_company_access(current_user)

    car = get_company_car_or_404(
        db,
        payload.car_id,
        company_id,
    )

    check_car_access(car, current_user)

    fuel_data = payload.model_dump()
    fuel_data["car_id"] = car.id

    fuel = Fuel(**fuel_data)

    db.add(fuel)
    db.commit()
    db.refresh(fuel)

    return fuel


# ==========================================
# GET ALL FUEL RECORDS
# ==========================================


@router.get("/", response_model=List[FuelOut])
def get_fuel_records(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    company_id = ensure_company_access(current_user)

    query = (
        db.query(Fuel)
        .join(Car, Car.id == Fuel.car_id)
        .filter(Car.company_id == company_id)
    )

    # Customers can only see their own vehicles.
    if current_user.role not in MANAGEMENT_ROLES:
        query = query.filter(Car.owner_id == current_user.id)

    return query.order_by(Fuel.fuel_date.desc()).all()


# ==========================================
# GET FUEL BY ID
# ==========================================


@router.get("/{fuel_id}", response_model=FuelOut)
def get_fuel(
    fuel_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    company_id = ensure_company_access(current_user)

    fuel = get_company_fuel_or_404(
        db,
        fuel_id,
        company_id,
    )

    car = get_company_car_or_404(
        db,
        fuel.car_id,
        company_id,
    )

    check_car_access(car, current_user)

    return fuel


# ==========================================
# GET FUEL HISTORY FOR CAR
# ==========================================


@router.get("/car/{car_id}", response_model=List[FuelOut])
def get_car_fuel(
    car_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    company_id = ensure_company_access(current_user)

    car = get_company_car_or_404(
        db,
        car_id,
        company_id,
    )

    check_car_access(car, current_user)

    return (
        db.query(Fuel)
        .filter(Fuel.car_id == car.id)
        .order_by(Fuel.fuel_date.desc())
        .all()
    )


# ==========================================
# UPDATE FUEL
# ==========================================


@router.put("/{fuel_id}", response_model=FuelOut)
def update_fuel(
    fuel_id: int,
    payload: FuelUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            SUPER_ADMIN,
            ADMIN,
            MANAGER,
            STAFF,
        )
    ),
):
    company_id = ensure_company_access(current_user)

    fuel = get_company_fuel_or_404(
        db,
        fuel_id,
        company_id,
    )

    current_car = get_company_car_or_404(
        db,
        fuel.car_id,
        company_id,
    )

    check_car_access(current_car, current_user)

    update_data = payload.model_dump(exclude_unset=True)

    # Validate a new vehicle if car_id is being changed.
    if "car_id" in update_data:
        new_car = get_company_car_or_404(
            db,
            update_data["car_id"],
            company_id,
        )

        check_car_access(new_car, current_user)

        update_data["car_id"] = new_car.id

    for key, value in update_data.items():
        setattr(fuel, key, value)

    db.commit()
    db.refresh(fuel)

    return fuel


# ==========================================
# DELETE FUEL
# ==========================================


@router.delete("/{fuel_id}")
def delete_fuel(
    fuel_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            SUPER_ADMIN,
            ADMIN,
            MANAGER,
        )
    ),
):
    company_id = ensure_company_access(current_user)

    fuel = get_company_fuel_or_404(
        db,
        fuel_id,
        company_id,
    )

    car = get_company_car_or_404(
        db,
        fuel.car_id,
        company_id,
    )

    check_car_access(car, current_user)

    db.delete(fuel)
    db.commit()

    return {"message": "Fuel record deleted successfully"}
