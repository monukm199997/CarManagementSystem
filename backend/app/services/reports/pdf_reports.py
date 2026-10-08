from datetime import date

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.car import Car
from app.models.service import Services
from app.models.fuel import Fuel
from app.models.expense import Expense
from app.models.driver import Driver
from app.models.trip import Trip
from app.models.vehicle_document import VehicleDocument

from app.services.reports.pdf_export import (
    create_pdf_response,
)
from app.core.roles import CUSTOMER


def export_vehicle_pdf(
    db: Session,
    current_user,
    car_id: int | None = None,
    status: str | None = None,
):
    query = db.query(Car)

    if current_user.role == CUSTOMER:
        query = query.filter(
            Car.owner_id == current_user.id
        )

    if car_id is not None:
        query = query.filter(Car.id == car_id)

    if status:
        query = query.filter(Car.status == status)

    cars = query.order_by(Car.id.asc()).all()

    headers = [
        "ID",
        "Registration Number",
        "Brand",
        "Model",
        "Status",
    ]

    rows = []

    for car in cars:
        rows.append(
            [
                car.id,
                car.registration_number,
                car.brand,
                car.model,
                car.status,
            ]
        )

    return create_pdf_response(
        headers=headers,
        rows=rows,
        title="Vehicle Report",
        summary_data=[
            (
                "Total Vehicles",
                str(len(rows)),
            ),
            (
                "Active Vehicles",
                str(sum(1 for row in rows if str(row[4]).lower() == "active")),
            ),
            (
                "Report Type",
                "Vehicle Report",
            ),
        ],
    )

def export_service_pdf(
    db: Session,
    current_user,
    car_id: int | None = None,
    status: str | None = None,
    service_type: str | None = None,
):
    query = db.query(
        Services,
        Car.registration_number,
        Car.brand,
        Car.model,
    ).join(
        Car,
        Car.id == Services.car_id,
    )

    if current_user.role == CUSTOMER:
        query = query.filter(
            Car.owner_id == current_user.id
        )

    if car_id is not None:
        query = query.filter(Services.car_id == car_id)

    if status:
        query = query.filter(Services.status == status)

    if service_type:
        query = query.filter(Services.service_type == service_type)

    rows_data = query.order_by(
        Services.service_date.desc(),
        Services.id.desc(),
    ).all()

    headers = [
        "ID",
        "Car ID",
        "Registration",
        "Brand",
        "Model",
        "Service Type",
        "Service Date",
        "Odometer",
        "Service Center",
        "Cost",
        "Next Due",
        "Status",
    ]

    rows = []

    for (
        service,
        registration_number,
        brand,
        model,
    ) in rows_data:

        rows.append(
            [
                service.id,
                service.car_id,
                registration_number,
                brand,
                model,
                service.service_type,
                service.service_date,
                service.odometer_reading,
                service.service_center,
                service.cost,
                service.next_service_due,
                service.status,
            ]
        )

    total_service_cost = sum(
        float(row[9] or 0)
        for row in rows
    )

    return create_pdf_response(
        headers=headers,
        rows=rows,
        title="Service Report",
        summary_data=[
            (
                "Total Services",
                str(len(rows)),
            ),
            (
                "Total Cost",
                f"₹{total_service_cost:,.2f}",
            ),
            (
                "Report Type",
                "Service Report",
            ),
        ],
    )

