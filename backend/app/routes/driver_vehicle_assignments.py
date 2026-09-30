from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date
from app.db.session import get_db

from app.models.driver import Driver
from app.models.car import Car
from app.models.driver_vehicle_assignment import (
    DriverVehicleAssignment
)

from app.schamas.driver_vehicle_assignment import (
    DriverVehicleAssignmentCreate,
    DriverVehicleAssignmentUpdate,
    DriverVehicleAssignmentOut
)

from app.dependencies.role import require_roles

from app.core.roles import (
    SUPER_ADMIN,
    ADMIN,
    MANAGER,
    STAFF
)


router = APIRouter(
    prefix="/driver-vehicle-assignments",
    tags=["Driver Vehicle Assignments"]
)


ALLOWED_ROLES = (
    SUPER_ADMIN,
    ADMIN,
    MANAGER,
    STAFF
)


# =========================================================
# CREATE ASSIGNMENT
# =========================================================

@router.post(
    "/",
    response_model=DriverVehicleAssignmentOut
)
def create_assignment(
    payload: DriverVehicleAssignmentCreate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(*ALLOWED_ROLES)
    )
):

    # -----------------------------------------------------
    # Check driver
    # -----------------------------------------------------

    driver = (
        db.query(Driver)
        .filter(Driver.id == payload.driver_id)
        .first()
    )

    if not driver:
        raise HTTPException(
            status_code=404,
            detail="Driver not found"
        )

    if driver.status != "active":
        raise HTTPException(
            status_code=400,
            detail=(
                f"Driver cannot be assigned because "
                f"driver status is '{driver.status}'"
            )
        )


    # -----------------------------------------------------
    # Check license expiry
    # -----------------------------------------------------

    if (
        driver.license_expiry_date
        and driver.license_expiry_date < date.today()
    ):
        raise HTTPException(
            status_code=400,
            detail="Driver license has expired"
        )


    # -----------------------------------------------------
    # Check car
    # -----------------------------------------------------

    car = (
        db.query(Car)
        .filter(Car.id == payload.car_id)
        .first()
    )

    if not car:
        raise HTTPException(
            status_code=404,
            detail="Car not found"
        )


    # -----------------------------------------------------
    # Validate dates
    # -----------------------------------------------------

    if (
        payload.assigned_to
        and payload.assigned_to < payload.assigned_from
    ):
        raise HTTPException(
            status_code=400,
            detail="Assigned to date cannot be before assigned from date"
        )


    # -----------------------------------------------------
    # Check driver already has active assignment
    # -----------------------------------------------------

    existing_driver_assignment = (
        db.query(DriverVehicleAssignment)
        .filter(
            DriverVehicleAssignment.driver_id
            == payload.driver_id,

            DriverVehicleAssignment.status
            == "active"
        )
        .first()
    )

    if existing_driver_assignment:

        raise HTTPException(
            status_code=400,
            detail="Driver is already assigned to a vehicle"
        )


    # -----------------------------------------------------
    # Check vehicle already has active driver
    # -----------------------------------------------------

    existing_car_assignment = (
        db.query(DriverVehicleAssignment)
        .filter(
            DriverVehicleAssignment.car_id
            == payload.car_id,

            DriverVehicleAssignment.status
            == "active"
        )
        .first()
    )

    if existing_car_assignment:

        raise HTTPException(
            status_code=400,
            detail="Vehicle is already assigned to another driver"
        )


    # -----------------------------------------------------
    # Create assignment
    # -----------------------------------------------------

    assignment = DriverVehicleAssignment(
        driver_id=payload.driver_id,
        car_id=payload.car_id,
        assigned_from=payload.assigned_from,
        assigned_to=payload.assigned_to,
        status="active",
        notes=payload.notes
    )

    db.add(assignment)

    db.commit()

    db.refresh(assignment)

    return assignment


# =========================================================
# GET ALL ASSIGNMENTS
# =========================================================

@router.get(
    "/",
    response_model=list[DriverVehicleAssignmentOut]
)
def get_assignments(
    driver_id: int | None = None,
    car_id: int | None = None,
    status: str | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(*ALLOWED_ROLES)
    )
):

    query = db.query(
        DriverVehicleAssignment
    )

    if driver_id is not None:

        query = query.filter(
            DriverVehicleAssignment.driver_id
            == driver_id
        )

    if car_id is not None:

        query = query.filter(
            DriverVehicleAssignment.car_id
            == car_id
        )

    if status:

        query = query.filter(
            DriverVehicleAssignment.status
            == status
        )

    return (
        query
        .order_by(
            DriverVehicleAssignment.id.desc()
        )
        .all()
    )


