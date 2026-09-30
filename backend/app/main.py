from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
# from app.db.base import Base
# from app.db.session import engine
from app.models import user
from app.routes.auth import router as auth_router
from app.routes.user import router as user_router
from app.routes.car import router as car_router
from app.routes.service import router as services_router
from app.routes.expenses import router as expense_router
from app.routes.fuel import router as fuel_router
from app.routes.vehicle_documents import router as vehicle_documents 
from app.routes.drivers import router as drivers
from app.routes.driver_vehicle_assignments import router as driver_vehicle_assignments
from app.models import car, expenses, service



# Base.metadata.create_all(bind=engine)

app = FastAPI()

app.mount(
    "/uploads",
    StaticFiles(directory="uploads"),
    name="uploads",
)

app.include_router(auth_router)
app.include_router(user_router)
app.include_router(car_router)
app.include_router(services_router)
app.include_router(expense_router)
app.include_router(fuel_router)
app.include_router(vehicle_documents)
app.include_router(drivers)
app.include_router(driver_vehicle_assignments)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
