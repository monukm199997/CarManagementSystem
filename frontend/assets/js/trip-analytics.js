/* =========================================
   TRIP ANALYTICS
========================================= */

let analyticsTrips = [];

let analyticsDrivers = [];

let analyticsCars = [];

let filteredAnalyticsTrips = [];

let tripStatusChart = null;

let monthlyTripsChart = null;

let driverTripsChart = null;

let carDistanceChart = null;

/* =========================================
   INIT
========================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        await loadTripAnalytics();

    }
);


/* =========================================
   LOAD DATA
========================================= */

async function loadTripAnalytics() {

    showAnalyticsLoading();

    hideAnalyticsError();


    try {

        const [
            trips,
            drivers,
            cars
        ] = await Promise.all([

            apiRequest("/trips/"),

            apiRequest("/drivers/"),

            apiRequest("/cars/")

        ]);


        analyticsTrips =
            Array.isArray(trips)
                ? trips
                : [];


        analyticsDrivers =
            Array.isArray(drivers)
                ? drivers
                : [];


        analyticsCars =
            Array.isArray(cars)
                ? cars
                : [];


        applyAnalyticsFilters();


        hideAnalyticsLoading();


    } catch (error) {

        console.error(
            "Failed to load trip analytics:",
            error
        );


        showAnalyticsError(
            error.message ||
            "Failed to load trip analytics."
        );

    }

}


/* =========================================
   FILTER
========================================= */

