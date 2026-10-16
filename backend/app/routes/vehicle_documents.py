from datetime import date, timedelta
import uuid
from pathlib import Path

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    UploadFile,
    File,
    status,
)
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.vehicle_document import VehicleDocument
from app.models.car import Car
from app.schamas.vehicle_document import (
    VehicleDocumentCreate,
    VehicleDocumentUpdate,
    VehicleDocumentOut,
)
from app.dependencies.role import require_roles
from app.core.roles import SUPER_ADMIN, ADMIN, MANAGER, STAFF, CUSTOMER
from app.dependencies.ownership import check_car_access
from app.utils.helpers import ensure_company_access

router = APIRouter(
    prefix="/vehicle-documents",
    tags=["Vehicle Documents"],
)


# =====================================================
# COMPANY-SCOPED ACCESS HELPERS
# =====================================================
def get_company_car_or_404(
    db: Session,
    car_id: int,
    company_id: int,
):
    car = (
        db.query(Car)
        .filter(
            Car.id == car_id,
            Car.company_id == company_id,
        )
        .first()
    )
    if not car:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Car not found.",
        )
    return car


def get_company_document_or_404(
    db: Session,
    document_id: int,
    company_id: int,
):
    document = (
        db.query(VehicleDocument)
        .join(Car, Car.id == VehicleDocument.car_id)
        .filter(
            VehicleDocument.id == document_id,
            Car.company_id == company_id,
        )
        .first()
    )
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle document not found.",
        )
    return document


def ensure_customer_car_access(car: Car, current_user):
    # Keep the existing per-user ownership rule for customers.
    check_car_access(car, current_user)


# =====================================================
# CREATE DOCUMENT
# =====================================================
@router.post(
    "/", response_model=VehicleDocumentOut, status_code=status.HTTP_201_CREATED
)
def create_vehicle_document(
    payload: VehicleDocumentCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(SUPER_ADMIN, ADMIN, MANAGER, STAFF)),
):
    company_id = ensure_company_access(current_user)
    car = get_company_car_or_404(db, payload.car_id, company_id)
    ensure_customer_car_access(car, current_user)

    document = VehicleDocument(
        car_id=car.id,
        document_type=payload.document_type,
        document_number=payload.document_number,
        issue_date=payload.issue_date,
        expiry_date=payload.expiry_date,
        file_path=payload.file_path,
        notes=payload.notes,
        status="active",
    )
    db.add(document)
    db.commit()
    db.refresh(document)
    return document


# =====================================================
# GET ALL DOCUMENTS
# =====================================================
@router.get("/", response_model=list[VehicleDocumentOut])
def get_vehicle_documents(
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(SUPER_ADMIN, ADMIN, MANAGER, STAFF, CUSTOMER)),
):
    company_id = ensure_company_access(current_user)
    documents = (
        db.query(VehicleDocument)
        .join(Car, Car.id == VehicleDocument.car_id)
        .filter(Car.company_id == company_id)
        .order_by(VehicleDocument.expiry_date.asc().nullslast())
        .all()
    )

    result = []
    for document in documents:
        car = get_company_car_or_404(db, document.car_id, company_id)
        try:
            check_car_access(car, current_user)
        except HTTPException:
            continue
        result.append(document)
    return result


# =====================================================
# EXPIRED DOCUMENTS
# =====================================================
@router.get("/expiry/expired")
def get_expired_documents(
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(SUPER_ADMIN, ADMIN, MANAGER, STAFF, CUSTOMER)),
):
    company_id = ensure_company_access(current_user)
    today = date.today()
    documents = (
        db.query(VehicleDocument)
        .join(Car, Car.id == VehicleDocument.car_id)
        .filter(
            Car.company_id == company_id,
            VehicleDocument.expiry_date.isnot(None),
            VehicleDocument.expiry_date < today,
            VehicleDocument.status == "active",
        )
        .order_by(VehicleDocument.expiry_date.asc())
        .all()
    )

    result = []
    for document in documents:
        car = get_company_car_or_404(db, document.car_id, company_id)
        try:
            check_car_access(car, current_user)
        except HTTPException:
            continue
        result.append(
            {
                "id": document.id,
                "car_id": document.car_id,
                "document_type": document.document_type,
                "document_number": document.document_number,
                "issue_date": document.issue_date,
                "expiry_date": document.expiry_date,
                "file_path": document.file_path,
                "notes": document.notes,
                "status": document.status,
                "expiry_status": "expired",
                "days_expired": (today - document.expiry_date).days,
                "created_at": document.created_at,
            }
        )
    return result


