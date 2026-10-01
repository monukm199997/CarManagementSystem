/* =========================================
   TRIP DETAILS
========================================= */

let currentTrip = null;
let currentDriver = null;
let currentCar = null;


/* =========================================
   INIT
========================================= */

document.addEventListener("DOMContentLoaded", async () => {

    const params = new URLSearchParams(
        window.location.search
    );

    const tripId = params.get("trip_id");

    if (!tripId) {

        showTripError(
            "Trip ID is missing."
        );

        return;
    }

    await loadTripDetails(tripId);

});


/* =========================================
   LOAD TRIP
========================================= */

async function loadTripDetails(tripId) {

    try {

        showTripLoading();

        currentTrip =
            await apiRequest(
                `/trips/${tripId}`
            );


        /*
         * Load driver and car separately
         * because TripOut currently returns
         * driver_id and car_id.
         */

        const driverPromise =
            apiRequest(
                `/drivers/${currentTrip.driver_id}`
            );

        const carPromise =
            apiRequest(
                `/cars/${currentTrip.car_id}`
            );


        const results =
            await Promise.allSettled([
                driverPromise,
                carPromise
            ]);


        if (
            results[0].status === "fulfilled"
        ) {
            currentDriver =
                results[0].value;
        }


        if (
            results[1].status === "fulfilled"
        ) {
            currentCar =
                results[1].value;
        }


        renderTripDetails();

        hideTripLoading();

    } catch (error) {

        console.error(
            "Failed to load trip details:",
            error
        );

        showTripError(
            error.message ||
            "Failed to load trip details."
        );

    }

}


/* =========================================
   RENDER
========================================= */

function renderTripDetails() {

    const trip = currentTrip;

    if (!trip) {
        return;
    }


    /* =========================
       Header Status
    ========================= */

    document.getElementById(
        "tripStatusBadge"
    ).innerHTML = createStatusBadge(
        trip.status
    );


    /* =========================
       Overview
    ========================= */

    document.getElementById(
        "tripIdValue"
    ).textContent =
        `#${trip.id}`;


    document.getElementById(
        "tripStatusValue"
    ).innerHTML =
        createStatusBadge(
            trip.status
        );


    document.getElementById(
        "startLocationValue"
    ).textContent =
        trip.start_location || "-";


    document.getElementById(
        "destinationValue"
    ).textContent =
        trip.destination || "-";


    document.getElementById(
        "startDatetimeValue"
    ).textContent =
        formatTripDateTime(
            trip.start_datetime
        );


    document.getElementById(
        "endDatetimeValue"
    ).textContent =
        formatTripDateTime(
            trip.end_datetime
        );


    /* =========================
       Driver
    ========================= */

    document.getElementById(
        "driverNameValue"
    ).textContent =
        currentDriver?.name ||
        `Driver #${trip.driver_id}`;


    document.getElementById(
        "driverPhoneValue"
    ).textContent =
        currentDriver?.phone ||
        "-";


    /* =========================
       Car
    ========================= */

    document.getElementById(
        "carNameValue"
    ).textContent =
        currentCar?.registration_number ||
        `Car #${trip.car_id}`;


    const carInfo = [
        currentCar?.brand,
        currentCar?.model
    ]
        .filter(Boolean)
        .join(" ");

    document.getElementById(
        "carInfoValue"
    ).textContent =
        carInfo || "-";


    /* =========================
       Odometer
    ========================= */

    document.getElementById(
        "startOdometerValue"
    ).textContent =
        formatOdometer(
            trip.start_odometer
        );


    document.getElementById(
        "endOdometerValue"
    ).textContent =
        formatOdometer(
            trip.end_odometer
        );


    document.getElementById(
        "distanceValue"
    ).textContent =
        calculateDistance(
            trip.start_odometer,
            trip.end_odometer
        );


    /* =========================
       Purpose / Notes
    ========================= */

    document.getElementById(
        "purposeValue"
    ).textContent =
        trip.purpose || "-";


    document.getElementById(
        "notesValue"
    ).textContent =
        trip.notes || "No notes available.";


    /* =========================
       System
    ========================= */

    document.getElementById(
        "createdAtValue"
    ).textContent =
        formatTripDateTime(
            trip.created_at
        );


    /* =========================
       Actions
    ========================= */

    renderTripActions();


    document.getElementById(
        "tripDetailsSection"
    ).classList.remove("d-none");

}


/* =========================================
   ACTIONS
========================================= */

