/* =========================================
   TRIP HISTORY
========================================= */

let historyTrips = [];

let historyDrivers = [];

let historyCars = [];


/* =========================================
   INIT
========================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        setupHistoryFilters();

        await loadTripHistory();

    }
);


/* =========================================
   FILTER EVENTS
========================================= */

function setupHistoryFilters() {

    const search =
        document.getElementById(
            "historySearch"
        );

    const driver =
        document.getElementById(
            "historyDriverFilter"
        );

    const car =
        document.getElementById(
            "historyCarFilter"
        );

    const status =
        document.getElementById(
            "historyStatusFilter"
        );

    const fromDate =
        document.getElementById(
            "historyFromDate"
        );

    const toDate =
        document.getElementById(
            "historyToDate"
        );


    search.addEventListener(
        "input",
        applyHistoryFilters
    );

    driver.addEventListener(
        "change",
        applyHistoryFilters
    );

    car.addEventListener(
        "change",
        applyHistoryFilters
    );

    status.addEventListener(
        "change",
        applyHistoryFilters
    );

    fromDate.addEventListener(
        "change",
        applyHistoryFilters
    );

    toDate.addEventListener(
        "change",
        applyHistoryFilters
    );

}


/* =========================================
   LOAD HISTORY
========================================= */

async function loadTripHistory() {

    showHistoryLoading();

    hideHistoryError();


    try {

        /*
         * Load trips, drivers and cars.
         */

        const [
            trips,
            drivers,
            cars
        ] = await Promise.all([

            apiRequest("/trips/"),

            apiRequest("/drivers/"),

            apiRequest("/cars/")

        ]);


        historyTrips =
            Array.isArray(trips)
                ? trips
                : [];


        historyDrivers =
            Array.isArray(drivers)
                ? drivers
                : [];


        historyCars =
            Array.isArray(cars)
                ? cars
                : [];


        populateDriverFilter();

        populateCarFilter();

        applyUrlFilters();

        // applyHistoryFilters();


        hideHistoryLoading();


    } catch (error) {

        console.error(
            "Failed to load trip history:",
            error
        );


        showHistoryError(
            error.message ||
            "Failed to load trip history."
        );

    }

}


/* =========================================
   DRIVER FILTER
========================================= */

function populateDriverFilter() {

    const select =
        document.getElementById(
            "historyDriverFilter"
        );


    select.innerHTML = `
        <option value="">
            All Drivers
        </option>
    `;


    historyDrivers.forEach(
        driver => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                driver.id;


            option.textContent =
                driver.name;


            select.appendChild(
                option
            );

        }
    );

}


/* =========================================
   CAR FILTER
========================================= */

function populateCarFilter() {

    const select =
        document.getElementById(
            "historyCarFilter"
        );


    select.innerHTML = `
        <option value="">
            All Cars
        </option>
    `;


    historyCars.forEach(
        car => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                car.id;


            option.textContent =
                `${car.registration_number} - ${car.brand || ""} ${car.model || ""}`;


            select.appendChild(
                option
            );

        }
    );

}


/* =========================================
   APPLY FILTERS
========================================= */