# =====================================================
# UPCOMING DOCUMENT EXPIRY
# =====================================================
@router.get("/expiry/upcoming")
def get_upcoming_documents(
    days: int = 30,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(SUPER_ADMIN, ADMIN, MANAGER, STAFF, CUSTOMER)),
):
    if days < 1:
        raise HTTPException(
            status_code=400,
            detail="Days must be greater than 0",
        )

    company_id = ensure_company_access(current_user)
    today = date.today()
    end_date = today + timedelta(days=days)
    documents = (
        db.query(VehicleDocument)
        .join(Car, Car.id == VehicleDocument.car_id)
        .filter(
            Car.company_id == company_id,
            VehicleDocument.expiry_date.isnot(None),
            VehicleDocument.expiry_date >= today,
            VehicleDocument.expiry_date <= end_date,
            VehicleDocument.status == "active",
        )
        .order_by(VehicleDocument.expiry_date.asc())
        .all()
    )

    result = []
    for document in documents:
        car = get_company_car_or_404(db, document.car_id, company_id)
        try:
            check_car_access(car, current_user)
        except HTTPException:
            continue
        result.append(
            {
                "id": document.id,
                "car_id": document.car_id,
                "document_type": document.document_type,
                "document_number": document.document_number,
                "issue_date": document.issue_date,
                "expiry_date": document.expiry_date,
                "file_path": document.file_path,
                "notes": document.notes,
                "status": document.status,
                "expiry_status": "expiring_soon",
                "days_remaining": (document.expiry_date - today).days,
                "created_at": document.created_at,
            }
        )
    return result

# =====================================================
# DOCUMENT ANALYTICS
# =====================================================
@router.get("/analytics")
def get_document_analytics(
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(SUPER_ADMIN, ADMIN, MANAGER, STAFF, CUSTOMER)),
):
    company_id = ensure_company_access(current_user)
    today = date.today()
    upcoming_date = today + timedelta(days=30)

    documents = (
        db.query(VehicleDocument)
        .join(Car, Car.id == VehicleDocument.car_id)
        .filter(Car.company_id == company_id)
        .all()
    )

    accessible_documents = []
    for document in documents:
        car = get_company_car_or_404(db, document.car_id, company_id)
        try:
            check_car_access(car, current_user)
        except HTTPException:
            continue
        accessible_documents.append(document)

    total_documents = len(accessible_documents)
    active_documents = 0
    inactive_documents = 0
    expired_documents = 0
    expiring_soon_documents = 0
    no_expiry_documents = 0
    document_type_counts = {}

    for document in accessible_documents:
        if document.status == "inactive":
            inactive_documents += 1
            continue

        if not document.expiry_date:
            no_expiry_documents += 1
            active_documents += 1
        elif document.expiry_date < today:
            expired_documents += 1
        elif document.expiry_date <= upcoming_date:
            expiring_soon_documents += 1
        else:
            active_documents += 1

        document_type = document.document_type or "Unknown"
        document_type_counts[document_type] = (
            document_type_counts.get(document_type, 0) + 1
        )

    by_document_type = [
        {"document_type": document_type, "count": count}
        for document_type, count in sorted(
            document_type_counts.items(),
            key=lambda item: item[1],
            reverse=True,
        )
    ]

    return {
        "summary": {
            "total_documents": total_documents,
            "active_documents": active_documents,
            "inactive_documents": inactive_documents,
            "expiring_soon_documents": expiring_soon_documents,
            "expired_documents": expired_documents,
            "no_expiry_documents": no_expiry_documents,
        },
        "by_document_type": by_document_type,
    }

# =====================================================
# GET DOCUMENT BY ID
# =====================================================
@router.get("/{document_id}", response_model=VehicleDocumentOut)
def get_vehicle_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(SUPER_ADMIN, ADMIN, MANAGER, STAFF, CUSTOMER)),
):
    company_id = ensure_company_access(current_user)
    document = get_company_document_or_404(db, document_id, company_id)
    car = get_company_car_or_404(db, document.car_id, company_id)
    check_car_access(car, current_user)
    return document

# =====================================================
# GET DOCUMENTS BY CAR
# =====================================================
@router.get("/car/{car_id}", response_model=list[VehicleDocumentOut])
def get_car_documents(
    car_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(SUPER_ADMIN, ADMIN, MANAGER, STAFF, CUSTOMER)),
):
    company_id = ensure_company_access(urrent_user)
    car = get_company_car_or_404(db, car_id, company_id)
    check_car_access(car, current_user)

    return (
        db.query(VehicleDocument)
        .filter(VehicleDocument.car_id == car.id)
        .order_by(VehicleDocument.expiry_date.asc().nullslast())
        .all()
    )


