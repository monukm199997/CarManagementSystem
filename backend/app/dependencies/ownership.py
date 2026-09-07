from fastapi import HTTPException, status

from app.core.roles import ADMIN, SUPER_ADMIN, MANAGER, STAFF


def check_car_access(car, current_user):
  
    if current_user.role in {ADMIN, SUPER_ADMIN}:
        return True

    if current_user.role in {MANAGER, STAFF}:
        return True

    if (
        current_user.role == "customer"
        and car.owner_id == current_user.id
    ):
        return True

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You are not authorized to access this car",
    )