def export_fuel_pdf(
    db: Session,
    current_user,
    car_id: int | None = None,
    fuel_type: str | None = None,
):
    query = db.query(
        Fuel,
        Car.registration_number,
        Car.brand,
        Car.model,
    ).join(
        Car,
        Car.id == Fuel.car_id,
    )

    if current_user.role == CUSTOMER:
        query = query.filter(
            Car.owner_id == current_user.id
        )

    if car_id is not None:
        query = query.filter(Fuel.car_id == car_id)

    if fuel_type:
        query = query.filter(Fuel.fuel_type == fuel_type)

    rows_data = query.order_by(
        Fuel.fuel_date.desc(),
        Fuel.id.desc(),
    ).all()

    headers = [
        "ID",
        "Car ID",
        "Registration",
        "Brand",
        "Model",
        "Fuel Date",
        "Odometer",
        "Fuel Type",
        "Litres",
        "Price/Litre",
        "Total Cost",
        "Station",
    ]

    rows = []

    for (
        fuel,
        registration_number,
        brand,
        model,
    ) in rows_data:

        rows.append(
            [
                fuel.id,
                fuel.car_id,
                registration_number,
                brand,
                model,
                fuel.fuel_date,
                fuel.odometer_reading,
                fuel.fuel_type,
                fuel.litres,
                fuel.price_per_litre,
                fuel.total_cost,
                fuel.fuel_station,
            ]
        )

    total_fuel_cost = sum(
        float(row[10] or 0)
        for row in rows
    )

    return create_pdf_response(
        headers=headers,
        rows=rows,
        title="Fuel Report",
        summary_data=[
            (
                "Fuel Records",
                str(len(rows)),
            ),
            (
                "Total Fuel Cost",
                f"₹{total_fuel_cost:,.2f}",
            ),
            (
                "Report Type",
                "Fuel Report",
            ),
        ],
    )

def export_expense_pdf(
    db: Session,
    current_user,
    car_id: int | None = None,
    driver_id: int | None = None,
    status: str | None = None,
    category: str | None = None,
    trip_id: int | None = None,
):
    query = (
        db.query(
            Expense,
            Car.registration_number,
            Car.brand,
            Car.model,
            Driver.name.label("driver_name"),
            Trip.status.label("trip_status"),
        )
        .join(
            Car,
            Car.id == Expense.car_id,
        )
        .outerjoin(
            Driver,
            Driver.id == Expense.driver_id,
        )
        .outerjoin(
            Trip,
            Trip.id == Expense.trip_id,
        )
    )

    if current_user.role == CUSTOMER:
        query = query.filter(
            Car.owner_id == current_user.id
        )

    if car_id is not None:
        query = query.filter(Expense.car_id == car_id)

    if driver_id is not None:
        query = query.filter(Expense.driver_id == driver_id)

    if status:
        query = query.filter(Expense.status == status)

    if category:
        query = query.filter(Expense.category == category)

    if trip_id is not None:
        query = query.filter(Expense.trip_id == trip_id)

    rows_data = query.order_by(
        Expense.expense_date.desc(),
        Expense.id.desc(),
    ).all()

    headers = [
        "ID",
        "Car ID",
        "Registration",
        "Brand",
        "Model",
        "Driver ID",
        "Driver",
        "Trip ID",
        "Trip Status",
        "Date",
        "Category",
        "Amount",
        "Description",
        "Vendor",
        "Payment",
        "Receipt",
        "Status",
    ]

    rows = []

    for (
        expense,
        registration_number,
        brand,
        model,
        driver_name,
        trip_status,
    ) in rows_data:

        rows.append(
            [
                expense.id,
                expense.car_id,
                registration_number,
                brand,
                model,
                expense.driver_id,
                driver_name,
                expense.trip_id,
                trip_status,
                expense.expense_date,
                expense.category,
                expense.amount,
                expense.description,
                expense.vendor,
                expense.payment_method,
                expense.receipt_number,
                expense.status,
            ]
        )

    total_expense_amount = sum(
        float(row[11] or 0)
        for row in rows
    )

    return create_pdf_response(
        headers=headers,
        rows=rows,
        title="Expense Report",
        summary_data=[
            (
                "Total Expenses",
                str(len(rows)),
            ),
            (
                "Total Amount",
                f"₹{total_expense_amount:,.2f}",
            ),
            (
                "Report Type",
                "Expense Report",
            ),
        ],
    )

