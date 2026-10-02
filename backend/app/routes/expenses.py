from datetime import date
from sqlalchemy import func, or_
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
)

from sqlalchemy.orm import Session, selectinload
from app.db.session import get_db
from app.dependencies.auth import get_current_user
from app.dependencies.role import require_roles
from app.models.user import Users
from app.models.car import Car
from app.models.expense import Expense
from app.core.roles import SUPER_ADMIN, ADMIN, MANAGER, STAFF
from app.models.driver import Driver
from app.models.trip import Trip
from app.models.driver_vehicle_assignment import DriverVehicleAssignment
from app.schamas.expense import (
    ExpenseCreate,
    ExpenseUpdate,
    ExpenseOut,
    ExpenseHistoryItem,
    CarExpenseHistoryOut,
    ExpenseAnalyticsOut,
    ExpenseCategorySummary,
    ExpenseCarSummary,
    ExpenseMonthlySummary,
    ExpensePaymentSummary,
    MonthlyExpenseSummaryOut,
    MonthlyExpenseSummaryItem,
    MonthlyExpenseCategorySummary,
    ExpenseCategory,
    EXPENSE_CATEGORIES,
)
from app.utils.helpers import get_car_or_404, get_expense_or_404, validate_expense_links

router = APIRouter(prefix="/expenses", tags=["Expenses"])

# =========================================
# CREATE EXPENSE
# =========================================


@router.post("/", response_model=ExpenseOut, status_code=201)
def create_expense(
    expense_data: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(SUPER_ADMIN, ADMIN, MANAGER, STAFF)),
):

    # Check car exists
    get_car_or_404(db, expense_data.car_id)

    # Validate driver/trip relationships
    validate_expense_links(
        db=db,
        car_id=expense_data.car_id,
        expense_date=expense_data.expense_date,
        driver_id=expense_data.driver_id,
        trip_id=expense_data.trip_id,
    )

    # Extra amount validation
    if expense_data.amount <= 0:
        raise HTTPException(
            status_code=400, detail="Expense amount must be greater than 0"
        )

    # Create expense
    expense = Expense(
        car_id=expense_data.car_id,
        driver_id=expense_data.driver_id,
        trip_id=expense_data.trip_id,
        expense_date=expense_data.expense_date,
        category=expense_data.category,
        amount=expense_data.amount,
        description=expense_data.description,
        vendor=expense_data.vendor,
        payment_method=expense_data.payment_method,
        receipt_number=expense_data.receipt_number,
        notes=expense_data.notes,
    )

    db.add(expense)
    db.commit()
    db.refresh(expense)

    return expense


# =========================================
# GET ALL EXPENSES
# =========================================


@router.get("/", response_model=list[ExpenseOut])
def get_expenses(
    car_id: int | None = Query(default=None),
    driver_id: int | None = Query(default=None),
    trip_id: int | None = Query(default=None),
    category: str | None = Query(default=None),
    from_date: date | None = Query(default=None),
    to_date: date | None = Query(default=None),
    include_inactive: bool = Query(default=False),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):

    query = db.query(Expense)

    if not include_inactive:

        query = query.filter(Expense.status == "active")

    if car_id is not None:
        query = query.filter(Expense.car_id == car_id)

    if driver_id is not None:
        query = query.filter(Expense.driver_id == driver_id)

    if trip_id is not None:
        query = query.filter(Expense.trip_id == trip_id)

    if category:
        query = query.filter(Expense.category == category)

    if from_date:
        query = query.filter(Expense.expense_date >= from_date)

    if to_date:
        query = query.filter(Expense.expense_date <= to_date)

    if from_date and to_date and to_date < from_date:
        raise HTTPException(
            status_code=400, detail="To date cannot be earlier than from date"
        )

    return query.order_by(Expense.expense_date.desc(), Expense.id.desc()).all()


