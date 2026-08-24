from pydantic import BaseModel, EmailStr
from typing import Optional


class UserCreate(BaseModel):
    name:str
    email:EmailStr
    password:str
    role:str = "customer"

class UserOut(BaseModel):
    id:int
    name:str
    email:EmailStr
    phone:Optional[str] = None
    role:str

class UserUpdate(BaseModel):
    name:str = None
    phone:str = None
    is_active:bool = None


    class Config:
        from_attributes = True
        