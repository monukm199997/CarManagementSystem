from fastapi import FastAPI
from app.db.base import Base
from app.db.session import engine
from app.models import expenses,user,service,car
from app.routes.auth import router as auth_router
from app.routes.user import router as user_router
from app.routes.car import router as car_router
from app.routes.service import router as services_router
from app.routes.expenses import router as expense_router



Base.metadata.create_all(bind=engine)

app = FastAPI()

app.include_router(auth_router)
app.include_router(user_router)
app.include_router(car_router)
app.include_router(services_router)
app.include_router(expense_router)