function applyAnalyticsFilters() {

    const fromDate =
        document.getElementById(
            "analyticsFromDate"
        ).value;


    const toDate =
        document.getElementById(
            "analyticsToDate"
        ).value;


    filteredAnalyticsTrips =
        analyticsTrips.filter(
            trip => {

                const tripDate =
                    getAnalyticsDate(
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


                return true;

            }
        );


    renderAnalytics();

}


/* =========================================
   RENDER ALL
========================================= */

function renderAnalytics() {

    renderSummary();

    // Old HTML status/monthly rendering removed.
    // These are now handled by Chart.js.

    renderDriverAnalytics();

    renderCarAnalytics();

    renderRouteAnalytics();


    // Chart.js visualizations

    renderStatusChart();

    renderMonthlyChart();

    renderDriverChart();

    renderCarChart();


    document.getElementById(
        "analyticsContent"
    ).classList.remove(
        "d-none"
    );

}
/* =========================================
   SUMMARY
========================================= */

function renderSummary() {

    const trips =
        filteredAnalyticsTrips;


    const total =
        trips.length;


    const completed =
        trips.filter(
            trip =>
                trip.status === "completed"
        ).length;


    const ongoing =
        trips.filter(
            trip =>
                trip.status === "ongoing"
        ).length;


    const cancelled =
        trips.filter(
            trip =>
                trip.status === "cancelled"
        ).length;


    const planned =
        trips.filter(
            trip =>
                trip.status === "planned"
        ).length;


    const totalDistance =
        calculateTotalDistance(
            trips
        );


    const averageDistance =
        completed > 0
            ? totalDistance / completed
            : 0;


    const completionRate =
        total > 0
            ? (completed / total) * 100
            : 0;


    document.getElementById(
        "analyticsTotalTrips"
    ).textContent =
        total;


    document.getElementById(
        "analyticsCompletedTrips"
    ).textContent =
        completed;


    document.getElementById(
        "analyticsOngoingTrips"
    ).textContent =
        ongoing;


    document.getElementById(
        "analyticsCancelledTrips"
    ).textContent =
        cancelled;


    document.getElementById(
        "analyticsPlannedTrips"
    ).textContent =
        planned;


    document.getElementById(
        "analyticsTotalDistance"
    ).textContent =
        `${totalDistance.toFixed(1)} km`;


    document.getElementById(
        "analyticsAverageDistance"
    ).textContent =
        `${averageDistance.toFixed(1)} km`;


    document.getElementById(
        "analyticsCompletionRate"
    ).textContent =
        `${completionRate.toFixed(1)}%`;

}

/* =========================================
   MONTHLY
========================================= */

function renderMonthlyAnalytics() {

    const container =
        document.getElementById(
            "monthlyAnalytics"
        );


    const monthlyMap = {};


    filteredAnalyticsTrips.forEach(
        trip => {

            if (!trip.start_datetime) {
                return;
            }


            const date =
                new Date(
                    trip.start_datetime
                );


            if (
                Number.isNaN(
                    date.getTime()
                )
            ) {
                return;
            }


            const key =
                `${date.getFullYear()}-${String(
                    date.getMonth() + 1
                ).padStart(2, "0")}`;


            if (!monthlyMap[key]) {

                monthlyMap[key] = 0;

            }


            monthlyMap[key]++;

        }
    );


    const months =
        Object.entries(
            monthlyMap
        )
            .sort(
                ([a], [b]) =>
                    a.localeCompare(b)
            );


    if (!months.length) {

        container.innerHTML = `
            <div class="analytics-empty">
                No monthly data available.
            </div>
        `;

        return;

    }


    const maxCount =
        Math.max(
            ...months.map(
                ([, count]) => count
            )
        );


    container.innerHTML =
        months.map(
            ([month, count]) => {

                const percentage =
                    (count / maxCount) * 100;


                return `
                    <div class="month-row">

                        <span class="month-label">
                            ${formatMonthLabel(month)}
                        </span>

                        <div class="month-bar">

                            <div
                                class="month-bar-fill"
                                style="width: ${percentage}%"
                            ></div>

                        </div>

                        <span class="month-count">
                            ${count}
                        </span>

                    </div>
                `;

            }
        )
            .join("");

}


/* =========================================
   DRIVER ANALYTICS
========================================= */

function renderDriverAnalytics() {

    const tbody =
        document.getElementById(
            "driverAnalyticsBody"
        );


    const driverMap = {};


    filteredAnalyticsTrips.forEach(
        trip => {

            const driverId =
                trip.driver_id;


            if (!driverMap[driverId]) {

                driverMap[driverId] = {

                    total: 0,

                    completed: 0,

                    ongoing: 0,

                    cancelled: 0,

                    distance: 0

                };

            }


            const data =
                driverMap[driverId];


            data.total++;


            if (
                trip.status === "completed"
            ) {
                data.completed++;
            }


            if (
                trip.status === "ongoing"
            ) {
                data.ongoing++;
            }


            if (
                trip.status === "cancelled"
            ) {
                data.cancelled++;
            }


            data.distance +=
                getTripDistance(
                    trip
                );

        }
    );


    const rows =
        Object.entries(
            driverMap
        )
            .sort(
                ([, a], [, b]) =>
                    b.total - a.total
            );


    if (!rows.length) {

        tbody.innerHTML = `
            <tr>
                <td
                    colspan="8"
                    class="text-center py-4 text-muted"
                >
                    No driver data available.
                </td>
            </tr>
        `;

        return;

    }


    tbody.innerHTML =
        rows.map(
            ([driverId, data], index) => {

                const driver =
                    analyticsDrivers.find(
                        item =>
                            String(item.id) ===
                            String(driverId)
                    );


                const rate =
                    data.total > 0
                        ? (
                            data.completed /
                            data.total
                        ) * 100
                        : 0;


                return `
                    <tr>

                        <td>
                            ${index + 1}
                        </td>

                        <td>
                            <strong>
                                ${escapeAnalyticsHtml(
                    driver?.name ||
                    `Driver #${driverId}`
                )}
                            </strong>
                        </td>

                        <td>
                            ${data.total}
                        </td>

                        <td>
                            ${data.completed}
                        </td>

                        <td>
                            ${data.ongoing}
                        </td>

                        <td>
                            ${data.cancelled}
                        </td>

                        <td>
                            ${data.distance.toFixed(1)} km
                        </td>

                        <td>
                            ${rate.toFixed(1)}%
                        </td>

                    </tr>
                `;

            }
        )
            .join("");

}


/* =========================================
   CAR ANALYTICS
========================================= */

function renderCarAnalytics() {

    const tbody =
        document.getElementById(
            "carAnalyticsBody"
        );


    const carMap = {};


    filteredAnalyticsTrips.forEach(
        trip => {

            const carId =
                trip.car_id;


            if (!carMap[carId]) {

                carMap[carId] = {

                    total: 0,

                    completed: 0,

                    ongoing: 0,

                    cancelled: 0,

                    distance: 0

                };

            }


            const data =
                carMap[carId];


            data.total++;


            if (
                trip.status === "completed"
            ) {
                data.completed++;
            }


            if (
                trip.status === "ongoing"
            ) {
                data.ongoing++;
            }


            if (
                trip.status === "cancelled"
            ) {
                data.cancelled++;
            }


            data.distance +=
                getTripDistance(
                    trip
                );

        }
    );


    const rows =
        Object.entries(
            carMap
        )
            .sort(
                ([, a], [, b]) =>
                    b.total - a.total
            );


    if (!rows.length) {

        tbody.innerHTML = `
            <tr>
                <td
                    colspan="7"
                    class="text-center py-4 text-muted"
                >
                    No car data available.
                </td>
            </tr>
        `;

        return;

    }


    tbody.innerHTML =
        rows.map(
            ([carId, data], index) => {

                const car =
                    analyticsCars.find(
                        item =>
                            String(item.id) ===
                            String(carId)
                    );


                const carName =
                    car?.registration_number ||
                    `Car #${carId}`;


                const carInfo = [
                    car?.brand,
                    car?.model
                ]
                    .filter(Boolean)
                    .join(" ");


                return `
                    <tr>

                        <td>
                            ${index + 1}
                        </td>

                        <td>

                            <strong>
                                ${escapeAnalyticsHtml(
                    carName
                )}
                            </strong>

                            <div class="text-muted small">
                                ${escapeAnalyticsHtml(
                    carInfo
                )}
                            </div>

                        </td>

                        <td>
                            ${data.total}
                        </td>

                        <td>
                            ${data.completed}
                        </td>

                        <td>
                            ${data.ongoing}
                        </td>

                        <td>
                            ${data.cancelled}
                        </td>

                        <td>
                            ${data.distance.toFixed(1)} km
                        </td>

                    </tr>
                `;

            }
        )
            .join("");

}


