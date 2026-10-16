from datetime import date, datetime, timedelta
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status

from sqlalchemy.orm import Session
from app.db.session import get_db
from app.dependencies.auth import get_current_user
from app.dependencies.role import require_roles
from app.models.driver import Driver
from app.models.car import Car
from app.models.trip import Trip
from app.models.driver_vehicle_assignment import DriverVehicleAssignment
from app.models.company import Company
from app.utils.helpers import ensure_company_access, get_company_trip_or_404

from app.schamas.trip import TripCreate, TripUpdate, TripOut
from app.core.roles import SUPER_ADMIN, ADMIN, MANAGER, STAFF
from app.utils.helpers import (
    get_driver_or_404,
    get_car_or_404,
    get_active_driver_assignment,
    validate_trip_dates,
    validate_odometer,
    validate_driver_for_trip,
    TRIP_STATUSES,
)

router = APIRouter(prefix="/trips", tags=["Trips"])

# =========================================================
# CREATE TRIP
# =========================================================


@router.post("/", response_model=TripOut, status_code=status.HTTP_201_CREATED)
def create_trip(
    payload: TripCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(SUPER_ADMIN, ADMIN, MANAGER, STAFF)),
):

    ensure_company_access(current_user)

    driver = (
        db.query(Driver)
        .filter(
            Driver.id == payload.driver_id,
            Driver.company_id == current_user.company_id,
        )
        .first()
    )

    if not driver:
        raise HTTPException(
            status_code=404,
            detail="Driver not found",
        )

    validate_driver_for_trip(driver)

    car = (
        db.query(Car)
        .filter(
            Car.id == payload.car_id,
            Car.company_id == current_user.company_id,
        )
        .first()
    )

    if not car:
        raise HTTPException(
            status_code=404,
            detail="Car not found",
        )

    validate_trip_dates(payload.start_datetime, payload.end_datetime)
    validate_odometer(payload.start_odometer, payload.end_odometer)

    get_active_driver_assignment(
        db,
        payload.driver_id,
        payload.car_id,
    )

    trip = Trip(
        driver_id=payload.driver_id,
        car_id=payload.car_id,
        start_location=payload.start_location,
        destination=payload.destination,
        start_datetime=payload.start_datetime,
        end_datetime=payload.end_datetime,
        start_odometer=payload.start_odometer,
        end_odometer=payload.end_odometer,
        purpose=payload.purpose,
        status="planned",
        notes=payload.notes,
    )

    db.add(trip)
    db.commit()
    db.refresh(trip)

    return trip

# =========================================================
# GET ALL TRIPS
# =========================================================

@router.get("/", response_model=list[TripOut])
def get_trips(
    driver_id: int | None = Query(default=None),
    car_id: int | None = Query(default=None),
    trip_status: Literal["planned", "ongoing", "completed", "cancelled"] | None = Query(
        default=None
    ),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):

    ensure_company_access(current_user)

    query = (
        db.query(Trip)
        .join(Driver, Driver.id == Trip.driver_id)
        .join(Car, Car.id == Trip.car_id)
        .filter(
            Driver.company_id == current_user.company_id,
            Car.company_id == current_user.company_id,
        )
    )

    if driver_id is not None:
        query = query.filter(Trip.driver_id == driver_id)
    if car_id is not None:
        query = query.filter(Trip.car_id == car_id)
    if trip_status is not None:
        query = query.filter(Trip.status == trip_status)
    trips = query.order_by(Trip.start_datetime.desc()).all()
    return trips

# =========================================================
# GET SINGLE TRIP
# =========================================================

@router.get("/{trip_id}", response_model=TripOut)
def get_trip(
    trip_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)
):

    ensure_company_access(current_user)

    trip = get_company_trip_or_404(
        db,
        trip_id,
        current_user.company_id,
    )

    return trip

# =========================================================
# UPDATE TRIP
# =========================================================

@router.put("/{trip_id}", response_model=TripOut)
def update_trip(
    trip_id: int,
    payload: TripUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(SUPER_ADMIN, ADMIN, MANAGER, STAFF)),
):

    ensure_company_access(current_user)

    trip = get_company_trip_or_404(
        db,
        trip_id,
        current_user.company_id,
    )

    if trip.status == "cancelled":

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cancelled trip cannot be updated",
        )

    update_data = payload.model_dump(exclude_unset=True)
    new_start_datetime = update_data.get("start_datetime", trip.start_datetime)
    new_end_datetime = update_data.get("end_datetime", trip.end_datetime)
    validate_trip_dates(new_start_datetime, new_end_datetime)

    new_start_odometer = update_data.get("start_odometer", trip.start_odometer)
    new_end_odometer = update_data.get("end_odometer", trip.end_odometer)
    validate_odometer(new_start_odometer, new_end_odometer)

    new_status = update_data.get("status", trip.status)

    if new_status not in TRIP_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid trip status"
        )

    if new_status == "completed":

        if new_end_datetime is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=("End datetime is required " "to complete a trip"),
            )

        if new_end_odometer is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=("End odometer is required " "to complete a trip"),
            )

    for field, value in update_data.items():

        setattr(trip, field, value)

    db.commit()
    db.refresh(trip)

    return trip

# =========================================================
# DELETE / CANCEL TRIP
# =========================================================

@router.delete("/{trip_id}", response_model=TripOut)
def delete_trip(
    trip_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            SUPER_ADMIN,
            ADMIN,
        )
    ),
):

    ensure_company_access(current_user)

    trip = get_company_trip_or_404(
        db,
        trip_id,
        current_user.company_id,
    )

    if trip.status == "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=("Completed trip cannot be cancelled"),
        )

    trip.status = "cancelled"

    db.commit()
    db.refresh(trip)

    return trip

# =========================================================
# UPDATE TRIP STATUS
# =========================================================

@router.patch("/{trip_id}/status", response_model=TripOut)
def update_trip_status(
    trip_id: int,
    trip_status: Literal["planned", "ongoing", "completed", "cancelled"],
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(SUPER_ADMIN, ADMIN, MANAGER, STAFF)),
):

    ensure_company_access(current_user)

    trip = get_company_trip_or_404(
        db,
        trip_id,
        current_user.company_id,
    )

    if trip.status == "completed":

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=("Completed trip status cannot be changed"),
        )

    if trip.status == "cancelled":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=("Cancelled trip status cannot be changed"),
        )

    if trip_status == "completed":

        if trip.end_datetime is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=("End datetime is required " "to complete the trip"),
            )

        if trip.end_odometer is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=("End odometer is required " "to complete the trip"),
            )

    trip.status = trip_status

    db.commit()
    db.refresh(trip)

    return trip