def export_driver_pdf(
    db: Session,
    driver_id: int | None = None,
    status: str | None = None,
):
    query = db.query(Driver)

    if driver_id is not None:
        query = query.filter(Driver.id == driver_id)

    if status:
        query = query.filter(Driver.status == status)

    drivers = query.order_by(
        Driver.name.asc(),
        Driver.id.asc(),
    ).all()

    headers = [
        "ID",
        "Name",
        "Email",
        "Phone",
        "License",
        "Issue Date",
        "Expiry Date",
        "Joining Date",
        "Status",
    ]

    rows = []

    for driver in drivers:
        rows.append(
            [
                driver.id,
                driver.name,
                driver.email,
                driver.phone,
                driver.license_number,
                driver.license_issue_date,
                driver.license_expiry_date,
                driver.joining_date,
                driver.status,
            ]
        )

    return create_pdf_response(
        headers=headers,
        rows=rows,
        title="Driver Report",
        summary_data=[
            (
                "Total Drivers",
                str(len(rows)),
            ),
            (
                "Active Drivers",
                str(
                    sum(
                        1
                        for row in rows
                        if str(row[8]).lower() == "active"
                    )
                ),
            ),
            (
                "Report Type",
                "Driver Report",
            ),
        ],
    )

def export_trip_pdf(
    db: Session,
    current_user,
    car_id: int | None = None,
    driver_id: int | None = None,
    status: str | None = None,
):
    query = (
        db.query(
            Trip,
            Car.registration_number,
            Car.brand,
            Car.model,
            Driver.name.label("driver_name"),
        )
        .join(
            Car,
            Car.id == Trip.car_id,
        )
        .join(
            Driver,
            Driver.id == Trip.driver_id,
        )
    )

    if current_user.role == CUSTOMER:
        query = query.filter(
            Car.owner_id == current_user.id
        )

    if car_id is not None:
        query = query.filter(Trip.car_id == car_id)

    if driver_id is not None:
        query = query.filter(Trip.driver_id == driver_id)

    if status:
        query = query.filter(Trip.status == status)

    rows_data = query.order_by(
        Trip.start_datetime.desc(),
        Trip.id.desc(),
    ).all()

    headers = [
        "ID",
        "Car ID",
        "Registration",
        "Brand",
        "Model",
        "Driver ID",
        "Driver",
        "Start Location",
        "Destination",
        "Start DateTime",
        "End DateTime",
        "Start Odometer",
        "End Odometer",
        "Distance",
        "Purpose",
        "Status",
    ]

    rows = []

    for (
        trip,
        registration_number,
        brand,
        model,
        driver_name,
    ) in rows_data:

        distance = None

        if trip.start_odometer is not None and trip.end_odometer is not None:
            distance = float(trip.end_odometer) - float(trip.start_odometer)

        rows.append(
            [
                trip.id,
                trip.car_id,
                registration_number,
                brand,
                model,
                trip.driver_id,
                driver_name,
                trip.start_location,
                trip.destination,
                trip.start_datetime,
                trip.end_datetime,
                trip.start_odometer,
                trip.end_odometer,
                distance,
                trip.purpose,
                trip.status,
            ]
        )

    return create_pdf_response(
        headers=headers,
        rows=rows,
        title="Trip Report",
        summary_data=[
            (
                "Total Trips",
                str(len(rows)),
            ),
            (
                "Completed Trips",
                str(
                    sum(
                        1
                        for row in rows
                        if str(row[15]).lower()
                        == "completed"
                    )
                ),
            ),
            (
                "Report Type",
                "Trip Report",
            ),
        ],
    )

