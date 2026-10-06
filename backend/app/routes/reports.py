from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session
from datetime import date
from app.db.session import get_db
from app.dependencies.auth import get_current_user
from app.services.reports.vehicle_report import get_vehicle_report
from app.services.reports.service_report import get_service_report
from app.services.reports.fuel_report import get_fuel_report
from app.services.reports.expense_report import get_expense_report
from app.services.reports.driver_report import get_driver_report
from app.services.reports.trip_report import get_trip_report
from app.services.reports.document_report import get_document_report
from app.services.reports.combined_vehicle_cost import get_combined_vehicle_cost_report
from app.services.reports.dashboard_summary import get_dashboard_summary
from app.services.reports.common_filters import (
    common_report_filters,
    validate_report_date_range,
)

from app.schamas.reports import (
    VehicleReportResponse,
    ServiceReportResponse,
    FuelReportResponse,
    ExpenseReportResponse,
    DriverReportResponse,
    TripReportResponse,
    DocumentReportResponse,
    CombinedVehicleCostResponse,
    DashboardSummaryResponse,
)

from app.services.reports.csv_reports import (
    export_vehicle_csv,
    export_service_csv,
    export_fuel_csv,
    export_expense_csv,
    export_driver_csv,
    export_trip_csv,
    export_document_csv,
    export_vehicle_cost_csv,
)

from app.services.reports.excel_reports import (
    export_vehicle_excel,
    export_service_excel,
    export_fuel_excel,
    export_expense_excel,
    export_driver_excel,
    export_trip_excel,
    export_document_excel,
    export_vehicle_cost_excel,
)

from app.services.reports.pdf_reports import (
    export_vehicle_pdf,
    export_service_pdf,
    export_fuel_pdf,
    export_expense_pdf,
    export_driver_pdf,
    export_trip_pdf,
    export_document_pdf,
    export_vehicle_cost_pdf,
)

router = APIRouter(
    prefix="/reports",
    tags=["Reports"],
)


