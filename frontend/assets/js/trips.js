/* =========================================
   TRIPS PAGE
========================================= */

let allTrips = [];
let drivers = [];
let cars = [];

document.addEventListener("DOMContentLoaded", async () => {

    await loadTripPage();

    document
        .getElementById("tripSearch")
        .addEventListener("input", applyTripFilters);

    document
        .getElementById("statusFilter")
        .addEventListener("change", applyTripFilters);

    document
        .getElementById("driverId")
        .addEventListener("change", handleTripDriverChange);

    document
        .getElementById("tripForm")
        .addEventListener("submit", handleTripSubmit);


});


/* =========================================
   LOAD PAGE
========================================= */

async function loadTripPage() {

    try {

        await loadTrips();
        await loadDrivers();
        await loadCars();

    } catch (error) {

        console.error("Trip page loading error:", error);

        alert(error.message || "Failed to load trip data");

    }

}


/* =========================================
   LOAD TRIPS
========================================= */

async function loadTrips() {

    const data = await apiRequest("/trips/");

    allTrips = Array.isArray(data) ? data : [];

    updateTripSummary();

    renderTrips(allTrips);

}


/* =========================================
   LOAD DRIVERS
========================================= */

async function loadDrivers() {

    const data = await apiRequest("/drivers/");

    drivers = Array.isArray(data) ? data : [];

    const select = document.getElementById("driverId");

    select.innerHTML = `
        <option value="">Select Driver</option>
    `;

    drivers
        .filter(driver => driver.status === "active")
        .forEach(driver => {

            const option = document.createElement("option");

            option.value = driver.id;

            option.textContent =
                `${driver.name} - ${driver.phone}`;

            select.appendChild(option);

        });

}


/* =========================================
   LOAD CARS
========================================= */

async function loadCars() {

    const data = await apiRequest("/cars/");

    cars = Array.isArray(data) ? data : [];

    const select = document.getElementById("carId");

    select.innerHTML = `
        <option value="">Select Car</option>
    `;

    cars
        .filter(car => car.is_active !== false)
        .forEach(car => {

            const option = document.createElement("option");

            option.value = car.id;

            option.textContent =
                `${car.registration_number} - ${car.brand || ""} ${car.model || ""}`;

            select.appendChild(option);

        });

}


/* =========================================
   SUMMARY
========================================= */

function updateTripSummary() {

    document.getElementById("totalTrips").textContent =
        allTrips.length;

    document.getElementById("plannedTrips").textContent =
        allTrips.filter(trip => trip.status === "planned").length;

    document.getElementById("ongoingTrips").textContent =
        allTrips.filter(trip => trip.status === "ongoing").length;

    document.getElementById("completedTrips").textContent =
        allTrips.filter(trip => trip.status === "completed").length;

    document.getElementById("cancelledTrips").textContent =
        allTrips.filter(trip => trip.status === "cancelled").length;

}


/* =========================================
   RENDER TRIPS
========================================= */

function renderTrips(trips) {

    const tbody =
        document.getElementById("tripsTableBody");

    document.getElementById("tripCountText").textContent =
        `${trips.length} trip${trips.length === 1 ? "" : "s"}`;

    if (!trips.length) {

        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-cell">
                    No trips found.
                </td>
            </tr>
        `;

        return;
    }


    tbody.innerHTML = trips.map((trip, index) => {

        const driver = drivers.find(
            item => item.id === trip.driver_id
        );

        const car = cars.find(
            item => item.id === trip.car_id
        );

        const driverName =
            driver?.name || `Driver #${trip.driver_id}`;

        const carName =
            car?.registration_number ||
            `Car #${trip.car_id}`;

        return `
            <tr>

                <td>
                    ${index + 1}
                </td>

                <td>
                    ${escapeHtml(driverName)}
                </td>

                <td>
                    ${escapeHtml(carName)}
                </td>

                <td>
                    <strong>
                        ${escapeHtml(trip.start_location)}
                    </strong>

                    <span> → </span>

                    <strong>
                        ${escapeHtml(trip.destination)}
                    </strong>
                </td>

                <td>
                    ${formatDateTime(trip.start_datetime)}
                </td>

                <td>
                    ${escapeHtml(trip.purpose || "-")}
                </td>

                <td>
                    <span class="trip-status status-${trip.status}">
                        ${trip.status}
                    </span>
                </td>

                <td>

                    <div class="trip-actions">

                        <button
                            class="trip-action-btn"
                            onclick="viewTrip(${trip.id})"
                        >
                            View
                        </button>

                        ${trip.status !== "completed" &&
                trip.status !== "cancelled"
                ?
                `
                            <button
                                class="trip-action-btn"
                                onclick="editTrip(${trip.id})"
                            >
                                Edit
                            </button>
                            `
                :
                ""
            }

                    </div>

                </td>

            </tr>
        `;

    }).join("");

}