function applyHistoryFilters() {

    const search =
        (
            document.getElementById(
                "historySearch"
            ).value || ""
        )
            .trim()
            .toLowerCase();


    const driverId =
        document.getElementById(
            "historyDriverFilter"
        ).value;


    const carId =
        document.getElementById(
            "historyCarFilter"
        ).value;


    const status =
        document.getElementById(
            "historyStatusFilter"
        ).value;


    const fromDate =
        document.getElementById(
            "historyFromDate"
        ).value;


    const toDate =
        document.getElementById(
            "historyToDate"
        ).value;


    const filtered =
        historyTrips.filter(
            trip => {


                /* =========================
                   Driver
                ========================= */

                if (
                    driverId &&
                    String(trip.driver_id) !==
                    String(driverId)
                ) {

                    return false;

                }


                /* =========================
                   Car
                ========================= */

                if (
                    carId &&
                    String(trip.car_id) !==
                    String(carId)
                ) {

                    return false;

                }


                /* =========================
                   Status
                ========================= */

                if (
                    status &&
                    trip.status !== status
                ) {

                    return false;

                }


                /* =========================
                   Date
                ========================= */

                const tripDate =
                    getDateOnly(
                        trip.start_datetime
                    );


                if (
                    fromDate &&
                    tripDate < fromDate
                ) {

                    return false;

                }


                if (
                    toDate &&
                    tripDate > toDate
                ) {

                    return false;

                }


                /* =========================
                   Search
                ========================= */

                if (search) {

                    const driver =
                        historyDrivers.find(
                            item =>
                                item.id ===
                                trip.driver_id
                        );


                    const car =
                        historyCars.find(
                            item =>
                                item.id ===
                                trip.car_id
                        );


                    const searchableText = [

                        trip.start_location,

                        trip.destination,

                        trip.purpose,

                        trip.notes,

                        driver?.name,

                        driver?.phone,

                        car?.registration_number,

                        car?.brand,

                        car?.model

                    ]
                        .filter(Boolean)
                        .join(" ")
                        .toLowerCase();


                    if (
                        !searchableText.includes(
                            search
                        )
                    ) {

                        return false;

                    }

                }


                return true;

            }
        );


    updateHistorySummary(
        filtered
    );


    renderHistoryTable(
        filtered
    );

}


/* =========================================
   SUMMARY
========================================= */

function updateHistorySummary(
    trips
) {

    document.getElementById(
        "historyTotalTrips"
    ).textContent =
        trips.length;


    document.getElementById(
        "historyCompletedTrips"
    ).textContent =
        trips.filter(
            trip =>
                trip.status === "completed"
        ).length;


    document.getElementById(
        "historyOngoingTrips"
    ).textContent =
        trips.filter(
            trip =>
                trip.status === "ongoing"
        ).length;


    document.getElementById(
        "historyCancelledTrips"
    ).textContent =
        trips.filter(
            trip =>
                trip.status === "cancelled"
        ).length;


    const totalDistance =
        trips.reduce(
            (total, trip) => {

                if (
                    trip.start_odometer === null ||
                    trip.start_odometer === undefined ||
                    trip.end_odometer === null ||
                    trip.end_odometer === undefined
                ) {

                    return total;

                }


                const distance =
                    Number(
                        trip.end_odometer
                    ) -
                    Number(
                        trip.start_odometer
                    );


                if (distance > 0) {

                    return total + distance;

                }


                return total;

            },
            0
        );


    document.getElementById(
        "historyTotalDistance"
    ).textContent =
        `${totalDistance.toFixed(1)} km`;

}


/* =========================================
   RENDER TABLE
========================================= */

