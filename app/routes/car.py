from fastapi import APIRouter, Depends, HTTPException, status,Query
from app.schamas.car import CarOut, CarCreate, CarUpdate
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.dependencies.auth import get_current_user
from app.dependencies.role import require_roles
from app.models.user import Users
from app.models.car import Car
from typing import List,Optional
from app.core.roles import ADMIN, MANAGER, STAFF
from app.dependencies.ownership import check_car_access

router = APIRouter(prefix="/cars", tags=["Cars"])


@router.post("/", response_model=CarOut)
def create_car(
    payload: CarCreate, 
    db: Session = Depends(get_db), 
    cureent_user=Depends(require_roles(ADMIN, MANAGER))
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

    car = Car(**payload.dict())

    db.add(car)
    db.commit()
    db.refresh(car)
    return car

@router.get("/", response_model=List[CarOut])
def list_car(
    db: Session = Depends(get_db), 
    current_user=Depends(get_current_user), 
    brand:Optional[str] = Query(None)
    ):

    car = db.query(Car)

    if current_user.role == "customer":
        query = query.filter(
            Car.owner_id == current_user.id
        )
    
    if brand:
        car = car.filter(Car.brand == brand)
    return car.all()

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
    current_user = Depends(require_roles(ADMIN, MANAGER))
    ):
    car = db.query(Car).filter(Car.id == car_id).first()
    if not car:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,detail="Car not found")
    
    for key, value in payload.dict(exclude_unset=True).items():
        setattr(car, key, value)
    db.commit()
    db.refresh(car)
    return car

@router.delete("/{car_id}")
def delete_car(
    car_id:int, 
    db:Session = Depends(get_db), 
    current_user = Depends(require_roles(ADMIN, MANAGER))
    ): 
    car = db.query(Car).filter(Car.id == car_id).first()
    if not car:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Car not found")
    car.status = "inactive"
    db.commit()
    return {"message": "Car deactivated"}