/* =========================================
   FILTER
========================================= */

function applyTripFilters() {

    const search =
        document
            .getElementById("tripSearch")
            .value
            .trim()
            .toLowerCase();

    const status =
        document.getElementById("statusFilter").value;


    const filteredTrips = allTrips.filter(trip => {

        const driver = drivers.find(
            item => item.id === trip.driver_id
        );

        const car = cars.find(
            item => item.id === trip.car_id
        );

        const searchableText = [
            trip.start_location,
            trip.destination,
            trip.purpose,
            trip.notes,
            driver?.name,
            car?.registration_number
        ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();


        const matchesSearch =
            !search ||
            searchableText.includes(search);

        const matchesStatus =
            !status ||
            trip.status === status;


        return matchesSearch && matchesStatus;

    });


    renderTrips(filteredTrips);

}


/* =========================================
   RESET FILTER
========================================= */

function resetTripFilters() {

    document.getElementById("tripSearch").value = "";
    document.getElementById("statusFilter").value = "";

    renderTrips(allTrips);

}


/* =========================================
   OPEN MODAL
========================================= */

function openTripModal() {

    document.getElementById(
        "tripModalTitle"
    ).textContent = "Create New Trip";


    document.getElementById(
        "tripSubmitBtn"
    ).textContent = "Create Trip";


    document.getElementById(
        "tripForm"
    ).reset();


    document.getElementById(
        "tripId"
    ).value = "";


    document.getElementById(
        "driverId"
    ).disabled = false;


    document.getElementById(
        "carId"
    ).disabled = true;


    document.getElementById(
        "carId"
    ).innerHTML = `
        <option value="">
            Select Driver First
        </option>
    `;


    hideTripFormError();


    document.getElementById(
        "tripModal"
    ).classList.remove("hidden");

}

/* =========================================
   CLOSE MODAL
========================================= */

function closeTripModal() {

    document
        .getElementById("tripModal")
        .classList.add("hidden");

}


/* =========================================
   CREATE / UPDATE
========================================= */

async function handleTripSubmit(event) {

    event.preventDefault();

    hideTripFormError();


    const tripId =
        document.getElementById("tripId").value;


    const payload = {

        driver_id: Number(
            document.getElementById("driverId").value
        ),

        car_id: Number(
            document.getElementById("carId").value
        ),

        start_location:
            document.getElementById("startLocation").value.trim(),

        destination:
            document.getElementById("destination").value.trim(),

        start_datetime:
            convertLocalDateTime(
                document.getElementById("startDatetime").value
            ),

        end_datetime:
            document.getElementById("endDatetime").value
                ?
                convertLocalDateTime(
                    document.getElementById("endDatetime").value
                )
                :
                null,

        start_odometer:
            document.getElementById("startOdometer").value
                ?
                Number(
                    document.getElementById("startOdometer").value
                )
                :
                null,

        end_odometer:
            document.getElementById("endOdometer").value
                ?
                Number(
                    document.getElementById("endOdometer").value
                )
                :
                null,

        purpose:
            document.getElementById("purpose").value.trim()
            || null,

        notes:
            document.getElementById("notes").value.trim()
            || null

    };


    try {

        const button =
            document.getElementById("tripSubmitBtn");

        button.disabled = true;
        button.textContent =
            tripId ? "Updating..." : "Creating...";


        if (tripId) {

            /*
             * Backend TripUpdate does not allow changing
             * driver_id or car_id.
             *
             * Therefore these two fields are removed
             * during update.
             */

            delete payload.driver_id;
            delete payload.car_id;

            await apiRequest(`/trips/${tripId}`, {
                method: "PUT",
                body: JSON.stringify(payload)
            });

        } else {

            await apiRequest("/trips/", {
                method: "POST",
                body: JSON.stringify(payload)
            });

        }


        closeTripModal();

        await loadTrips();

        alert(
            tripId
                ? "Trip updated successfully."
                : "Trip created successfully."
        );


    } catch (error) {

        showTripFormError(
            error.message || "Failed to save trip."
        );


    } finally {

        const button =
            document.getElementById("tripSubmitBtn");

        button.disabled = false;

        button.textContent =
            tripId ? "Update Trip" : "Create Trip";

    }

}


/* =========================================
   EDIT TRIP
========================================= */

function editTrip(tripId) {

    const trip =
        allTrips.find(item => item.id === tripId);

    if (!trip) {

        alert("Trip not found.");

        return;
    }


    document.getElementById("tripModalTitle").textContent =
        "Edit Trip";

    document.getElementById("tripSubmitBtn").textContent =
        "Update Trip";


    document.getElementById("tripId").value =
        trip.id;


    document.getElementById("driverId").value =
        trip.driver_id;

    document.getElementById("carId").value =
        trip.car_id;


    document.getElementById("driverId").disabled = true;
    document.getElementById("carId").disabled = true;


    document.getElementById("startLocation").value =
        trip.start_location || "";

    document.getElementById("destination").value =
        trip.destination || "";


    document.getElementById("startDatetime").value =
        toDatetimeLocal(trip.start_datetime);

    document.getElementById("endDatetime").value =
        toDatetimeLocal(trip.end_datetime);


    document.getElementById("startOdometer").value =
        trip.start_odometer ?? "";

    document.getElementById("endOdometer").value =
        trip.end_odometer ?? "";


    document.getElementById("purpose").value =
        trip.purpose || "";

    document.getElementById("notes").value =
        trip.notes || "";


    hideTripFormError();


    document
        .getElementById("tripModal")
        .classList.remove("hidden");

}


/* =========================================
   VIEW TRIP
========================================= */

function viewTrip(tripId) {

    if (!tripId) {

        alert("Trip ID is missing.");

        return;
    }


    window.location.href =
        `/frontend/trips/trip-details.html?trip_id=${tripId}`;

}


/* =========================================
   ERROR
========================================= */

function showTripFormError(message) {

    const errorBox =
        document.getElementById("tripFormError");

    errorBox.textContent = message;

    errorBox.classList.remove("hidden");

}


function hideTripFormError() {

    const errorBox =
        document.getElementById("tripFormError");

    errorBox.textContent = "";

    errorBox.classList.add("hidden");

}


/* =========================================
   DATE HELPERS
========================================= */

function convertLocalDateTime(value) {

    if (!value) {
        return null;
    }

    return value.length === 16
        ? `${value}:00`
        : value;

}


function toDatetimeLocal(value) {

    if (!value) {
        return "";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    const year =
        date.getFullYear();

    const month =
        String(date.getMonth() + 1).padStart(2, "0");

    const day =
        String(date.getDate()).padStart(2, "0");

    const hours =
        String(date.getHours()).padStart(2, "0");

    const minutes =
        String(date.getMinutes()).padStart(2, "0");


    return `${year}-${month}-${day}T${hours}:${minutes}`;

}


function formatDateTime(value) {

    if (!value) {
        return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short"
    });

}


/* =========================================
   HTML ESCAPE
========================================= */

function escapeHtml(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* =========================================
   DRIVER → CURRENT CAR
========================================= */

async function handleTripDriverChange() {

    const driverId =
        document.getElementById("driverId").value;

    const carSelect =
        document.getElementById("carId");


    carSelect.innerHTML = `
        <option value="">
            Select Car
        </option>
    `;


    if (!driverId) {

        return;
    }


    try {

        carSelect.disabled = true;

        carSelect.innerHTML = `
            <option value="">
                Loading assigned car...
            </option>
        `;


        const assignment =
            await apiRequest(
                `/driver-vehicle-assignments/driver/${driverId}/current`
            );


        if (!assignment) {

            carSelect.innerHTML = `
                <option value="">
                    No active car assigned
                </option>
            `;

            return;
        }


        const car =
            cars.find(
                item => item.id === assignment.car_id
            );


        if (!car) {

            carSelect.innerHTML = `
                <option value="">
                    Assigned car not found
                </option>
            `;

            return;
        }


        const option =
            document.createElement("option");


        option.value =
            car.id;


        option.textContent =
            `${car.registration_number} - ${car.brand || ""} ${car.model || ""}`;


        option.selected = true;


        carSelect.innerHTML = "";

        carSelect.appendChild(option);


    } catch (error) {

        console.error(
            "Failed to load assigned car:",
            error
        );


        carSelect.innerHTML = `
            <option value="">
                No active car assigned
            </option>
        `;

    } finally {

        carSelect.disabled = false;

    }

}