from pydantic import BaseModel, EmailStr, Field
from typing import Optional


class UserCreate(BaseModel):
    name:str
    email:EmailStr
    phone:str 
    password: str = Field(min_length=8)

class UserOut(BaseModel):
    id:int
    name:str
    email:EmailStr
    phone:Optional[str] = None
    role:str
    is_active:bool = None

class UserUpdate(BaseModel):
    name:str = None
    phone:str = None
    is_active:bool = None


    class Config:
        from_attributes = True
        