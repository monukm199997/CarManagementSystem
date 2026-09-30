from datetime import date
from sqlalchemy import and_
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.models.driver_vehicle_assignment import DriverVehicleAssignment

from app.db.session import get_db
from app.models.driver import Driver
from app.schamas.driver import (
    DriverCreate,
    DriverUpdate,
    DriverStatusUpdate,
    DriverOut,
    DriverListOut
)
from app.dependencies.role import require_roles
from app.core.roles import (
    SUPER_ADMIN,
    ADMIN,
    MANAGER,
    STAFF
)
from app.models.car import Car
from app.schamas.driver_history import DriverHistoryOut


router = APIRouter(
    prefix="/drivers",
    tags=["Drivers"]
)


# ---------------------------------------------------------
# CREATE DRIVER
# ---------------------------------------------------------

@router.post("/", response_model=DriverOut)
def create_driver(
    payload: DriverCreate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            SUPER_ADMIN,
            ADMIN,
            MANAGER,
            STAFF
        )
    )
):

    # Check duplicate phone
    existing_phone = (
        db.query(Driver)
        .filter(Driver.phone == payload.phone)
        .first()
    )

    if existing_phone:
        raise HTTPException(
            status_code=400,
            detail="Driver with this phone number already exists"
        )

    # Check duplicate license
    existing_license = (
        db.query(Driver)
        .filter(
            Driver.license_number == payload.license_number
        )
        .first()
    )

    if existing_license:
        raise HTTPException(
            status_code=400,
            detail="Driver with this license number already exists"
        )

    # Validate license dates
    if (
        payload.license_issue_date
        and payload.license_expiry_date
        and payload.license_expiry_date
        < payload.license_issue_date
    ):
        raise HTTPException(
            status_code=400,
            detail="License expiry date cannot be before issue date"
        )

    driver = Driver(
        name=payload.name,
        email=payload.email,
        phone=payload.phone,
        license_number=payload.license_number,
        license_issue_date=payload.license_issue_date,
        license_expiry_date=payload.license_expiry_date,
        address=payload.address,
        emergency_contact_name=payload.emergency_contact_name,
        emergency_contact_phone=payload.emergency_contact_phone,
        joining_date=payload.joining_date,
        notes=payload.notes,
        status="active"
    )

    db.add(driver)
    db.commit()
    db.refresh(driver)

    return driver

# ---------------------------------------------------------
# GET ALL DRIVERS
# ---------------------------------------------------------

@router.get("/", response_model=list[DriverListOut])
def get_drivers(
    status: str | None = Query(default=None),
    search: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            SUPER_ADMIN,
            ADMIN,
            MANAGER,
            STAFF
        )
    )
):

    query = (
        db.query(
            Driver,
            Car
        )
        .outerjoin(
            DriverVehicleAssignment,
            and_(
                DriverVehicleAssignment.driver_id
                == Driver.id,

                DriverVehicleAssignment.status
                == "active"
            )
        )
        .outerjoin(
            Car,
            Car.id
            == DriverVehicleAssignment.car_id
        )
    )


    if status:

        query = query.filter(
            Driver.status == status
        )

    if search:

        search_value = (
            f"%{search.strip()}%"
        )

        query = query.filter(
            Driver.name.ilike(search_value)
            |
            Driver.phone.ilike(search_value)
            |
            Driver.license_number.ilike(search_value)
        )


    results = (
        query
        .order_by(
            Driver.id.desc()
        )
        .all()
    )


    response = []


    for driver, car in results:

        driver_data = {
            "id": driver.id,
            "name": driver.name,
            "email": driver.email,
            "phone": driver.phone,
            "license_number": driver.license_number,
            "license_issue_date": driver.license_issue_date,
            "license_expiry_date": driver.license_expiry_date,
            "address": driver.address,
            "emergency_contact_name": driver.emergency_contact_name,
            "emergency_contact_phone": driver.emergency_contact_phone,
            "joining_date": driver.joining_date,
            "status": driver.status,
            "notes": driver.notes,
            "created_at": driver.created_at,
            "assigned_car": None
        }


        if car:

            driver_data["assigned_car"] = {
                "id": car.id,
                "registration_number":
                    car.registration_number,
                "brand": car.brand,
                "model": car.model
            }


        response.append(
            driver_data
        )


    return response

# =========================================================
# UPDATE DRIVER STATUS
# =========================================================

@router.patch("/{driver_id}/status", response_model=DriverOut)
def update_driver_status(
    driver_id: int,
    payload: DriverStatusUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            SUPER_ADMIN,
            ADMIN,
            MANAGER,
            STAFF
        )
    )
):

    driver = (
        db.query(Driver)
        .filter(
            Driver.id == driver_id
        )
        .first()
    )

    if not driver:
        raise HTTPException(
            status_code=404,
            detail="Driver not found"
        )

    if driver.status == payload.status:

        return driver

    driver.status = payload.status


    if payload.status in {
        "inactive",
        "suspended"
    }:

        active_assignment = (
            db.query(
                DriverVehicleAssignment
            )
            .filter(
                DriverVehicleAssignment.driver_id
                == driver.id,

                DriverVehicleAssignment.status
                == "active"
            )
            .first()
        )

        if active_assignment:

            active_assignment.status = "inactive"

            active_assignment.assigned_to = date.today()


    db.commit()

    db.refresh(driver)

    return driver

