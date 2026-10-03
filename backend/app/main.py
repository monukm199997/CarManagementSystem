import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.db.session import get_db

from app.routes.auth import router as auth_router
from app.routes.user import router as user_router
from app.routes.car import router as car_router
from app.routes.service import router as services_router
from app.routes.fuel import router as fuel_router
from app.routes.vehicle_documents import router as vehicle_documents
from app.routes.drivers import router as drivers
from app.routes.driver_vehicle_assignments import router as driver_vehicle_assignments
from app.routes.trips import router as trips
from app.routes.expenses import router as expenses
from app.routes.notifications import router as notifications

from app.services.document_expiry_alert import (
    generate_document_expiry_notifications,
)
from app.services.driver_license_expiry_alert import (
    generate_driver_license_expiry_notifications,
)
from app.services.service_due_alert import (
    generate_service_due_notifications,
)
from app.services.insurance_expiry_alert import (
    generate_insurance_expiry_notifications,
)

# =========================================================
# DOCUMENT EXPIRY SCHEDULER
# =========================================================

DOCUMENT_EXPIRY_CHECK_INTERVAL = 24 * 60 * 60


def run_notification_expiry_checks():

    db_generator = get_db()
    db = next(db_generator)

    try:

        # =========================================
        # VEHICLE DOCUMENT EXPIRY
        # =========================================

        document_result = generate_document_expiry_notifications(db)

        print(
            "[Notification Scheduler] "
            f"Document expiry check completed: "
            f"{document_result}"
        )

        # =========================================
        # DRIVER LICENSE EXPIRY
        # =========================================

        license_result = generate_driver_license_expiry_notifications(db)

        print(
            "[Notification Scheduler] "
            f"Driver license expiry check completed: "
            f"{license_result}"
        )

        service_result = generate_service_due_notifications(db)

        print(
            "[Notification Scheduler] "
            f"Service due check completed: "
            f"{service_result}"
        )

        insurance_result = generate_insurance_expiry_notifications(db)

        print(
            "[Notification Scheduler] "
            f"Insurance expiry check completed: "
            f"{insurance_result}"
        )

    except Exception as error:

        db.rollback()

        print(
            "[Notification Scheduler] " f"Expiry notification check failed: " f"{error}"
        )

    finally:

        db.close()

        try:
            db_generator.close()
        except Exception:
            pass


async def document_expiry_scheduler():
    """
    Run document expiry check immediately on startup
    and then once every 24 hours.
    """

    while True:

        try:

            await asyncio.to_thread(run_notification_expiry_checks)

        except asyncio.CancelledError:

            print("[Notification Scheduler] " "Scheduler stopped.")

            raise

        except Exception as error:

            print("[Notification Scheduler] " f"Unexpected scheduler error: {error}")

        await asyncio.sleep(DOCUMENT_EXPIRY_CHECK_INTERVAL)


# =========================================================
# FASTAPI LIFESPAN
# =========================================================


@asynccontextmanager
async def lifespan(app: FastAPI):

    print("[Notification Scheduler] " "Starting document expiry scheduler...")

    scheduler_task = asyncio.create_task(document_expiry_scheduler())

    try:

        yield

    finally:

        print("[Notification Scheduler] " "Stopping document expiry scheduler...")

        scheduler_task.cancel()

        try:

            await scheduler_task

        except asyncio.CancelledError:

            pass


# =========================================================
# FASTAPI APP
# =========================================================

app = FastAPI(lifespan=lifespan)


# =========================================================
# STATIC FILES
# =========================================================

app.mount(
    "/uploads",
    StaticFiles(directory="uploads"),
    name="uploads",
)


# =========================================================
# ROUTERS
# =========================================================

app.include_router(auth_router)
app.include_router(user_router)
app.include_router(car_router)
app.include_router(services_router)
app.include_router(fuel_router)
app.include_router(vehicle_documents)
app.include_router(drivers)
app.include_router(driver_vehicle_assignments)
app.include_router(trips)
app.include_router(expenses)
app.include_router(notifications)


# =========================================================
# CORS
# =========================================================

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
