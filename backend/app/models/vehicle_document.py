from datetime import datetime
from sqlalchemy.orm import relationship

from sqlalchemy import (
    Column,
    Integer,
    String,
    Date,
    Text,
    DateTime,
    ForeignKey,
    Index,
)

from app.db.base import Base


class VehicleDocument(Base):

    __tablename__ = "vehicle_documents"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    car_id = Column(
        Integer,
        ForeignKey(
            "cars.id",
            ondelete="CASCADE"
        ),
        nullable=False,
        index=True
    )

    document_type = Column(
        String(50),
        nullable=False,
        index=True
    )

    document_number = Column(
        String(100),
        nullable=True
    )

    issue_date = Column(
        Date,
        nullable=True
    )

    expiry_date = Column(
        Date,
        nullable=True,
        index=True
    )

    file_path = Column(
        String(500),
        nullable=True
    )

    notes = Column(
        Text,
        nullable=True
    )

    status = Column(
        String(30),
        nullable=False,
        default="active"
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )


Index(
    "ix_vehicle_documents_car_type",
    VehicleDocument.car_id,
    VehicleDocument.document_type
)