function renderTripActions() {

    const container =
        document.getElementById(
            "tripActions"
        );

    const trip =
        currentTrip;


    let html = "";


    /* =====================================
       EDIT
    ===================================== */

    if (
        trip.status !== "completed" &&
        trip.status !== "cancelled"
    ) {

        html += `
            <button
                type="button"
                class="btn btn-primary"
                onclick="editCurrentTrip()"
            >
                Edit Trip
            </button>
        `;

    }


    /* =====================================
       PLANNED
    ===================================== */

    if (
        trip.status === "planned"
    ) {

        html += `
            <button
                type="button"
                class="btn btn-warning"
                onclick="openStatusModal('ongoing')"
            >
                ▶ Start Trip
            </button>

            <button
                type="button"
                class="btn btn-outline-danger"
                onclick="openStatusModal('cancelled')"
            >
                Cancel Trip
            </button>
        `;

    }


    /* =====================================
       ONGOING
    ===================================== */

    if (
        trip.status === "ongoing"
    ) {

        html += `
            <button
                type="button"
                class="btn btn-success"
                onclick="openStatusModal('completed')"
            >
                ✓ Complete Trip
            </button>

            <button
                type="button"
                class="btn btn-outline-danger"
                onclick="openStatusModal('cancelled')"
            >
                Cancel Trip
            </button>
        `;

    }


    /* =====================================
       COMPLETED
    ===================================== */

    if (
        trip.status === "completed"
    ) {

        html += `
            <span class="text-success fw-semibold">
                ✓ Trip Completed
            </span>
        `;

    }


    /* =====================================
       CANCELLED
    ===================================== */

    if (
        trip.status === "cancelled"
    ) {

        html += `
            <span class="text-danger fw-semibold">
                ✕ Trip Cancelled
            </span>
        `;

    }


    container.innerHTML =
        html;

}

/* =========================================
   EDIT
========================================= */

function editCurrentTrip() {

    if (!currentTrip) {
        return;
    }


    window.location.href =
        `/frontend/trips/trips.html?edit_trip=${currentTrip.id}`;

}


/* =========================================
   CHANGE STATUS
========================================= */

/* =========================================
   STATUS MODAL
========================================= */

let pendingStatus = null;


/* =========================================
   OPEN STATUS MODAL
========================================= */

function openStatusModal(status) {

    if (!currentTrip) {
        return;
    }


    pendingStatus = status;


    const modal =
        document.getElementById(
            "tripStatusModal"
        );

    const title =
        document.getElementById(
            "statusModalTitle"
        );

    const description =
        document.getElementById(
            "statusModalDescription"
        );

    const preview =
        document.getElementById(
            "newStatusPreview"
        );

    const completionFields =
        document.getElementById(
            "completionFields"
        );

    const cancelWarning =
        document.getElementById(
            "cancelWarning"
        );

    const confirmButton =
        document.getElementById(
            "statusModalConfirmButton"
        );


    /* Reset */

    completionFields.classList.add(
        "hidden"
    );

    cancelWarning.classList.add(
        "hidden"
    );

    hideStatusModalError();


    /* =====================================
       ONGOING
    ===================================== */

    if (status === "ongoing") {

        title.textContent =
            "Start Trip";

        description.textContent =
            "Start this planned trip.";

        confirmButton.textContent =
            "Start Trip";

        confirmButton.className =
            "btn btn-warning";

    }


    /* =====================================
       COMPLETED
    ===================================== */

    else if (status === "completed") {

        title.textContent =
            "Complete Trip";

        description.textContent =
            "Enter the final trip information.";

        confirmButton.textContent =
            "Complete Trip";

        confirmButton.className =
            "btn btn-success";


        completionFields.classList.remove(
            "hidden"
        );


        /*
         * Default end datetime = current time
         */

        const now =
            new Date();

        const year =
            now.getFullYear();

        const month =
            String(
                now.getMonth() + 1
            ).padStart(2, "0");

        const day =
            String(
                now.getDate()
            ).padStart(2, "0");

        const hours =
            String(
                now.getHours()
            ).padStart(2, "0");

        const minutes =
            String(
                now.getMinutes()
            ).padStart(2, "0");


        document.getElementById(
            "completionDatetime"
        ).value =
            `${year}-${month}-${day}T${hours}:${minutes}`;


        document.getElementById(
            "completionOdometer"
        ).value = "";

    }


    /* =====================================
       CANCELLED
    ===================================== */

    else if (status === "cancelled") {

        title.textContent =
            "Cancel Trip";

        description.textContent =
            "This will mark the trip as cancelled.";

        confirmButton.textContent =
            "Cancel Trip";

        confirmButton.className =
            "btn btn-danger";


        cancelWarning.classList.remove(
            "hidden"
        );

    }


    preview.innerHTML =
        createStatusBadge(status);


    modal.classList.remove(
        "hidden"
    );

}


/* =========================================
   CLOSE MODAL
========================================= */

function closeStatusModal() {

    const modal =
        document.getElementById(
            "tripStatusModal"
        );

    modal.classList.add(
        "hidden"
    );

    pendingStatus = null;

    hideStatusModalError();

}


/* =========================================
   CONFIRM STATUS
========================================= */