@router.get("/vehicles", response_model=VehicleReportResponse)
def vehicle_report(
    filters: dict = Depends(common_report_filters),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return get_vehicle_report(
        db=db,
        car_id=filters["car_id"],
        status=filters["status"],
        page=filters["page"],
        page_size=filters["page_size"],
    )


@router.get("/services", response_model=ServiceReportResponse)
def service_report(
    filters: dict = Depends(common_report_filters),
    service_type: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return get_service_report(
        db=db,
        car_id=filters["car_id"],
        status=filters["status"],
        service_type=service_type,
        page=filters["page"],
        page_size=filters["page_size"],
    )


@router.get("/fuel", response_model=FuelReportResponse)
def fuel_report(
    filters: dict = Depends(common_report_filters),
    fuel_type: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return get_fuel_report(
        db=db,
        car_id=filters["car_id"],
        fuel_type=fuel_type,
        page=filters["page"],
        page_size=filters["page_size"],
    )


@router.get("/expenses", response_model=ExpenseReportResponse)
def expense_report(
    filters: dict = Depends(common_report_filters),
    trip_id: int | None = Query(default=None),
    category: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return get_expense_report(
        db=db,
        car_id=filters["car_id"],
        driver_id=filters["driver_id"],
        trip_id=trip_id,
        category=category,
        status=filters["status"],
        page=filters["page"],
        page_size=filters["page_size"],
    )


@router.get("/drivers", response_model=DriverReportResponse)
def driver_report(
    filters: dict = Depends(common_report_filters),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return get_driver_report(
        db=db,
        driver_id=filters["driver_id"],
        status=filters["status"],
        page=filters["page"],
        page_size=filters["page_size"],
    )


@router.get("/trips", response_model=TripReportResponse)
def trip_report(
    filters: dict = Depends(common_report_filters),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return get_trip_report(
        db=db,
        car_id=filters["car_id"],
        driver_id=filters["driver_id"],
        status=filters["status"],
        page=filters["page"],
        page_size=filters["page_size"],
    )


@router.get("/documents", response_model=DocumentReportResponse)
def document_report(
    filters: dict = Depends(common_report_filters),
    document_type: str | None = Query(default=None),
    insurance_status: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return get_document_report(
        db=db,
        car_id=filters["car_id"],
        document_type=document_type,
        status=filters["status"],
        insurance_status=insurance_status,
        page=filters["page"],
        page_size=filters["page_size"],
    )


@router.get("/vehicle-cost", response_model=CombinedVehicleCostResponse)
def combined_vehicle_cost_report(
    filters: dict = Depends(common_report_filters),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return get_combined_vehicle_cost_report(
        db=db,
        car_id=filters["car_id"],
        from_date=filters["from_date"],
        to_date=filters["to_date"],
        page=filters["page"],
        page_size=filters["page_size"],
    )


@router.get("/dashboard-summary", response_model=DashboardSummaryResponse)
def dashboard_summary(
    from_date: date | None = Query(default=None),
    to_date: date | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    validate_report_date_range(
        from_date=from_date,
        to_date=to_date,
    )

    return get_dashboard_summary(
        db=db,
        from_date=from_date,
        to_date=to_date,
    )


@router.get("/vehicles/export/csv")
def export_vehicles_csv(
    filters: dict = Depends(common_report_filters),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    csv_content = export_vehicle_csv(
        db=db,
        car_id=filters["car_id"],
        status=filters["status"],
    )

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=vehicles.csv"},
    )


@router.get("/services/export/csv")
def export_services_csv(
    filters: dict = Depends(common_report_filters),
    service_type: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    csv_content = export_service_csv(
        db=db,
        car_id=filters["car_id"],
        status=filters["status"],
        service_type=service_type,
    )

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=services.csv"},
    )


@router.get("/fuel/export/csv")
def export_fuel_csv_route(
    filters: dict = Depends(common_report_filters),
    fuel_type: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    csv_content = export_fuel_csv(
        db=db,
        car_id=filters["car_id"],
        fuel_type=fuel_type,
    )

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=fuel.csv"},
    )


@router.get("/expenses/export/csv")
def export_expenses_csv(
    filters: dict = Depends(common_report_filters),
    trip_id: int | None = Query(default=None, ge=1),
    category: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    csv_content = export_expense_csv(
        db=db,
        car_id=filters["car_id"],
        driver_id=filters["driver_id"],
        status=filters["status"],
        category=category,
        trip_id=trip_id,
    )

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=expenses.csv"},
    )


@router.get("/drivers/export/csv")
def export_drivers_csv(
    filters: dict = Depends(common_report_filters),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    csv_content = export_driver_csv(
        db=db,
        driver_id=filters["driver_id"],
        status=filters["status"],
    )

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=drivers.csv"},
    )


@router.get("/trips/export/csv")
def export_trips_csv(
    filters: dict = Depends(common_report_filters),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    csv_content = export_trip_csv(
        db=db,
        car_id=filters["car_id"],
        driver_id=filters["driver_id"],
        status=filters["status"],
    )

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=trips.csv"},
    )


@router.get("/documents/export/csv")
def export_documents_csv(
    filters: dict = Depends(common_report_filters),
    document_type: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    csv_content = export_document_csv(
        db=db,
        car_id=filters["car_id"],
        document_type=document_type,
        status=filters["status"],
    )

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=documents.csv"},
    )


@router.get("/vehicle-cost/export/csv")
def export_vehicle_cost_csv_route(
    filters: dict = Depends(common_report_filters),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    csv_content = export_vehicle_cost_csv(
        db=db,
        car_id=filters["car_id"],
        from_date=filters["from_date"],
        to_date=filters["to_date"],
    )

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=vehicle_cost.csv"},
    )


@router.get("/vehicles/export/excel")
def export_vehicles_excel(
    filters: dict = Depends(common_report_filters),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    content = export_vehicle_excel(
        db=db,
        car_id=filters["car_id"],
        status=filters["status"],
    )

    return Response(
        content=content,
        media_type=(
            "application/vnd.openxmlformats-" "officedocument.spreadsheetml.sheet"
        ),
        headers={"Content-Disposition": "attachment; filename=vehicles.xlsx"},
    )


@router.get("/services/export/excel")
def export_services_excel(
    filters: dict = Depends(common_report_filters),
    service_type: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    content = export_service_excel(
        db=db,
        car_id=filters["car_id"],
        status=filters["status"],
        service_type=service_type,
    )

    return Response(
        content=content,
        media_type=(
            "application/vnd.openxmlformats-" "officedocument.spreadsheetml.sheet"
        ),
        headers={"Content-Disposition": "attachment; filename=services.xlsx"},
    )


@router.get("/fuel/export/excel")
def export_fuel_excel_route(
    filters: dict = Depends(common_report_filters),
    fuel_type: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    content = export_fuel_excel(
        db=db,
        car_id=filters["car_id"],
        fuel_type=fuel_type,
    )

    return Response(
        content=content,
        media_type=(
            "application/vnd.openxmlformats-" "officedocument.spreadsheetml.sheet"
        ),
        headers={"Content-Disposition": "attachment; filename=fuel.xlsx"},
    )


@router.get("/expenses/export/excel")
def export_expenses_excel(
    filters: dict = Depends(common_report_filters),
    trip_id: int | None = Query(default=None, ge=1),
    category: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    content = export_expense_excel(
        db=db,
        car_id=filters["car_id"],
        driver_id=filters["driver_id"],
        status=filters["status"],
        category=category,
        trip_id=trip_id,
    )

    return Response(
        content=content,
        media_type=(
            "application/vnd.openxmlformats-" "officedocument.spreadsheetml.sheet"
        ),
        headers={"Content-Disposition": "attachment; filename=expenses.xlsx"},
    )


@router.get("/drivers/export/excel")
def export_drivers_excel(
    filters: dict = Depends(common_report_filters),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    content = export_driver_excel(
        db=db,
        driver_id=filters["driver_id"],
        status=filters["status"],
    )

    return Response(
        content=content,
        media_type=(
            "application/vnd.openxmlformats-" "officedocument.spreadsheetml.sheet"
        ),
        headers={"Content-Disposition": "attachment; filename=drivers.xlsx"},
    )


@router.get("/trips/export/excel")
def export_trips_excel(
    filters: dict = Depends(common_report_filters),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    content = export_trip_excel(
        db=db,
        car_id=filters["car_id"],
        driver_id=filters["driver_id"],
        status=filters["status"],
    )

    return Response(
        content=content,
        media_type=(
            "application/vnd.openxmlformats-" "officedocument.spreadsheetml.sheet"
        ),
        headers={"Content-Disposition": "attachment; filename=trips.xlsx"},
    )


@router.get("/documents/export/excel")
def export_documents_excel(
    filters: dict = Depends(common_report_filters),
    document_type: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    content = export_document_excel(
        db=db,
        car_id=filters["car_id"],
        document_type=document_type,
        status=filters["status"],
    )

    return Response(
        content=content,
        media_type=(
            "application/vnd.openxmlformats-" "officedocument.spreadsheetml.sheet"
        ),
        headers={"Content-Disposition": "attachment; filename=documents.xlsx"},
    )


@router.get("/vehicle-cost/export/excel")
def export_vehicle_cost_excel_route(
    filters: dict = Depends(common_report_filters),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    content = export_vehicle_cost_excel(
        db=db,
        car_id=filters["car_id"],
        from_date=filters["from_date"],
        to_date=filters["to_date"],
    )

    return Response(
        content=content,
        media_type=(
            "application/vnd.openxmlformats-" "officedocument.spreadsheetml.sheet"
        ),
        headers={"Content-Disposition": "attachment; filename=vehicle_cost.xlsx"},
    )


@router.get("/vehicles/export/pdf")
def export_vehicles_pdf(
    filters: dict = Depends(common_report_filters),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    content = export_vehicle_pdf(
        db=db,
        car_id=filters["car_id"],
        status=filters["status"],
    )

    return Response(
        content=content,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=vehicles.pdf"},
    )


@router.get("/services/export/pdf")
def export_services_pdf(
    filters: dict = Depends(common_report_filters),
    service_type: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    content = export_service_pdf(
        db=db,
        car_id=filters["car_id"],
        status=filters["status"],
        service_type=service_type,
    )

    return Response(
        content=content,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=services.pdf"},
    )


@router.get("/fuel/export/pdf")
def export_fuel_pdf_route(
    filters: dict = Depends(common_report_filters),
    fuel_type: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    content = export_fuel_pdf(
        db=db,
        car_id=filters["car_id"],
        fuel_type=fuel_type,
    )

    return Response(
        content=content,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=fuel.pdf"},
    )


@router.get("/expenses/export/pdf")
def export_expenses_pdf(
    filters: dict = Depends(common_report_filters),
    trip_id: int | None = Query(default=None, ge=1),
    category: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    content = export_expense_pdf(
        db=db,
        car_id=filters["car_id"],
        driver_id=filters["driver_id"],
        status=filters["status"],
        category=category,
        trip_id=trip_id,
    )

    return Response(
        content=content,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=expenses.pdf"},
    )


@router.get("/drivers/export/pdf")
def export_drivers_pdf(
    filters: dict = Depends(common_report_filters),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    content = export_driver_pdf(
        db=db,
        driver_id=filters["driver_id"],
        status=filters["status"],
    )

    return Response(
        content=content,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=drivers.pdf"},
    )


@router.get("/trips/export/pdf")
def export_trips_pdf(
    filters: dict = Depends(common_report_filters),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    content = export_trip_pdf(
        db=db,
        car_id=filters["car_id"],
        driver_id=filters["driver_id"],
        status=filters["status"],
    )

    return Response(
        content=content,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=trips.pdf"},
    )


@router.get("/documents/export/pdf")
def export_documents_pdf(
    filters: dict = Depends(common_report_filters),
    document_type: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    content = export_document_pdf(
        db=db,
        car_id=filters["car_id"],
        document_type=document_type,
        status=filters["status"],
    )

    return Response(
        content=content,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=documents.pdf"},
    )


@router.get("/vehicle-cost/export/pdf")
def export_vehicle_cost_pdf_route(
    filters: dict = Depends(common_report_filters),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    content = export_vehicle_cost_pdf(
        db=db,
        car_id=filters["car_id"],
        from_date=filters["from_date"],
        to_date=filters["to_date"],
    )

    return Response(
        content=content,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=vehicle_cost.pdf"},
    )

