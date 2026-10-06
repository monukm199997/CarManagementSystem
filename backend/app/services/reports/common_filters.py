from datetime import date
from fastapi import Query
from fastapi import HTTPException


def validate_report_date_range(
    from_date: date | None = None,
    to_date: date | None = None,
):
    if from_date is not None and to_date is not None:
        if from_date > to_date:
            raise HTTPException(
                status_code=400,
                detail="from_date cannot be greater than to_date",
            )


def normalize_report_pagination(
    page: int = 1,
    page_size: int = 50,
):
    if page < 1:
        raise HTTPException(
            status_code=400,
            detail="page must be greater than or equal to 1",
        )

    if page_size < 1 or page_size > 500:
        raise HTTPException(
            status_code=400,
            detail="page_size must be between 1 and 500",
        )

    return {
        "page": page,
        "page_size": page_size,
    }


def common_report_filters(
    from_date: date | None = Query(default=None),
    to_date: date | None = Query(default=None),
    car_id: int | None = Query(default=None, ge=1),
    driver_id: int | None = Query(default=None, ge=1),
    status: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(
        default=50,
        ge=1,
        le=500,
    ),
):
    validate_report_date_range(
        from_date=from_date,
        to_date=to_date,
    )

    return {
        "from_date": from_date,
        "to_date": to_date,
        "car_id": car_id,
        "driver_id": driver_id,
        "status": status,
        "page": page,
        "page_size": page_size,
    }
