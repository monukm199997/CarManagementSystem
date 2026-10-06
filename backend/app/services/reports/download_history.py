from sqlalchemy.orm import Session

from app.models.report_download_history import (
    ReportDownloadHistory,
)


def record_download_history(
    db: Session,
    user_id: int,
    report_type: str,
    export_format: str,
    file_name: str,
    filters: dict | None = None,
):
    history = ReportDownloadHistory(
        user_id=user_id,
        report_type=report_type,
        export_format=export_format,
        file_name=file_name,
        filters=filters,
    )

    db.add(history)
    db.commit()
    db.refresh(history)

    return history


def get_download_history(
    db: Session,
    user_id: int,
    report_type: str | None = None,
    export_format: str | None = None,
    page: int = 1,
    page_size: int = 50,
):
    query = db.query(ReportDownloadHistory).filter(
        ReportDownloadHistory.user_id == user_id
    )

    if report_type:
        query = query.filter(ReportDownloadHistory.report_type == report_type)

    if export_format:
        query = query.filter(ReportDownloadHistory.export_format == export_format)

    total_records = query.count()

    offset = (page - 1) * page_size

    rows = (
        query.order_by(
            ReportDownloadHistory.created_at.desc(),
            ReportDownloadHistory.id.desc(),
        )
        .offset(offset)
        .limit(page_size)
        .all()
    )

    total_pages = (
        (total_records + page_size - 1) // page_size if total_records > 0 else 0
    )

    return {
        "data": rows,
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total_records": total_records,
            "total_pages": total_pages,
        },
    }


from datetime import date, datetime


def normalize_filters(
    filters: dict | None,
):
    if not filters:
        return {}

    normalized = {}

    for key, value in filters.items():

        if isinstance(
            value,
            (date, datetime),
        ):
            normalized[key] = value.isoformat()

        else:
            normalized[key] = value

    return normalized