# =====================================================
# UPDATE DOCUMENT
# =====================================================
@router.put("/{document_id}", response_model=VehicleDocumentOut)
def update_vehicle_document(
    document_id: int,
    payload: VehicleDocumentUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(SUPER_ADMIN, ADMIN, MANAGER, STAFF)),
):
    company_id = ensure_company_access(current_user)
    document = get_company_document_or_404(db, document_id, company_id)
    car = get_company_car_or_404(db, document.car_id, company_id)
    check_car_access(car, current_user)

    update_data = payload.model_dump(exclude_unset=True)

    # If schema permits reassignment, the destination car must be in this company.
    if "car_id" in update_data:
        new_car = get_company_car_or_404(
            db,
            update_data["car_id"],
            company_id,
        )
        check_car_access(new_car, current_user)

    for field, value in update_data.items():
        setattr(document, field, value)

    db.commit()
    db.refresh(document)
    return document

# =====================================================
# DELETE DOCUMENT
# =====================================================
@router.delete("/{document_id}")
def delete_vehicle_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(SUPER_ADMIN, ADMIN, MANAGER, STAFF)),
):
    company_id = ensure_company_access(current_user)
    document = get_company_document_or_404(db, document_id, company_id)
    car = get_company_car_or_404(db, document.car_id, company_id)
    check_car_access(car, current_user)

    # Delete the stored file only if it resolves to a real file under backend uploads.
    if document.file_path:
        try:
            backend_dir = Path(__file__).resolve().parents[2]
            relative_path = document.file_path.lstrip("/")
            file_path = (backend_dir / relative_path).resolve()
            uploads_root = (backend_dir / "uploads").resolve()
            if (
                file_path.is_relative_to(uploads_root)
                and file_path.exists()
                and file_path.is_file()
            ):
                file_path.unlink()
        except OSError as error:
            print(f"Failed to delete document file: {error}")

    db.delete(document)
    db.commit()
    return {"message": "Vehicle document deleted successfully"}


# =====================================================
# UPLOAD DOCUMENT FILE
# =====================================================
@router.post("/{document_id}/upload", response_model=VehicleDocumentOut)
async def upload_vehicle_document(
    document_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(SUPER_ADMIN, ADMIN, MANAGER, STAFF)),
):
    company_id = ensure_company_access(current_user)
    document = get_company_document_or_404(db, document_id, company_id)
    car = get_company_car_or_404(db, document.car_id, company_id)
    check_car_access(car, current_user)

    allowed_extensions = {".pdf", ".jpg", ".jpeg", ".png", ".webp"}
    original_filename = file.filename or ""
    extension = Path(original_filename).suffix.lower()

    if extension not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Allowed files: PDF, JPG, JPEG, PNG, WEBP.",
        )

    allowed_content_types = {
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/webp",
    }
    if file.content_type not in allowed_content_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file content type.",
        )

    file_content = await file.read()
    if not file_content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty.",
        )

    max_file_size = 10 * 1024 * 1024
    if len(file_content) > max_file_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size cannot exceed 10 MB.",
        )

    backend_dir = Path(__file__).resolve().parents[2]
    upload_directory = backend_dir / "uploads" / "vehicle_documents"
    upload_directory.mkdir(parents=True, exist_ok=True)

    unique_filename = f"{document.id}_{uuid.uuid4().hex}{extension}"
    file_path = upload_directory / unique_filename

    with open(file_path, "wb") as buffer:
        buffer.write(file_content)

    old_file_path = document.file_path
    document.file_path = f"/uploads/vehicle_documents/{unique_filename}"

    try:
        db.commit()
        db.refresh(document)
    except Exception:
        db.rollback()
        try:
            file_path.unlink(missing_ok=True)
        except OSError:
            pass
        raise

    if old_file_path:
        try:
            old_path = (backend_dir / old_file_path.lstrip("/")).resolve()
            uploads_root = (backend_dir / "uploads").resolve()
            if (
                old_path.is_relative_to(uploads_root)
                and old_path != file_path.resolve()
                and old_path.exists()
                and old_path.is_file()
            ):
                old_path.unlink()
        except OSError as error:
            print(f"Failed to delete old document file: {error}")

    return document
