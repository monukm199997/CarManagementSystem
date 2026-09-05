from fastapi import HTTPException, status


def check_car_access(
    car,
    current_user,
):

    if current_user.role == "admin":
        return True

    if current_user.role in ["manager", "staff"]:
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