function renderHistoryTable(
    trips
) {

    const tbody =
        document.getElementById(
            "tripHistoryTableBody"
        );


    document.getElementById(
        "historyCountText"
    ).textContent =
        `${trips.length} trip${trips.length === 1 ? "" : "s"}`;


    if (!trips.length) {

        tbody.innerHTML = `
            <tr>

                <td
                    colspan="10"
                    class="text-center py-5 text-muted"
                >
                    No trip history found.
                </td>

            </tr>
        `;

        showHistoryTable();

        return;

    }


    tbody.innerHTML =
        trips.map(
            (trip, index) => {

                const driver =
                    historyDrivers.find(
                        item =>
                            item.id ===
                            trip.driver_id
                    );


                const car =
                    historyCars.find(
                        item =>
                            item.id ===
                            trip.car_id
                    );


                const distance =
                    calculateTripDistance(
                        trip
                    );


                return `
                    <tr>

                        <td>
                            ${index + 1}
                        </td>


                        <td>
                            ${escapeHistoryHtml(
                    driver?.name ||
                    `Driver #${trip.driver_id}`
                )}
                        </td>


                        <td>
                            ${escapeHistoryHtml(
                    car?.registration_number ||
                    `Car #${trip.car_id}`
                )}
                        </td>


                        <td>

                            <div class="history-route">

                                <span class="history-route-start">
                                    ${escapeHistoryHtml(
                    trip.start_location
                )}
                                </span>

                                <span class="history-route-arrow">
                                    →
                                </span>

                                <span class="history-route-end">
                                    ${escapeHistoryHtml(
                    trip.destination
                )}
                                </span>

                            </div>

                        </td>


                        <td>
                            ${formatHistoryDate(
                    trip.start_datetime
                )}
                        </td>


                        <td>
                            ${formatHistoryDate(
                    trip.end_datetime
                )}
                        </td>


                        <td>

                            <span class="history-distance">
                                ${distance}
                            </span>

                        </td>


                        <td>
                            ${escapeHistoryHtml(
                    trip.purpose || "-"
                )}
                        </td>


                        <td>

                            <span
                                class="history-status ${trip.status}"
                            >
                                ${escapeHistoryHtml(
                    trip.status
                )}
                            </span>

                        </td>


                        <td>

                            <a
                                href="/frontend/trips/trip-details.html?trip_id=${trip.id}"
                                class="btn btn-sm btn-outline-primary history-view-btn"
                            >
                                View
                            </a>

                        </td>

                    </tr>
                `;

            }
        )
            .join("");


    showHistoryTable();

}


/* =========================================
   DISTANCE
========================================= */

function calculateTripDistance(
    trip
) {

    if (
        trip.start_odometer === null ||
        trip.start_odometer === undefined ||
        trip.end_odometer === null ||
        trip.end_odometer === undefined
    ) {

        return "-";

    }


    const distance =
        Number(
            trip.end_odometer
        ) -
        Number(
            trip.start_odometer
        );


    if (distance < 0) {

        return "-";

    }


    return `${distance.toFixed(1)} km`;

}


/* =========================================
   RESET
========================================= */

function resetHistoryFilters() {

    document.getElementById(
        "historySearch"
    ).value = "";


    document.getElementById(
        "historyDriverFilter"
    ).value = "";


    document.getElementById(
        "historyCarFilter"
    ).value = "";


    document.getElementById(
        "historyStatusFilter"
    ).value = "";


    document.getElementById(
        "historyFromDate"
    ).value = "";


    document.getElementById(
        "historyToDate"
    ).value = "";


    applyHistoryFilters();

}


/* =========================================
   DATE
========================================= */

function getDateOnly(
    value
) {

    if (!value) {
        return "";
    }


    return String(value)
        .substring(0, 10);

}


function formatHistoryDate(
    value
) {

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

function showHistoryLoading() {

    document.getElementById(
        "historyLoading"
    ).classList.remove(
        "d-none"
    );


    document.getElementById(
        "historyTableWrapper"
    ).classList.add(
        "d-none"
    );

}


function hideHistoryLoading() {

    document.getElementById(
        "historyLoading"
    ).classList.add(
        "d-none"
    );

}


/* =========================================
   TABLE
========================================= */

function showHistoryTable() {

    document.getElementById(
        "historyTableWrapper"
    ).classList.remove(
        "d-none"
    );

}


/* =========================================
   ERROR
========================================= */

function showHistoryError(
    message
) {

    hideHistoryLoading();


    const error =
        document.getElementById(
            "historyError"
        );


    error.textContent =
        message;


    error.classList.remove(
        "d-none"
    );

}


function hideHistoryError() {

    document.getElementById(
        "historyError"
    ).classList.add(
        "d-none"
    );

}


/* =========================================
   ESCAPE
========================================= */

function escapeHistoryHtml(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}

function applyUrlFilters() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    const driverId =
        params.get("driver_id");

    const carId =
        params.get("car_id");


    if (driverId) {

        document.getElementById(
            "historyDriverFilter"
        ).value = driverId;

    }


    if (carId) {

        document.getElementById(
            "historyCarFilter"
        ).value = carId;

    }


    applyHistoryFilters();

}