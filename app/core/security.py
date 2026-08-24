from datetime import timedelta,datetime
from jose import jwt
from passlib.context import CryptContext
from app.core.config import SECRET_KEY, ALGORITHM


pwd_context = CryptContext(schemes=["argon2"], deprecated = "auto")

def hash_password(password:str):
    return pwd_context.hash(password)


def verify_password(password:str, hashed:str):
    return pwd_context.verify(password, hashed)


def create_access_token(data:dict, expires_delta:timedelta):
    to_encode = data.copy()
    expire = datetime.utcnow() + expires_delta
    to_encode.update({"expire":expire.timestamp()})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
