from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.models.expenses import Expenses
from app.models.car import Car
from app.schamas.expenses import ExpenseCreate, ExpenseOut, ExpenseUpdate
from app.dependencies.role import require_roles
from app.dependencies.auth import get_current_user
from app.db.session import get_db
from typing import Optional
from app.core.roles import ADMIN, MANAGER, STAFF
from app.dependencies.ownership import check_car_access

router = APIRouter(prefix="/expenses", tags=["expenses"])

@router.post("/", response_model=ExpenseOut)
def create_expense(
    payload: ExpenseCreate, 
    db: Session = Depends(get_db), 
    current_user = Depends(require_roles(ADMIN, MANAGER, STAFF)) 
    ):
    car = db.query(Car).filter(Car.id == payload.car_id).first()

    check_car_access(car, current_user)

    if not car:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Car not found")
    expenses = Expenses(**payload.dict())
    db.add(expenses)
    db.commit()
    db.refresh(expenses)
    return expenses

@router.get("/", response_model=list[ExpenseOut])
def expenses_list(
    db: Session = Depends(get_db), 
    current_user=Depends(get_current_user), 
    expnses_type:Optional[str] = Query(None), 
    car_id:Optional[int] = Query(None)
    ):
    query = db.query(Expenses).join(Car)

    if current_user.role == "customer":
        query = query.filter(Car.owner_id == current_user.id) 
    if expnses_type:
        query = query.filter(Expenses.expense_type == expnses_type)
    if car_id:
        query = query.filter(Expenses.car_id == car_id)  
    return query.all()

@router.delete("/{expence_id}",)
def delete_expence(
expence_id: int,
db:Session = Depends(get_db), 
current_user = Depends(require_roles(ADMIN, MANAGER))
):
    expence = db.query(Expenses).filter(Expenses.id == expence_id).first()
    if not expence:
        raise HTTPException(
            status_code= status.HTTP_404_NOT_FOUND,
            detail= "Expences not found"
        )
    db.delete(expence)
    db.commit()
    return {"details": "Deleted successfully"}
    
    