/* =========================================
   ROUTE ANALYTICS
========================================= */

function renderRouteAnalytics() {

    const container =
        document.getElementById(
            "routeAnalytics"
        );


    const routeMap = {};


    filteredAnalyticsTrips.forEach(
        trip => {

            const start =
                trip.start_location ||
                "Unknown";


            const destination =
                trip.destination ||
                "Unknown";


            const key =
                `${start}|||${destination}`;


            if (!routeMap[key]) {

                routeMap[key] = {

                    start,

                    destination,

                    trips: 0,

                    distance: 0

                };

            }


            routeMap[key].trips++;


            routeMap[key].distance +=
                getTripDistance(
                    trip
                );

        }
    );


    const routes =
        Object.values(
            routeMap
        )
            .sort(
                (a, b) =>
                    b.trips - a.trips
            );


    if (!routes.length) {

        container.innerHTML = `
            <div class="analytics-empty">
                No route data available.
            </div>
        `;

        return;

    }


    container.innerHTML =
        routes.map(
            route => {

                return `
                    <div class="route-row">

                        <div class="route-name">

                            ${escapeAnalyticsHtml(
                    route.start
                )}

                            →

                            ${escapeAnalyticsHtml(
                    route.destination
                )}

                        </div>

                        <div class="route-trips">
                            ${route.trips}
                            ${route.trips === 1 ? "trip" : "trips"}
                        </div>

                        <div class="route-distance">
                            ${route.distance.toFixed(1)} km
                        </div>

                    </div>
                `;

            }
        )
            .join("");

}


/* =========================================
   DISTANCE
========================================= */

function getTripDistance(trip) {

    if (
        trip.start_odometer === null ||
        trip.start_odometer === undefined ||
        trip.end_odometer === null ||
        trip.end_odometer === undefined
    ) {

        return 0;

    }


    const distance =
        Number(
            trip.end_odometer
        ) -
        Number(
            trip.start_odometer
        );


    return distance > 0
        ? distance
        : 0;

}


