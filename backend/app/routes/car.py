from fastapi import APIRouter, Depends, HTTPException, status,Query
from app.schamas.car import CarOut, CarCreate, CarUpdate
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.dependencies.auth import get_current_user
from app.dependencies.role import require_roles
from app.models.user import Users
from app.models.car import Car
from typing import List,Optional
from app.core.roles import ADMIN, MANAGER, STAFF, SUPER_ADMIN
from app.dependencies.ownership import check_car_access

router = APIRouter(prefix="/cars", tags=["Cars"])


@router.post("/", response_model=CarOut)
def create_car(
    payload: CarCreate, 
    db: Session = Depends(get_db), 
    cureent_user=Depends(require_roles(SUPER_ADMIN,ADMIN, MANAGER))
):
    owner = db.query(Users).filter(Users.id == payload.owner_id).first()
    if not owner:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Owner not found"
        )

    regis_no = (
        db.query(Car)
        .filter(Car.registration_number == payload.registration_number)
        .first()
    )
    if regis_no:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Registration number already exist",
        )
    data = payload.dict()

    data["registration_number"] = (data["registration_number"].strip().upper())
    data["brand"] = (data["brand"].strip().title())
    data["model"] = (data["model"].strip().title())
    data["fuel_type"] = (data["fuel_type"].strip().title())
    if data.get("color"):
        data["color"] = (data["color"].strip().title())

    car = Car(**data)

    db.add(car)
    db.commit()
    db.refresh(car)
    return car

@router.get("/", response_model=List[CarOut])
def list_car(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),

    search: Optional[str] = Query(
        None,
        description="Search by registration number, brand or model",
    ),

    brand: Optional[str] = Query(
        None,
        description="Filter by brand",
    ),

    fuel_type: Optional[str] = Query(
        None,
        description="Filter by fuel type",
    ),

    status_filter: Optional[str] = Query(
        None,
        alias="status",
        description="Filter by active/inactive status",
    ),

    page: int = Query(
        1,
        ge=1,
        description="Page number",
    ),

    limit: int = Query(
        10,
        ge=1,
        le=100,
        description="Number of cars per page",
    ),
):
    car_query = db.query(Car)

    if current_user.role == "customer":
        car_query = car_query.filter(
            Car.owner_id == current_user.id
        )

    if search:
        search_term = f"%{search.strip()}%"

        car_query = car_query.filter(
            (
                Car.registration_number.ilike(search_term)
                | Car.brand.ilike(search_term)
                | Car.model.ilike(search_term)
            )
        )

    if brand:
        car_query = car_query.filter(
            Car.brand == brand
        )

    if fuel_type:
        car_query = car_query.filter(
            Car.fuel_type == fuel_type
        )

    if status_filter:
        status_value = status_filter.strip().lower()

        if status_value not in {
            "active",
            "inactive",
        }:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Status must be active or inactive",
            )

        car_query = car_query.filter(
            Car.status == status_value
        )

    offset = (page - 1) * limit

    return (
        car_query
        .order_by(Car.id.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

@router.get("/owners")
def get_car_owners(
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            ADMIN,
            SUPER_ADMIN,
            MANAGER,
        )
    ),
):
    owners = (
        db.query(Users)
        .filter(
            Users.is_active.is_(True)
        )
        .order_by(Users.name.asc())
        .all()
    )

    return [
        {
            "id": user.id,
            "name": user.name,
        }
        for user in owners
    ]

@router.get("/{car_id}", response_model=CarOut)
def get_car(
    car_id:int, 
    db:Session = Depends(get_db), 
    current_user=Depends(get_current_user)
    ):

    car = db.query(Car).filter(Car.id == car_id).first()
    if not car:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Car not found")
    
    check_car_access(car, current_user)
    return car

@router.put("/{car_id}", response_model=CarOut)
def upadate_car(
    car_id:int, 
    payload: CarUpdate, 
    db:Session = Depends(get_db), 
    current_user = Depends(require_roles(SUPER_ADMIN, ADMIN, MANAGER))
    ):
    car = db.query(Car).filter(Car.id == car_id).first()
    if not car:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,detail="Car not found")

    update_data = payload.dict(
    exclude_unset=True
    )

    if "brand" in update_data:
        update_data["brand"] = (
            update_data["brand"]
            .strip()
            .title()
        )

    if "model" in update_data:
        update_data["model"] = (
            update_data["model"]
            .strip()
            .title()
        )

    if "fuel_type" in update_data:
        update_data["fuel_type"] = (
            update_data["fuel_type"]
            .strip()
            .title()
        )

    if "color" in update_data and update_data["color"]:
        update_data["color"] = (
            update_data["color"]
            .strip()
            .title()
        )

    if "status" in update_data:
        update_data["status"] = (
            update_data["status"]
            .strip()
            .lower()
        )

        if update_data["status"] not in {
            "active",
            "inactive",
        }:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Status must be either active or inactive",
            )

    for key, value in payload.dict(exclude_unset=True).items():
        setattr(car, key, value)
    db.commit()
    db.refresh(car)
    return car

@router.delete("/{car_id}")
def delete_car(
    car_id:int, 
    db:Session = Depends(get_db), 
    current_user = Depends(require_roles(SUPER_ADMIN, ADMIN, MANAGER))
    ): 
    car = db.query(Car).filter(Car.id == car_id).first()
    if not car:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Car not found")
    car.status = "inactive"
    db.commit()
    return {"message": "Car deactivated"}


@router.patch("/{car_id}/activate", response_model=CarOut)
def activate_car(
    car_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            ADMIN,
            SUPER_ADMIN,
            MANAGER,
        )
    ),
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

    car.status = "active"

    db.commit()
    db.refresh(car)

    return car