# =========================================================
# DRIVER ASSIGNMENT HISTORY
# =========================================================

@router.get("/{driver_id}/history", response_model=list[DriverHistoryOut])
def get_driver_history(
    driver_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            SUPER_ADMIN,
            ADMIN,
            MANAGER,
            STAFF
        )
    )
):

    driver = (
        db.query(Driver)
        .filter(
            Driver.id == driver_id
        )
        .first()
    )

    if not driver:

        raise HTTPException(
            status_code=404,
            detail="Driver not found"
        )

    assignments = (
        db.query(
            DriverVehicleAssignment,
            Car
        )
        .join(
            Car,
            Car.id
            == DriverVehicleAssignment.car_id
        )
        .filter(
            DriverVehicleAssignment.driver_id
            == driver_id
        )
        .order_by(
            DriverVehicleAssignment.assigned_from.desc()
        )
        .all()
    )


    result = []


    for assignment, car in assignments:

        result.append({

            "id": assignment.id,
            "driver_id": assignment.driver_id,
            "car_id": assignment.car_id,
            "registration_number": car.registration_number,
            "brand": car.brand,
            "model": car.model,
            "assigned_from": assignment.assigned_from,
            "assigned_to": assignment.assigned_to,
            "status": assignment.status,
            "notes": assignment.notes,
            "created_at": assignment.created_at
        })

    return result

@router.get("/{driver_id}", response_model=DriverOut)
def get_driver(
    driver_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            SUPER_ADMIN,
            ADMIN,
            MANAGER,
            STAFF
        )
    )
):

    driver = (
        db.query(Driver)
        .filter(Driver.id == driver_id)
        .first()
    )

    if not driver:
        raise HTTPException(
            status_code=404,
            detail="Driver not found"
        )

    return driver

# ---------------------------------------------------------
# UPDATE DRIVER
# ---------------------------------------------------------

@router.put("/{driver_id}", response_model=DriverOut)
def update_driver(
    driver_id: int,
    payload: DriverUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            SUPER_ADMIN,
            ADMIN,
            MANAGER,
            STAFF
        )
    )
):

    driver = (
        db.query(Driver)
        .filter(Driver.id == driver_id)
        .first()
    )

    if not driver:
        raise HTTPException(
            status_code=404,
            detail="Driver not found"
        )

    update_data = payload.model_dump(
        exclude_unset=True
    )

    # -----------------------------------------
    # Phone duplicate check
    # -----------------------------------------

    if "phone" in update_data:

        existing_phone = (
            db.query(Driver)
            .filter(
                Driver.phone == update_data["phone"],
                Driver.id != driver_id
            )
            .first()
        )

        if existing_phone:
            raise HTTPException(
                status_code=400,
                detail="Driver with this phone number already exists"
            )

    # -----------------------------------------
    # License duplicate check
    # -----------------------------------------

    if "license_number" in update_data:

        existing_license = (
            db.query(Driver)
            .filter(
                Driver.license_number
                == update_data["license_number"],
                Driver.id != driver_id
            )
            .first()
        )

        if existing_license:
            raise HTTPException(
                status_code=400,
                detail="Driver with this license number already exists"
            )

    # -----------------------------------------
    # License date validation
    # -----------------------------------------

    issue_date = update_data.get(
        "license_issue_date",
        driver.license_issue_date
    )

    expiry_date = update_data.get(
        "license_expiry_date",
        driver.license_expiry_date
    )

    if (
        issue_date
        and expiry_date
        and expiry_date < issue_date
    ):
        raise HTTPException(
            status_code=400,
            detail="License expiry date cannot be before issue date"
        )

    # -----------------------------------------
    # Update fields
    # -----------------------------------------

    for field, value in update_data.items():
        setattr(driver, field, value)

    db.commit()
    db.refresh(driver)

    return driver

# ---------------------------------------------------------
# DEACTIVATE DRIVER
# ---------------------------------------------------------

@router.delete("/{driver_id}")
def deactivate_driver(
    driver_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            SUPER_ADMIN,
            ADMIN,
            MANAGER,
            STAFF
        )
    )
):

    driver = (
        db.query(Driver)
        .filter(Driver.id == driver_id)
        .first()
    )

    if not driver:
        raise HTTPException(
            status_code=404,
            detail="Driver not found"
        )

    driver.status = "inactive"

    db.commit()

    return {
        "message": "Driver deactivated successfully"
    }

# ---------------------------------------------------------
# ACTIVATE DRIVER
# ---------------------------------------------------------

@router.patch("/{driver_id}/activate")
def activate_driver(
    driver_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            SUPER_ADMIN,
            ADMIN,
            MANAGER,
            STAFF
        )
    )
):

    driver = (
        db.query(Driver)
        .filter(Driver.id == driver_id)
        .first()
    )

    if not driver:
        raise HTTPException(
            status_code=404,
            detail="Driver not found"
        )

    driver.status = "active"

    db.commit()

    return {
        "message": "Driver activated successfully"
    }

