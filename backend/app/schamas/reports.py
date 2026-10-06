from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class ReportFilter(BaseModel):
    from_date: Optional[date] = None
    to_date: Optional[date] = None

    car_id: Optional[int] = None
    driver_id: Optional[int] = None

    status: Optional[str] = None

    page: int = 1
    page_size: int = 50


class ReportPagination(BaseModel):
    page: int
    page_size: int
    total_records: int
    total_pages: int


class VehicleReportItem(BaseModel):
    id: int

    registration_number: str
    brand: str
    model: str
    fuel_type: str
    year: int
    color: Optional[str] = None
    status: str

    owner_id: int
    owner_name: Optional[str] = None
    owner_email: Optional[str] = None
    owner_phone: Optional[str] = None

    total_services: int = 0
    total_fuel_records: int = 0
    total_expenses: float = 0
    total_trips: int = 0

    model_config = ConfigDict(from_attributes=True)


class VehicleReportResponse(BaseModel):
    data: list[VehicleReportItem]
    pagination: ReportPagination


class ServiceReportItem(BaseModel):
    id: int

    car_id: int
    registration_number: str
    brand: str
    model: str

    service_type: str
    service_date: date
    odometer_reading: Optional[int] = None
    service_center: Optional[str] = None
    cost: float = 0
    next_service_due: Optional[date] = None
    status: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ServiceReportResponse(BaseModel):
    data: list[ServiceReportItem]
    pagination: ReportPagination


class FuelReportItem(BaseModel):
    id: int

    car_id: int
    registration_number: str
    brand: str
    model: str

    fuel_date: date
    odometer_reading: Optional[int] = None
    fuel_type: str

    litres: float
    price_per_litre: float
    total_cost: float

    fuel_station: Optional[str] = None
    notes: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class FuelReportResponse(BaseModel):
    data: list[FuelReportItem]
    pagination: ReportPagination


class ExpenseReportItem(BaseModel):
    id: int

    car_id: int
    registration_number: str
    brand: str
    model: str

    driver_id: Optional[int] = None
    driver_name: Optional[str] = None
    driver_phone: Optional[str] = None

    trip_id: Optional[int] = None
    trip_status: Optional[str] = None

    expense_date: date
    category: str
    amount: float

    description: Optional[str] = None
    vendor: Optional[str] = None
    payment_method: Optional[str] = None
    receipt_number: Optional[str] = None
    notes: Optional[str] = None

    status: str

    model_config = ConfigDict(from_attributes=True)


class ExpenseReportResponse(BaseModel):
    data: list[ExpenseReportItem]
    pagination: ReportPagination


class DriverReportItem(BaseModel):
    id: int

    name: str
    email: Optional[str] = None
    phone: str

    license_number: str
    license_issue_date: Optional[date] = None
    license_expiry_date: Optional[date] = None

    address: Optional[str] = None

    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None

    joining_date: Optional[date] = None
    status: str
    notes: Optional[str] = None

    total_trips: int = 0
    total_expenses: float = 0

    model_config = ConfigDict(from_attributes=True)


class DriverReportResponse(BaseModel):
    data: list[DriverReportItem]
    pagination: ReportPagination


class TripReportItem(BaseModel):
    id: int

    car_id: int
    registration_number: str
    brand: str
    model: str

    driver_id: int
    driver_name: str
    driver_phone: str

    start_location: str
    destination: str

    start_datetime: datetime
    end_datetime: Optional[datetime] = None

    start_odometer: Optional[float] = None
    end_odometer: Optional[float] = None

    distance: Optional[float] = None

    purpose: Optional[str] = None
    status: str
    notes: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class TripReportResponse(BaseModel):
    data: list[TripReportItem]
    pagination: ReportPagination


class DocumentReportItem(BaseModel):
    id: int

    car_id: int
    registration_number: str
    brand: str
    model: str

    document_type: str
    document_number: Optional[str] = None

    issue_date: Optional[date] = None
    expiry_date: Optional[date] = None

    file_path: Optional[str] = None
    notes: Optional[str] = None

    status: str

    days_to_expiry: Optional[int] = None
    expiry_status: str

    is_insurance: bool = False

    model_config = ConfigDict(from_attributes=True)


class DocumentReportResponse(BaseModel):
    data: list[DocumentReportItem]
    pagination: ReportPagination


class CombinedVehicleCostItem(BaseModel):
    car_id: int
    registration_number: str
    brand: str
    model: str

    service_cost: float = 0
    fuel_cost: float = 0
    expense_cost: float = 0

    total_cost: float = 0

    model_config = ConfigDict(from_attributes=True)


class CombinedVehicleCostResponse(BaseModel):
    data: list[CombinedVehicleCostItem]
    pagination: ReportPagination


class DashboardSummary(BaseModel):
    total_vehicles: int = 0
    total_services: int = 0
    total_fuel_records: int = 0
    total_expenses: int = 0
    total_drivers: int = 0
    total_trips: int = 0
    total_documents: int = 0

    service_cost: float = 0
    fuel_cost: float = 0
    expense_cost: float = 0
    total_vehicle_cost: float = 0


class DashboardSummaryResponse(BaseModel):
    summary: DashboardSummary


class CommonReportFilters(BaseModel):
    from_date: Optional[date] = None
    to_date: Optional[date] = None

    car_id: Optional[int] = None
    driver_id: Optional[int] = None

    status: Optional[str] = None

    page: int = 1
    page_size: int = 50


class ReportDownloadHistoryItem(BaseModel):

    id: int

    user_id: int

    report_type: str

    export_format: str

    file_name: str

    filters: Optional[dict] = None

    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ReportDownloadHistoryResponse(BaseModel):

    data: list[ReportDownloadHistoryItem]

    pagination: ReportPagination