@router.get("/driver/{driver_id}/history", response_model=list[ExpenseHistoryItem])
def get_driver_expense_history(
    driver_id: int,
    from_date: date | None = Query(default=None),
    to_date: date | None = Query(default=None),
    include_inactive: bool = Query(default=False),
    db: Session = Depends(get_db),
):
    driver = db.query(Driver).filter(Driver.id == driver_id).first()

    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found.")

    query = db.query(Expense).filter(Expense.driver_id == driver_id)

    if not include_inactive:
        query = query.filter(Expense.status == "active")

    if from_date:
        query = query.filter(Expense.expense_date >= from_date)

    if to_date:
        query = query.filter(Expense.expense_date <= to_date)

    expenses = query.order_by(Expense.expense_date.desc()).all()

    return expenses


@router.get("/trip/{trip_id}/history", response_model=list[ExpenseHistoryItem])
def get_trip_expense_history(
    trip_id: int,
    include_inactive: bool = Query(default=False),
    db: Session = Depends(get_db),
):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()

    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found.")

    query = db.query(Expense).filter(Expense.trip_id == trip_id)

    if not include_inactive:
        query = query.filter(Expense.status == "active")

    expenses = query.order_by(Expense.expense_date.desc()).all()

    return expenses


@router.get("/trip/{trip_id}/summary")
def get_trip_expense_summary(
    trip_id: int,
    db: Session = Depends(get_db),
):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()

    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found.")

    result = (
        db.query(func.count(Expense.id), func.coalesce(func.sum(Expense.amount), 0))
        .filter(Expense.trip_id == trip_id, Expense.status == "active")
        .first()
    )

    expense_count = result[0] or 0
    total_amount = float(result[1] or 0)

    return {
        "trip_id": trip_id,
        "car_id": trip.car_id,
        "driver_id": trip.driver_id,
        "expense_count": expense_count,
        "total_amount": total_amount,
    }


@router.get("/driver/{driver_id}/summary")
def get_driver_expense_summary(
    driver_id: int,
    db: Session = Depends(get_db),
):
    driver = db.query(Driver).filter(Driver.id == driver_id).first()

    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found.")

    result = (
        db.query(func.count(Expense.id), func.coalesce(func.sum(Expense.amount), 0))
        .filter(Expense.driver_id == driver_id, Expense.status == "active")
        .first()
    )

    expense_count = result[0] or 0
    total_amount = float(result[1] or 0)

    return {
        "driver_id": driver_id,
        "expense_count": expense_count,
        "total_amount": total_amount,
    }


@router.get("/categories")
def get_expense_categories():
    return EXPENSE_CATEGORIES


# =========================================
# GET CAR EXPENSE HISTORY
# =========================================