async function confirmStatusChange() {

    if (
        !currentTrip ||
        !pendingStatus
    ) {
        return;
    }


    const confirmButton =
        document.getElementById(
            "statusModalConfirmButton"
        );


    hideStatusModalError();


    try {

        confirmButton.disabled = true;

        confirmButton.textContent =
            "Processing...";


        /* =====================================
           ONGOING
        ===================================== */

        if (
            pendingStatus === "ongoing"
        ) {

            await apiRequest(
                `/trips/${currentTrip.id}/status?trip_status=ongoing`,
                {
                    method: "PATCH"
                }
            );

        }


        /* =====================================
           COMPLETED
        ===================================== */

        else if (
            pendingStatus === "completed"
        ) {

            const endDatetime =
                document.getElementById(
                    "completionDatetime"
                ).value;

            const endOdometer =
                document.getElementById(
                    "completionOdometer"
                ).value;


            if (!endDatetime) {

                throw new Error(
                    "End date & time is required."
                );

            }


            if (
                !endOdometer ||
                Number(endOdometer) < 0
            ) {

                throw new Error(
                    "Valid end odometer is required."
                );

            }


            /*
             * First save end information
             */

            await apiRequest(
                `/trips/${currentTrip.id}`,
                {
                    method: "PUT",

                    body: JSON.stringify({

                        end_datetime:
                            convertLocalDateTime(
                                endDatetime
                            ),

                        end_odometer:
                            Number(
                                endOdometer
                            )

                    })
                }
            );


            /*
             * Then mark completed
             */

            await apiRequest(
                `/trips/${currentTrip.id}/status?trip_status=completed`,
                {
                    method: "PATCH"
                }
            );

        }


        /* =====================================
           CANCELLED
        ===================================== */

        else if (
            pendingStatus === "cancelled"
        ) {

            await apiRequest(
                `/trips/${currentTrip.id}`,
                {
                    method: "DELETE"
                }
            );

        }


        /* =====================================
           SUCCESS
        ===================================== */

        const updatedTripId =
            currentTrip.id;


        closeStatusModal();


        await loadTripDetails(
            updatedTripId
        );


    } catch (error) {

        console.error(
            "Trip status update failed:",
            error
        );


        showStatusModalError(
            error.message ||
            "Failed to update trip status."
        );


    } finally {

        confirmButton.disabled = false;

        if (
            pendingStatus === "ongoing"
        ) {

            confirmButton.textContent =
                "Start Trip";

        } else if (
            pendingStatus === "completed"
        ) {

            confirmButton.textContent =
                "Complete Trip";

        } else {

            confirmButton.textContent =
                "Cancel Trip";

        }

    }

}


/* =========================================
   ERROR
========================================= */

function showStatusModalError(message) {

    const errorBox =
        document.getElementById(
            "statusModalError"
        );

    errorBox.textContent =
        message;

    errorBox.classList.remove(
        "hidden"
    );

}


function hideStatusModalError() {

    const errorBox =
        document.getElementById(
            "statusModalError"
        );

    errorBox.textContent = "";

    errorBox.classList.add(
        "hidden"
    );

}


/* =========================================
   DATETIME
========================================= */

function convertLocalDateTime(value) {

    if (!value) {
        return null;
    }

    return value.length === 16
        ? `${value}:00`
        : value;

}

/* =========================================
   STATUS BADGE
========================================= */

function createStatusBadge(status) {

    const safeStatus =
        status || "unknown";

    return `
        <span
            class="trip-details-status ${safeStatus}"
        >
            ${escapeHtml(safeStatus)}
        </span>
    `;

}


/* =========================================
   DISTANCE
========================================= */

function calculateDistance(
    startOdometer,
    endOdometer
) {

    if (
        startOdometer === null ||
        startOdometer === undefined ||
        endOdometer === null ||
        endOdometer === undefined
    ) {

        return "-";

    }


    const distance =
        Number(endOdometer) -
        Number(startOdometer);


    if (distance < 0) {
        return "-";
    }


    return `${distance.toFixed(1)} km`;

}


/* =========================================
   ODOMETER
========================================= */

function formatOdometer(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "-";
    }


    return `${Number(value).toLocaleString("en-IN")} km`;

}


/* =========================================
   DATE
========================================= */

function formatTripDateTime(value) {

    if (!value) {
        return "-";
    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return value;

    }


    return date.toLocaleString(
        "en-IN",
        {
            dateStyle: "medium",
            timeStyle: "short"
        }
    );

}


/* =========================================
   LOADING
========================================= */

function showTripLoading() {

    document.getElementById(
        "loadingSection"
    ).classList.remove("d-none");

    document.getElementById(
        "tripDetailsSection"
    ).classList.add("d-none");

}


/* =========================================
   ERROR
========================================= */

function showTripError(message) {

    document.getElementById(
        "loadingSection"
    ).classList.add("d-none");

    const errorSection =
        document.getElementById(
            "errorSection"
        );

    errorSection.textContent =
        message;

    errorSection.classList.remove(
        "d-none"
    );

}


/* =========================================
   HIDE LOADING
========================================= */

function hideTripLoading() {

    document.getElementById(
        "loadingSection"
    ).classList.add("d-none");

}


/* =========================================
   ESCAPE HTML
========================================= */

function escapeHtml(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }


    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}