function calculateTotalDistance(
    trips
) {

    return trips.reduce(
        (
            total,
            trip
        ) => {

            return total +
                getTripDistance(
                    trip
                );

        },
        0
    );

}


/* =========================================
   MONTH LABEL
========================================= */

function formatMonthLabel(
    value
) {

    const [
        year,
        month
    ] =
        value.split("-");


    const date =
        new Date(
            Number(year),
            Number(month) - 1,
            1
        );


    return date.toLocaleDateString(
        "en-IN",
        {
            month: "short",
            year: "numeric"
        }
    );

}


/* =========================================
   DATE
========================================= */

function getAnalyticsDate(
    value
) {

    if (!value) {
        return "";
    }


    return String(value)
        .substring(0, 10);

}


/* =========================================
   RESET
========================================= */

function resetAnalyticsFilters() {

    document.getElementById(
        "analyticsFromDate"
    ).value = "";


    document.getElementById(
        "analyticsToDate"
    ).value = "";


    applyAnalyticsFilters();

}


/* =========================================
   LOADING
========================================= */

function showAnalyticsLoading() {

    document.getElementById(
        "analyticsLoading"
    ).classList.remove(
        "d-none"
    );


    document.getElementById(
        "analyticsContent"
    ).classList.add(
        "d-none"
    );

}


function hideAnalyticsLoading() {

    document.getElementById(
        "analyticsLoading"
    ).classList.add(
        "d-none"
    );

}


/* =========================================
   ERROR
========================================= */

function showAnalyticsError(
    message
) {

    hideAnalyticsLoading();


    const error =
        document.getElementById(
            "analyticsError"
        );


    error.textContent =
        message;


    error.classList.remove(
        "d-none"
    );

}


function hideAnalyticsError() {

    document.getElementById(
        "analyticsError"
    ).classList.add(
        "d-none"
    );

}


/* =========================================
   ESCAPE HTML
========================================= */