@router.get("/car/{car_id}/history", response_model=CarExpenseHistoryOut)
def get_car_expense_history(
    car_id: int,
    include_inactive: bool = Query(default=False),
    from_date: date | None = Query(default=None),
    to_date: date | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    car = db.query(Car).filter(Car.id == car_id).first()

    if not car:
        raise HTTPException(status_code=404, detail="Car not found")

    query = (
        db.query(Expense)
        .options(
            selectinload(Expense.driver),
            selectinload(Expense.trip),
        )
        .filter(Expense.car_id == car_id)
    )

    if not include_inactive:
        query = query.filter(Expense.status == "active")

    if from_date:
        query = query.filter(Expense.expense_date >= from_date)

    if to_date:
        query = query.filter(Expense.expense_date <= to_date)

    expenses = query.order_by(Expense.expense_date.desc(), Expense.id.desc()).all()

    total_expenses = len(expenses)

    total_amount = sum(float(expense.amount or 0) for expense in expenses)

    return {
        "car_id": car_id,
        "total_expenses": total_expenses,
        "total_amount": total_amount,
        "expenses": expenses,
    }


@router.get("/analytics", response_model=ExpenseAnalyticsOut)
def get_expense_analytics(
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
    from_date: date | None = Query(default=None),
    to_date: date | None = Query(default=None),
    car_id: int | None = Query(default=None, gt=0),
    category: ExpenseCategory | None = Query(default=None),
):

    query = db.query(Expense).filter(Expense.status == "active")

    if from_date and to_date and from_date > to_date:
        raise HTTPException(
            status_code=400, detail="From Date cannot be later than To Date."
        )

    if from_date:
        query = query.filter(Expense.expense_date >= from_date)

    if to_date:
        query = query.filter(Expense.expense_date <= to_date)

    if car_id:
        query = query.filter(Expense.car_id == car_id)

    if category:
        query = query.filter(Expense.category == category)

    summary = query.with_entities(
        func.count(Expense.id),
        func.coalesce(func.sum(Expense.amount), 0),
        func.coalesce(func.avg(Expense.amount), 0),
    ).first()

    total_expenses = int(summary[0] or 0)
    total_amount = float(summary[1] or 0)
    average_expense = float(summary[2] or 0)

    category_rows = (
        query.with_entities(
            Expense.category,
            func.coalesce(func.sum(Expense.amount), 0).label("total_amount"),
            func.count(Expense.id).label("expense_count"),
        )
        .group_by(Expense.category)
        .order_by(func.sum(Expense.amount).desc())
        .all()
    )

    category_summary = [
        ExpenseCategorySummary(
            category=row.category,
            total_amount=float(row.total_amount or 0),
            expense_count=int(row.expense_count or 0),
        )
        for row in category_rows
    ]

    car_rows = (
        query.with_entities(
            Expense.car_id,
            func.coalesce(func.sum(Expense.amount), 0).label("total_amount"),
            func.count(Expense.id).label("expense_count"),
        )
        .group_by(Expense.car_id)
        .order_by(func.sum(Expense.amount).desc())
        .all()
    )

    car_summary = [
        ExpenseCarSummary(
            car_id=row.car_id,
            total_amount=float(row.total_amount or 0),
            expense_count=int(row.expense_count or 0),
        )
        for row in car_rows
    ]

    month_expression = func.to_char(Expense.expense_date, "YYYY-MM")

    monthly_rows = (
        query.with_entities(
            month_expression.label("month"),
            func.coalesce(func.sum(Expense.amount), 0).label("total_amount"),
            func.count(Expense.id).label("expense_count"),
        )
        .group_by(month_expression)
        .order_by(month_expression)
        .all()
    )

    monthly_summary = [
        ExpenseMonthlySummary(
            month=row.month,
            total_amount=float(row.total_amount or 0),
            expense_count=int(row.expense_count or 0),
        )
        for row in monthly_rows
    ]

    payment_expression = func.coalesce(Expense.payment_method, "unknown")

    payment_rows = (
        query.with_entities(
            payment_expression.label("payment_method"),
            func.coalesce(func.sum(Expense.amount), 0).label("total_amount"),
            func.count(Expense.id).label("expense_count"),
        )
        .group_by(payment_expression)
        .order_by(func.sum(Expense.amount).desc())
        .all()
    )

    payment_summary = [
        ExpensePaymentSummary(
            payment_method=row.payment_method,
            total_amount=float(row.total_amount or 0),
            expense_count=int(row.expense_count or 0),
        )
        for row in payment_rows
    ]

    return ExpenseAnalyticsOut(
        total_amount=total_amount,
        total_expenses=total_expenses,
        average_expense=average_expense,
        category_summary=category_summary,
        car_summary=car_summary,
        monthly_summary=monthly_summary,
        payment_summary=payment_summary,
    )


@router.get("/monthly-summary", response_model=MonthlyExpenseSummaryOut)
def get_monthly_expense_summary(
    year: int = Query(..., ge=2000, le=2100),
    car_id: int | None = Query(default=None, gt=0),
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):

    base_query = db.query(Expense).filter(
        Expense.status == "active", func.extract("year", Expense.expense_date) == year
    )

    if car_id:
        base_query = base_query.filter(Expense.car_id == car_id)

    yearly_summary = base_query.with_entities(
        func.count(Expense.id),
        func.coalesce(func.sum(Expense.amount), 0),
        func.coalesce(func.avg(Expense.amount), 0),
    ).first()

    total_expenses = int(yearly_summary[0] or 0)
    total_amount = float(yearly_summary[1] or 0)
    average_expense = float(yearly_summary[2] or 0)

    month_expression = func.extract("month", Expense.expense_date)

    monthly_rows = (
        base_query.with_entities(
            month_expression.label("month"),
            func.coalesce(func.sum(Expense.amount), 0).label("total_amount"),
            func.count(Expense.id).label("expense_count"),
            func.coalesce(func.avg(Expense.amount), 0).label("average_expense"),
        )
        .group_by(month_expression)
        .order_by(month_expression)
        .all()
    )

    months = []

    for row in monthly_rows:

        month_number = int(row.month)
        month_query = base_query.filter(
            func.extract("month", Expense.expense_date) == month_number
        )

        category_rows = (
            month_query.with_entities(
                Expense.category,
                func.coalesce(func.sum(Expense.amount), 0).label("total_amount"),
                func.count(Expense.id).label("expense_count"),
            )
            .group_by(Expense.category)
            .order_by(func.sum(Expense.amount).desc())
            .all()
        )

        categories = [
            MonthlyExpenseCategorySummary(
                category=row.category,
                total_amount=float(row.total_amount or 0),
                expense_count=int(row.expense_count or 0),
            )
            for row in category_rows
        ]

        months.append(
            MonthlyExpenseSummaryItem(
                month=f"{year}-{month_number:02d}",
                total_amount=float(row.total_amount or 0),
                expense_count=int(row.expense_count or 0),
                average_expense=float(row.average_expense or 0),
                categories=categories,
            )
        )

    return MonthlyExpenseSummaryOut(
        year=year,
        total_amount=total_amount,
        total_expenses=total_expenses,
        average_expense=average_expense,
        months=months,
    )


@router.get("/car/{car_id}", response_model=list[ExpenseOut])
def get_car_expenses(
    car_id: int,
    include_inactive: bool = Query(default=False),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    # Check car exists
    get_car_or_404(db, car_id)

    query = db.query(Expense).filter(Expense.car_id == car_id)

    if not include_inactive:

        query = query.filter(Expense.status == "active")

    return query.order_by(Expense.expense_date.desc(), Expense.id.desc()).all()


# ========================================
# GET SINGLE EXPENSE
# =========================================


@router.get("/{expense_id}", response_model=ExpenseOut)
def get_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):

    return get_expense_or_404(db, expense_id)


# =========================================
# UPDATE EXPENSE
# =========================================


@router.put("/{expense_id}", response_model=ExpenseOut)
def update_expense(
    expense_id: int,
    expense_data: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(SUPER_ADMIN, ADMIN, MANAGER, STAFF)),
):

    expense = get_expense_or_404(db, expense_id)
    update_data = expense_data.model_dump(exclude_unset=True)

    new_expense_date = update_data.get("expense_date", expense.expense_date)

    new_driver_id = update_data.get("driver_id", expense.driver_id)

    new_trip_id = update_data.get("trip_id", expense.trip_id)

    validate_expense_links(
        db=db,
        car_id=expense.car_id,
        expense_date=new_expense_date,
        driver_id=new_driver_id,
        trip_id=new_trip_id,
    )

    update_data = expense_data.model_dump(exclude_unset=True)

    # Amount validation
    if "amount" in update_data and update_data["amount"] <= 0:

        raise HTTPException(
            status_code=400, detail="Expense amount must be greater than 0"
        )

    for field, value in update_data.items():
        setattr(expense, field, value)

    db.commit()
    db.refresh(expense)

    return expense


# =========================================
# DELETE EXPENSE
# =========================================


@router.delete("/{expense_id}", response_model=ExpenseOut)
def delete_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(SUPER_ADMIN, ADMIN)),
):

    expense = get_expense_or_404(db, expense_id)

    if expense.status == "inactive":
        raise HTTPException(status_code=400, detail="Expense is already inactive")

    expense.status = "inactive"

    db.commit()
    db.refresh(expense)

    return expense


@router.patch("/{expense_id}/activate", response_model=ExpenseOut)
def activate_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(SUPER_ADMIN, ADMIN)),
):

    expense = get_expense_or_404(db, expense_id)

    if expense.status == "active":

        raise HTTPException(status_code=400, detail="Expense is already active")

    expense.status = "active"

    db.commit()

    db.refresh(expense)

    return expense
