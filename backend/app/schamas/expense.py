from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

# =========================================
# Expense Types
# =========================================

ExpenseCategory = Literal[
    "repair",
    "insurance",
    "toll",
    "parking",
    "tax",
    "fine",
    "other",
]


PaymentMethod = Literal[
    "cash",
    "card",
    "upi",
    "bank_transfer",
    "other",
]


EXPENSE_CATEGORIES = [
    {"value": "repair", "label": "Repair"},
    {"value": "insurance", "label": "Insurance"},
    {"value": "toll", "label": "Toll"},
    {"value": "parking", "label": "Parking"},
    {"value": "tax", "label": "Tax"},
    {"value": "fine", "label": "Fine"},
    {"value": "other", "label": "Other"},
]


# =========================================
# Expense Base
# =========================================


class ExpenseBase(BaseModel):

    car_id: int = Field(..., gt=0)

    driver_id: int | None = Field(default=None, gt=0)

    trip_id: int | None = Field(default=None, gt=0)

    expense_date: date

    category: ExpenseCategory

    amount: float = Field(..., gt=0)

    description: str | None = Field(default=None, max_length=255)

    vendor: str | None = Field(default=None, max_length=150)

    payment_method: PaymentMethod | None = None

    receipt_number: str | None = Field(default=None, max_length=100)

    notes: str | None = None


# =========================================
# Create
# =========================================


class ExpenseCreate(ExpenseBase):
    pass


# =========================================
# Update
# =========================================


class ExpenseUpdate(BaseModel):

    driver_id: int | None = Field(default=None, gt=0)

    trip_id: int | None = Field(default=None, gt=0)

    expense_date: date | None = None

    category: ExpenseCategory | None = None

    amount: float | None = Field(default=None, gt=0)

    description: str | None = Field(default=None, max_length=255)

    vendor: str | None = Field(default=None, max_length=150)

    payment_method: PaymentMethod | None = None

    receipt_number: str | None = Field(default=None, max_length=100)

    notes: str | None = None

    status: Literal["active", "inactive"] | None = None


# =========================================
# Linked Driver Response
# =========================================


class ExpenseDriverOut(BaseModel):

    id: int

    name: str

    phone: str | None = None

    license_number: str | None = None

    status: str | None = None

    model_config = ConfigDict(from_attributes=True)


# =========================================
# Linked Trip Response
# =========================================


class ExpenseTripOut(BaseModel):

    id: int

    driver_id: int

    car_id: int

    start_location: str

    destination: str

    start_datetime: datetime

    end_datetime: datetime | None = None

    status: str

    model_config = ConfigDict(from_attributes=True)


# =========================================
# Expense Response
# =========================================


class ExpenseOut(ExpenseBase):

    id: int

    status: str

    created_at: datetime

    driver: ExpenseDriverOut | None = None

    trip: ExpenseTripOut | None = None

    model_config = ConfigDict(from_attributes=True)


# =========================================
# Expense History Item
# =========================================


class ExpenseHistoryItem(BaseModel):
    id: int
    expense_date: date
    category: ExpenseCategory
    amount: float
    description: str | None = None
    vendor: str | None = None
    payment_method: PaymentMethod | None = None
    receipt_number: str | None = None
    status: str

    driver_id: int | None = None
    trip_id: int | None = None

    driver: ExpenseDriverOut | None = None
    trip: ExpenseTripOut | None = None

    model_config = ConfigDict(from_attributes=True)

# =========================================
# Car Expense History
# =========================================


class CarExpenseHistoryOut(BaseModel):

    car_id: int

    total_expenses: int

    total_amount: float

    expenses: list[ExpenseHistoryItem]


# =========================================
# Analytics Schemas
# =========================================


class ExpenseCategorySummary(BaseModel):

    category: str

    total_amount: float

    expense_count: int


class ExpenseCarSummary(BaseModel):

    car_id: int

    total_amount: float

    expense_count: int


class ExpenseMonthlySummary(BaseModel):

    month: str

    total_amount: float

    expense_count: int


class ExpensePaymentSummary(BaseModel):

    payment_method: str

    total_amount: float

    expense_count: int


class ExpenseAnalyticsOut(BaseModel):

    total_amount: float

    total_expenses: int

    average_expense: float

    category_summary: list[ExpenseCategorySummary]

    car_summary: list[ExpenseCarSummary]

    monthly_summary: list[ExpenseMonthlySummary]

    payment_summary: list[ExpensePaymentSummary]


# =========================================
# Monthly Summary Schemas
# =========================================


class MonthlyExpenseCategorySummary(BaseModel):

    category: str

    total_amount: float

    expense_count: int


class MonthlyExpenseSummaryItem(BaseModel):

    month: str

    total_amount: float

    expense_count: int

    average_expense: float

    categories: list[MonthlyExpenseCategorySummary]


class MonthlyExpenseSummaryOut(BaseModel):

    year: int

    total_amount: float

    total_expenses: int

    average_expense: float

    months: list[MonthlyExpenseSummaryItem]