# =========================================================
# GET CURRENT DRIVER ASSIGNMENT
# =========================================================

@router.get(
    "/driver/{driver_id}/current",
    response_model=DriverVehicleAssignmentOut
)
def get_current_driver_assignment(
    driver_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(*ALLOWED_ROLES)
    )
):

    assignment = (
        db.query(DriverVehicleAssignment)
        .filter(
            DriverVehicleAssignment.driver_id
            == driver_id,

            DriverVehicleAssignment.status
            == "active"
        )
        .first()
    )

    if not assignment:

        raise HTTPException(
            status_code=404,
            detail="Driver is not currently assigned to a vehicle"
        )

    return assignment


# =========================================================
# GET CURRENT VEHICLE ASSIGNMENT
# =========================================================

@router.get(
    "/car/{car_id}/current",
    response_model=DriverVehicleAssignmentOut
)
def get_current_car_assignment(
    car_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(*ALLOWED_ROLES)
    )
):

    assignment = (
        db.query(DriverVehicleAssignment)
        .filter(
            DriverVehicleAssignment.car_id
            == car_id,

            DriverVehicleAssignment.status
            == "active"
        )
        .first()
    )

    if not assignment:

        raise HTTPException(
            status_code=404,
            detail="Vehicle is not currently assigned to a driver"
        )

    return assignment


# =========================================================
# GET ASSIGNMENT BY ID
# =========================================================

@router.get(
    "/{assignment_id}",
    response_model=DriverVehicleAssignmentOut
)
def get_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(*ALLOWED_ROLES)
    )
):

    assignment = (
        db.query(DriverVehicleAssignment)
        .filter(
            DriverVehicleAssignment.id
            == assignment_id
        )
        .first()
    )

    if not assignment:

        raise HTTPException(
            status_code=404,
            detail="Assignment not found"
        )

    return assignment


# =========================================================
# UPDATE ASSIGNMENT
# =========================================================

@router.put(
    "/{assignment_id}",
    response_model=DriverVehicleAssignmentOut
)
def update_assignment(
    assignment_id: int,
    payload: DriverVehicleAssignmentUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(*ALLOWED_ROLES)
    )
):

    assignment = (
        db.query(DriverVehicleAssignment)
        .filter(
            DriverVehicleAssignment.id
            == assignment_id
        )
        .first()
    )

    if not assignment:

        raise HTTPException(
            status_code=404,
            detail="Assignment not found"
        )


    update_data = payload.model_dump(
        exclude_unset=True
    )


    assigned_from = update_data.get(
        "assigned_from",
        assignment.assigned_from
    )

    assigned_to = update_data.get(
        "assigned_to",
        assignment.assigned_to
    )


    if (
        assigned_to
        and assigned_to < assigned_from
    ):

        raise HTTPException(
            status_code=400,
            detail="Assigned to date cannot be before assigned from date"
        )


    for field, value in update_data.items():

        setattr(
            assignment,
            field,
            value
        )


    db.commit()

    db.refresh(assignment)

    return assignment


# =========================================================
# END ASSIGNMENT
# =========================================================

@router.patch(
    "/{assignment_id}/end",
    response_model=DriverVehicleAssignmentOut
)
def end_assignment(
    assignment_id: int,
    assigned_to=None,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(*ALLOWED_ROLES)
    )
):

    assignment = (
        db.query(DriverVehicleAssignment)
        .filter(
            DriverVehicleAssignment.id
            == assignment_id
        )
        .first()
    )

    if not assignment:

        raise HTTPException(
            status_code=404,
            detail="Assignment not found"
        )


    if assignment.status == "inactive":

        raise HTTPException(
            status_code=400,
            detail="Assignment is already inactive"
        )


    end_date = assigned_to or date.today()


    if end_date < assignment.assigned_from:

        raise HTTPException(
            status_code=400,
            detail="Assignment end date cannot be before start date"
        )


    assignment.assigned_to = end_date
    assignment.status = "inactive"


    db.commit()

    db.refresh(assignment)

    return assignment