function escapeAnalyticsHtml(
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

/* =========================================
   STATUS CHART
========================================= */

function renderStatusChart() {

    const canvas =
        document.getElementById(
            "tripStatusChart"
        );

    if (!canvas) {
        return;
    }


    const statuses = [
        "planned",
        "ongoing",
        "completed",
        "cancelled"
    ];


    const counts =
        statuses.map(
            status =>
                filteredAnalyticsTrips.filter(
                    trip =>
                        trip.status === status
                ).length
        );


    if (tripStatusChart) {

        tripStatusChart.destroy();

    }


    tripStatusChart =
        new Chart(
            canvas,
            {
                type: "doughnut",

                data: {

                    labels: [
                        "Planned",
                        "Ongoing",
                        "Completed",
                        "Cancelled"
                    ],

                    datasets: [
                        {
                            data: counts,

                            backgroundColor: [
                                "#4F6FAE", // Planned
                                "#D49A2A", // Ongoing
                                "#159A70", // Completed
                                "#C94B5B"  // Cancelled
                            ],

                            borderWidth: 0
                        }
                    ]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    plugins: {

                        legend: {
                            position: "bottom"
                        }

                    }

                }

            }
        );

}

/* =========================================
   MONTHLY CHART
========================================= */

function renderMonthlyChart() {

    const canvas =
        document.getElementById(
            "monthlyTripsChart"
        );

    if (!canvas) {
        return;
    }


    const monthlyMap = {};


    filteredAnalyticsTrips.forEach(
        trip => {

            if (!trip.start_datetime) {
                return;
            }


            const date =
                new Date(
                    trip.start_datetime
                );


            if (
                Number.isNaN(
                    date.getTime()
                )
            ) {
                return;
            }


            const key =
                `${date.getFullYear()}-${String(
                    date.getMonth() + 1
                ).padStart(2, "0")}`;


            monthlyMap[key] =
                (monthlyMap[key] || 0) + 1;

        }
    );


    const months =
        Object.keys(
            monthlyMap
        ).sort();


    const labels =
        months.map(
            month =>
                formatMonthLabel(month)
        );


    const values =
        months.map(
            month =>
                monthlyMap[month]
        );


    if (monthlyTripsChart) {

        monthlyTripsChart.destroy();

    }


    monthlyTripsChart =
        new Chart(
            canvas,
            {
                type: "bar",

                data: {

                    labels,

                    datasets: [
                        {
                            label: "Trips",

                            data: values,

                            backgroundColor:
                                "#6256B8",

                            borderRadius: 6
                        }
                    ]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    scales: {

                        y: {

                            beginAtZero: true,

                            ticks: {
                                precision: 0
                            },

                            grid: {
                                color: "#E5E7EB"
                            }

                        },

                        x: {

                            grid: {
                                display: false
                            }

                        }

                    },

                    plugins: {

                        legend: {
                            display: false
                        }

                    }

                }

            }
        );

}

/* =========================================
   DRIVER CHART
========================================= */

function renderDriverChart() {

    const canvas =
        document.getElementById(
            "driverTripsChart"
        );

    if (!canvas) {
        return;
    }


    const driverMap = {};


    filteredAnalyticsTrips.forEach(
        trip => {

            const driverId =
                trip.driver_id;


            driverMap[driverId] =
                (driverMap[driverId] || 0) + 1;

        }
    );


    const rows =
        Object.entries(
            driverMap
        )
            .sort(
                ([, a], [, b]) =>
                    b - a
            );


    const labels =
        rows.map(
            ([driverId]) => {

                const driver =
                    analyticsDrivers.find(
                        item =>
                            String(item.id) ===
                            String(driverId)
                    );

                return driver?.name ||
                    `Driver #${driverId}`;

            }
        );


    const values =
        rows.map(
            ([, count]) =>
                count
        );


    if (driverTripsChart) {

        driverTripsChart.destroy();

    }


    driverTripsChart =
        new Chart(
            canvas,
            {
                type: "bar",

                data: {

                    labels,

                    datasets: [
                        {
                            label: "Trips",

                            data: values,

                            backgroundColor:
                                "#3E73B9",

                            borderRadius: 6
                        }
                    ]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    scales: {

                        y: {

                            beginAtZero: true,

                            ticks: {
                                precision: 0
                            },

                            grid: {
                                color: "#E5E7EB"
                            }

                        },

                        x: {

                            grid: {
                                display: false
                            }

                        }

                    },

                    plugins: {

                        legend: {
                            display: false
                        }

                    }

                }

            }
        );

}

/* =========================================
   CAR DISTANCE CHART
========================================= */

function renderCarChart() {

    const canvas =
        document.getElementById(
            "carDistanceChart"
        );

    if (!canvas) {
        return;
    }


    const carMap = {};


    filteredAnalyticsTrips.forEach(
        trip => {

            const carId =
                trip.car_id;


            carMap[carId] =
                (carMap[carId] || 0) +
                getTripDistance(trip);

        }
    );


    const rows =
        Object.entries(
            carMap
        )
            .sort(
                ([, a], [, b]) =>
                    b - a
            );


    const labels =
        rows.map(
            ([carId]) => {

                const car =
                    analyticsCars.find(
                        item =>
                            String(item.id) ===
                            String(carId)
                    );


                return car?.registration_number ||
                    `Car #${carId}`;

            }
        );


    const values =
        rows.map(
            ([, distance]) =>
                Number(
                    distance.toFixed(1)
                )
        );


    if (carDistanceChart) {

        carDistanceChart.destroy();

    }


    carDistanceChart =
        new Chart(
            canvas,
            {
                type: "bar",

                data: {

                    labels,

                    datasets: [
                        {
                            label: "Distance (km)",

                            data: values,

                            backgroundColor:
                                "#168A7A",

                            borderRadius: 6
                        }
                    ]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    scales: {

                        y: {

                            beginAtZero: true,

                            grid: {
                                color: "#E5E7EB"
                            }

                        },

                        x: {

                            grid: {
                                display: false
                            }

                        }

                    },
                    plugins: {

                        legend: {
                            display: false
                        }

                    }

                }

            }
        );

}