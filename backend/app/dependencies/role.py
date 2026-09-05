from fastapi import Depends, HTTPException, status
from backend.app.dependencies.auth import get_current_user
from typing import Callable

def require_roles(*allowed_roles:str)-> Callable:
    def role_checker(current_user = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission"
            )
        return current_user
    return role_checker