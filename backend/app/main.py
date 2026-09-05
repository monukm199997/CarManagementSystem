from fastapi import FastAPI
from backend.app.db.base import Base
from backend.app.db.session import engine
from backend.app.models import user
from backend.app.routes.auth import router as auth_router
from backend.app.routes.user import router as user_router
from backend.app.routes.car import router as car_router
from backend.app.routes.service import router as services_router
from backend.app.routes.expenses import router as expense_router
from backend.app.models import car, expenses, service



Base.metadata.create_all(bind=engine)

app = FastAPI()

app.include_router(auth_router)
app.include_router(user_router)
app.include_router(car_router)
app.include_router(services_router)
app.include_router(expense_router)

