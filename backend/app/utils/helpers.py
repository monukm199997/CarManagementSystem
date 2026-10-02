from datetime import date, timedelta, datetime
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.driver import Driver
from app.models.car import Car
from app.models.driver_vehicle_assignment import DriverVehicleAssignment
from app.models.expense import Expense
from app.models.trip import Trip
from sqlalchemy import func, or_


def get_document_expiry_status(expiry_date, status="active"):

    if status == "inactive":
        return "inactive"

    if not expiry_date:
        return "no_expiry"

    today = date.today()

    if expiry_date < today:
        return "expired"

    upcoming_date = today + timedelta(days=30)

    if expiry_date <= upcoming_date:
        return "expiring_soon"

    return "active"


def get_license_status(expiry_date):

    if not expiry_date:
        return "no_expiry"

    today = date.today()

    if expiry_date < today:
        return "expired"

    if expiry_date <= today + timedelta(days=30):
        return "expiring_soon"

    return "valid"


# =========================================================
# HELPER - GET DRIVER
# =========================================================


def get_driver_or_404(db: Session, driver_id: int):

    driver = db.query(Driver).filter(Driver.id == driver_id).first()

    if not driver:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found"
        )

    return driver


# =========================================================
# HELPER - GET CAR
# =========================================================


def get_car_or_404(db: Session, car_id: int):

    car = db.query(Car).filter(Car.id == car_id).first()

    if not car:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Car not found"
        )

    return car

def get_expense_or_404(db: Session, expense_id: int):
    expense = db.query(Expense).filter(Expense.id == expense_id).first()

    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    return expense

# =========================================================
# HELPER - DRIVER VALIDATION
# =========================================================


def validate_driver_for_trip(driver: Driver):

    if driver.status != "active":

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Trip cannot be created because " f"driver status is '{driver.status}'"
            ),
        )

    if driver.license_expiry_date and driver.license_expiry_date < date.today():

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Driver license has expired"
        )


# =========================================================
# HELPER - ACTIVE DRIVER CAR ASSIGNMENT
# =========================================================


def get_active_driver_assignment(db: Session, driver_id: int, car_id: int):

    assignment = (
        db.query(DriverVehicleAssignment)
        .filter(
            DriverVehicleAssignment.driver_id == driver_id,
            DriverVehicleAssignment.car_id == car_id,
            DriverVehicleAssignment.status == "active",
        )
        .first()
    )

    if not assignment:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=("This car is not currently assigned " "to this driver"),
        )

    return assignment


# =========================================================
# HELPER - DATETIME VALIDATION
# =========================================================


def validate_trip_dates(start_datetime: datetime, end_datetime: datetime | None = None):

    if end_datetime and end_datetime < start_datetime:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=("End datetime cannot be earlier " "than start datetime"),
        )


# =========================================================
# HELPER - ODOMETER VALIDATION
# =========================================================


def validate_odometer(start_odometer: float | None, end_odometer: float | None):

    if start_odometer is not None and start_odometer < 0:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Start odometer cannot be negative",
        )

    if end_odometer is not None and end_odometer < 0:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="End odometer cannot be negative",
        )

    if (
        start_odometer is not None
        and end_odometer is not None
        and end_odometer < start_odometer
    ):

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=("End odometer cannot be less " "than start odometer"),
        )


TRIP_STATUSES = {"planned", "ongoing", "completed", "cancelled"}


def validate_expense_links(
    db: Session,
    car_id: int,
    expense_date: date,
    driver_id: int | None = None,
    trip_id: int | None = None,
):

    if driver_id is not None:

        driver = (
            db.query(Driver)
            .filter(Driver.id == driver_id)
            .first()
        )

        if not driver:
            raise HTTPException(
                status_code=404,
                detail="Driver not found."
            )

        if driver.status != "active":
            raise HTTPException(
                status_code=400,
                detail="Selected driver is not active."
            )

        if (
            driver.license_expiry_date
            and driver.license_expiry_date < expense_date
        ):
            raise HTTPException(
                status_code=400,
                detail="Selected driver's license was expired on the expense date."
            )

        assignment = (
            db.query(DriverVehicleAssignment)
            .filter(
                DriverVehicleAssignment.driver_id == driver_id,
                DriverVehicleAssignment.car_id == car_id,
                DriverVehicleAssignment.status == "active",
                DriverVehicleAssignment.assigned_from <= expense_date,
                or_(
                    DriverVehicleAssignment.assigned_to.is_(None),
                    DriverVehicleAssignment.assigned_to >= expense_date
                )
            )
            .first()
        )

        if not assignment:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Selected driver was not assigned to the selected "
                    "car on the expense date."
                )
            )

    # --------------------------------------------------
    # TRIP VALIDATION
    # --------------------------------------------------

    if trip_id is not None:

        trip = (
            db.query(Trip)
            .filter(Trip.id == trip_id)
            .first()
        )

        if not trip:
            raise HTTPException(
                status_code=404,
                detail="Trip not found."
            )

        if trip.car_id != car_id:
            raise HTTPException(
                status_code=400,
                detail="Selected trip does not belong to the selected car."
            )

        if (
            driver_id is not None
            and trip.driver_id != driver_id
        ):
            raise HTTPException(
                status_code=400,
                detail="Selected trip does not belong to the selected driver."
            )


        