def export_document_pdf(
    db: Session,
    current_user,
    car_id: int | None = None,
    document_type: str | None = None,
    status: str | None = None,
):
    query = db.query(
        VehicleDocument,
        Car.registration_number,
        Car.brand,
        Car.model,
    ).join(
        Car,
        Car.id == VehicleDocument.car_id,
    )

    if current_user.role == CUSTOMER:
        query = query.filter(
            Car.owner_id == current_user.id
        )

    if car_id is not None:
        query = query.filter(VehicleDocument.car_id == car_id)

    if document_type:
        query = query.filter(VehicleDocument.document_type.ilike(document_type))

    if status:
        query = query.filter(VehicleDocument.status == status)

    documents = query.order_by(
        VehicleDocument.expiry_date.asc(),
        VehicleDocument.id.desc(),
    ).all()

    headers = [
        "ID",
        "Car ID",
        "Registration",
        "Brand",
        "Model",
        "Document Type",
        "Document Number",
        "Issue Date",
        "Expiry Date",
        "Status",
    ]

    rows = []

    for (
        document,
        registration_number,
        brand,
        model,
    ) in documents:

        rows.append(
            [
                document.id,
                document.car_id,
                registration_number,
                brand,
                model,
                document.document_type,
                document.document_number,
                document.issue_date,
                document.expiry_date,
                document.status,
            ]
        )

    return create_pdf_response(
        headers=headers,
        rows=rows,
        title="Documents Report",
        summary_data=[
            (
                "Total Documents",
                str(len(rows)),
            ),
            (
                "Active Documents",
                str(
                    sum(
                        1
                        for row in rows
                        if str(row[9]).lower()
                        == "active"
                    )
                ),
            ),
            (
                "Report Type",
                "Documents Report",
            ),
        ],
    )

def export_vehicle_cost_pdf(
    db: Session,
    current_user,
    car_id: int | None = None,
    from_date: date | None = None,
    to_date: date | None = None,
):
    query = db.query(Car)

    if current_user.role == CUSTOMER:
        query = query.filter(
            Car.owner_id == current_user.id
        )

    if car_id is not None:
        query = query.filter(Car.id == car_id)

    cars = query.order_by(Car.id.asc()).all()

    headers = [
        "Car ID",
        "Registration",
        "Brand",
        "Model",
        "Service Cost",
        "Fuel Cost",
        "Expense Cost",
        "Total Cost",
    ]

    rows = []

    for car in cars:

        service_query = db.query(
            func.coalesce(
                func.sum(Services.cost),
                0,
            )
        ).filter(Services.car_id == car.id)

        if from_date:
            service_query = service_query.filter(Services.service_date >= from_date)

        if to_date:
            service_query = service_query.filter(Services.service_date <= to_date)

        service_cost = service_query.scalar() or 0

        fuel_query = db.query(
            func.coalesce(
                func.sum(Fuel.total_cost),
                0,
            )
        ).filter(Fuel.car_id == car.id)

        if from_date:
            fuel_query = fuel_query.filter(Fuel.fuel_date >= from_date)

        if to_date:
            fuel_query = fuel_query.filter(Fuel.fuel_date <= to_date)

        fuel_cost = fuel_query.scalar() or 0

        expense_query = db.query(
            func.coalesce(
                func.sum(Expense.amount),
                0,
            )
        ).filter(Expense.car_id == car.id)

        if from_date:
            expense_query = expense_query.filter(Expense.expense_date >= from_date)

        if to_date:
            expense_query = expense_query.filter(Expense.expense_date <= to_date)

        expense_cost = expense_query.scalar() or 0

        service_cost = float(service_cost)
        fuel_cost = float(fuel_cost)
        expense_cost = float(expense_cost)

        total_cost = service_cost + fuel_cost + expense_cost

        rows.append(
            [
                car.id,
                car.registration_number,
                car.brand,
                car.model,
                service_cost,
                fuel_cost,
                expense_cost,
                total_cost,
            ]
        )

    total_vehicle_cost = sum(
        float(row[7] or 0)
        for row in rows
    )

    return create_pdf_response(
        headers=headers,
        rows=rows,
        title="Combined Vehicle Cost Report",
        summary_data=[
            (
                "Vehicles",
                str(len(rows)),
            ),
            (
                "Total Cost",
                f"₹{total_vehicle_cost:,.2f}",
            ),
            (
                "Report Type",
                "Vehicle Cost Report",
            ),
        ],
    )

