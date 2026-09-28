// ========================================
// FUEL HISTORY
// ========================================

let historyFuelRecords = [];

let historyCars = [];

let historyFilteredRecords = [];

let fuelMileageChart = null;


// ========================================
// INITIALIZE
// ========================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        if (!requireLogin()) {
            return;
        }

        setupHistoryEvents();

        await loadHistoryCars();

        await loadHistoryRecords();

    }
);


// ========================================
// EVENTS
// ========================================

function setupHistoryEvents() {

    const carFilter =
        document.getElementById(
            "historyCarFilter"
        );


    const fromDate =
        document.getElementById(
            "historyFromDate"
        );


    const toDate =
        document.getElementById(
            "historyToDate"
        );


    const clearButton =
        document.getElementById(
            "clearHistoryFilters"
        );


    const refreshButton =
        document.getElementById(
            "refreshHistoryButton"
        );


    if (carFilter) {

        carFilter.addEventListener(
            "change",
            applyHistoryFilters
        );

    }


    if (fromDate) {

        fromDate.addEventListener(
            "change",
            applyHistoryFilters
        );

    }


    if (toDate) {

        toDate.addEventListener(
            "change",
            applyHistoryFilters
        );

    }


    if (clearButton) {

        clearButton.addEventListener(
            "click",
            clearHistoryFilters
        );

    }


    if (refreshButton) {

        refreshButton.addEventListener(
            "click",
            loadHistoryRecords
        );

    }

}


// ========================================
// LOAD CARS
// ========================================

async function loadHistoryCars() {

    try {

        historyCars =
            await apiRequest(
                "/cars/"
            );


        populateHistoryCarFilter();

    }

    catch (error) {

        console.error(
            "Failed to load cars:",
            error
        );

        showHistoryError(
            error.message ||
            "Failed to load cars."
        );

    }

}


// ========================================
// CAR FILTER
// ========================================

function populateHistoryCarFilter() {

    const select =
        document.getElementById(
            "historyCarFilter"
        );


    if (!select) {
        return;
    }


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
                `${car.registration_number} - ${car.brand} ${car.model}`;


            select.appendChild(
                option
            );

        }
    );

}


// ========================================
// LOAD RECORDS
// ========================================

async function loadHistoryRecords() {

    showHistoryLoading();

    hideHistoryError();


    try {

        historyFuelRecords =
            await apiRequest(
                "/fuel/"
            );


        historyFilteredRecords =
            [...historyFuelRecords];


        renderHistoryPage();

    }

    catch (error) {

        console.error(
            "Failed to load fuel history:",
            error
        );


        showHistoryError(
            error.message ||
            "Failed to load fuel history."
        );

    }

    finally {

        hideHistoryLoading();

    }

}


// ========================================
// FILTERS
// ========================================

function applyHistoryFilters() {

    const carId =
        document.getElementById(
            "historyCarFilter"
        )?.value || "";


    const fromDate =
        document.getElementById(
            "historyFromDate"
        )?.value || "";


    const toDate =
        document.getElementById(
            "historyToDate"
        )?.value || "";


    historyFilteredRecords =
        historyFuelRecords.filter(
            fuel => {

                const fuelDate =
                    String(
                        fuel.fuel_date || ""
                    )
                    .substring(0, 10);


                const carMatch =
                    !carId ||
                    String(fuel.car_id) ===
                    String(carId);


                const fromMatch =
                    !fromDate ||
                    fuelDate >= fromDate;


                const toMatch =
                    !toDate ||
                    fuelDate <= toDate;


                return (
                    carMatch &&
                    fromMatch &&
                    toMatch
                );

            }
        );


    renderHistoryPage();

}


// ========================================
// CLEAR FILTERS
// ========================================

function clearHistoryFilters() {

    const carFilter =
        document.getElementById(
            "historyCarFilter"
        );


    const fromDate =
        document.getElementById(
            "historyFromDate"
        );


    const toDate =
        document.getElementById(
            "historyToDate"
        );


    if (carFilter) {
        carFilter.value = "";
    }


    if (fromDate) {
        fromDate.value = "";
    }


    if (toDate) {
        toDate.value = "";
    }


    historyFilteredRecords =
        [...historyFuelRecords];


    renderHistoryPage();

}


// ========================================
// RENDER PAGE
// ========================================

function renderHistoryPage() {

    updateHistoryCount();

    const mileageData =
        calculateHistoryMileage(
            historyFilteredRecords
        );


    updateHistorySummary(
        mileageData
    );


    renderMileageChart(
        mileageData
    );


    renderHistoryTable(
        mileageData
    );

}


// ========================================
// MILEAGE CALCULATION
// ========================================

function calculateHistoryMileage(
    records
) {

    const groupedByCar = {};


    // ====================================
    // GROUP BY CAR
    // ====================================

    records.forEach(
        fuel => {

            const carId =
                String(
                    fuel.car_id
                );


            if (!groupedByCar[carId]) {

                groupedByCar[carId] = [];

            }


            groupedByCar[carId].push(
                fuel
            );

        }
    );


    const intervals = [];


    // ====================================
    // PROCESS EACH CAR
    // ====================================

    Object.values(
        groupedByCar
    ).forEach(
        carRecords => {

            const sorted =
                [...carRecords].sort(
                    (a, b) => {

                        const dateA =
                            new Date(
                                a.fuel_date || 0
                            ).getTime();


                        const dateB =
                            new Date(
                                b.fuel_date || 0
                            ).getTime();


                        if (
                            dateA !==
                            dateB
                        ) {

                            return (
                                dateA -
                                dateB
                            );

                        }


                        return (
                            Number(
                                a.odometer_reading ||
                                0
                            ) -
                            Number(
                                b.odometer_reading ||
                                0
                            )
                        );

                    }
                );


            // =================================
            // CONSECUTIVE RECORDS
            // =================================

            for (
                let i = 1;
                i < sorted.length;
                i++
            ) {

                const previous =
                    sorted[i - 1];


                const current =
                    sorted[i];


                const previousOdometer =
                    Number(
                        previous.odometer_reading ||
                        0
                    );


                const currentOdometer =
                    Number(
                        current.odometer_reading ||
                        0
                    );


                const litres =
                    Number(
                        current.litres ||
                        0
                    );


                const fuelCost =
                    Number(
                        current.total_cost ||
                        0
                    );


                const distance =
                    currentOdometer -
                    previousOdometer;


                if (
                    distance <= 0 ||
                    litres <= 0
                ) {

                    continue;

                }


                const mileage =
                    distance / litres;


                const costPerKm =
                    distance > 0
                        ? fuelCost / distance
                        : 0;


                intervals.push({

                    id:
                        current.id,

                    car_id:
                        current.car_id,

                    fuel_date:
                        current.fuel_date,

                    odometer:
                        currentOdometer,

                    distance:
                        distance,

                    litres:
                        litres,

                    mileage:
                        mileage,

                    fuel_cost:
                        fuelCost,

                    cost_per_km:
                        costPerKm

                });

            }

        }
    );


    // ====================================
    // SORT INTERVALS BY DATE
    // ====================================

    intervals.sort(
        (a, b) => {

            return (
                new Date(
                    a.fuel_date
                ).getTime() -
                new Date(
                    b.fuel_date
                ).getTime()
            );

        }
    );


    // ====================================
    // TOTAL DISTANCE
    // ====================================

    const totalDistance =
        intervals.reduce(
            (sum, item) => {

                return (
                    sum +
                    item.distance
                );

            },
            0
        );


    // ====================================
    // TOTAL LITRES
    // ====================================

    const totalLitres =
        intervals.reduce(
            (sum, item) => {

                return (
                    sum +
                    item.litres
                );

            },
            0
        );


    // ====================================
    // TOTAL COST
    // ====================================

    const totalCost =
        intervals.reduce(
            (sum, item) => {

                return (
                    sum +
                    item.fuel_cost
                );

            },
            0
        );


    // ====================================
    // AVERAGE MILEAGE
    // ====================================

    const averageMileage =
        totalLitres > 0
            ? totalDistance /
              totalLitres
            : null;


    // ====================================
    // BEST MILEAGE
    // ====================================

    const bestMileage =
        intervals.length > 0
            ? Math.max(
                ...intervals.map(
                    item =>
                        item.mileage
                )
            )
            : null;


    // ====================================
    // FUEL COST / KM
    // ====================================

    const costPerKm =
        totalDistance > 0
            ? totalCost /
              totalDistance
            : null;


    return {

        intervals,

        totalDistance,

        totalLitres,

        totalCost,

        averageMileage,

        bestMileage,

        costPerKm

    };

}


// ========================================
// UPDATE SUMMARY
// ========================================

function updateHistorySummary(
    data
) {

    const distanceElement =
        document.getElementById(
            "historyTotalDistance"
        );


    const averageElement =
        document.getElementById(
            "historyAverageMileage"
        );


    const bestElement =
        document.getElementById(
            "historyBestMileage"
        );


    const costElement =
        document.getElementById(
            "historyCostPerKm"
        );


    if (distanceElement) {

        distanceElement.textContent =
            data.totalDistance.toLocaleString(
                "en-IN",
                {
                    maximumFractionDigits: 2
                }
            ) + " km";

    }


    if (averageElement) {

        averageElement.textContent =
            data.averageMileage !== null
                ? data.averageMileage.toFixed(2) +
                  " km/L"
                : "-";

    }


    if (bestElement) {

        bestElement.textContent =
            data.bestMileage !== null
                ? data.bestMileage.toFixed(2) +
                  " km/L"
                : "-";

    }


    if (costElement) {

        costElement.textContent =
            data.costPerKm !== null
                ? formatHistoryCurrency(
                    data.costPerKm
                  ) + " / km"
                : "-";

    }

}


// ========================================
// RENDER CHART
// ========================================

function renderMileageChart(
    data
) {

    const canvas =
        document.getElementById(
            "fuelMileageChart"
        );


    const empty =
        document.getElementById(
            "fuelChartEmpty"
        );


    if (!canvas) {
        return;
    }


    if (fuelMileageChart) {

        fuelMileageChart.destroy();

        fuelMileageChart = null;

    }


    if (
        !data.intervals ||
        data.intervals.length === 0
    ) {

        canvas.classList.add(
            "d-none"
        );


        empty?.classList.remove(
            "d-none"
        );


        return;
    }


    canvas.classList.remove(
        "d-none"
    );


    empty?.classList.add(
        "d-none"
    );


    const labels =
        data.intervals.map(
            item =>
                formatHistoryDate(
                    item.fuel_date
                )
        );


    const values =
        data.intervals.map(
            item =>
                Number(
                    item.mileage.toFixed(2)
                )
        );


    fuelMileageChart =
        new Chart(
            canvas,
            {
                type: "line",

                data: {

                    labels: labels,

                    datasets: [
                        {
                            label:
                                "Mileage (km/L)",

                            data:
                                values,

                            tension:
                                0.3,

                            fill:
                                false,

                            pointRadius:
                                4,

                            pointHoverRadius:
                                6
                        }
                    ]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio:
                        false,

                    plugins: {

                        legend: {
                            display: true
                        },

                        tooltip: {

                            callbacks: {

                                label:
                                    context => {

                                        return (
                                            ` ${context.parsed.y.toFixed(2)} km/L`
                                        );

                                    }

                            }

                        }

                    },

                    scales: {

                        y: {

                            beginAtZero:
                                false,

                            title: {

                                display:
                                    true,

                                text:
                                    "Mileage (km/L)"

                            }

                        },

                        x: {

                            title: {

                                display:
                                    true,

                                text:
                                    "Fuel Date"

                            }

                        }

                    }

                }

            }
        );

}


// ========================================
// RENDER TABLE
// ========================================

function renderHistoryTable(
    data
) {

    const tbody =
        document.getElementById(
            "fuelHistoryTableBody"
        );


    const empty =
        document.getElementById(
            "historyEmpty"
        );


    if (!tbody) {
        return;
    }


    tbody.innerHTML = "";


    if (
        !data.intervals ||
        data.intervals.length === 0
    ) {

        empty?.classList.remove(
            "d-none"
        );

        return;

    }


    empty?.classList.add(
        "d-none"
    );


    data.intervals
        .slice()
        .reverse()
        .forEach(
            (item, index) => {

                const row =
                    document.createElement(
                        "tr"
                    );


                const car =
                    getHistoryCar(
                        item.car_id
                    );


                const carLabel =
                    car
                        ? `${car.registration_number} - ${car.brand} ${car.model}`
                        : `Car #${item.car_id}`;


                row.innerHTML = `

                    <td>
                        ${index + 1}
                    </td>


                    <td>
                        ${escapeHistoryHtml(
                            formatHistoryDate(
                                item.fuel_date
                            )
                        )}
                    </td>


                    <td>
                        <strong>
                            ${escapeHistoryHtml(
                                carLabel
                            )}
                        </strong>
                    </td>


                    <td>
                        ${Number(
                            item.odometer
                        ).toLocaleString(
                            "en-IN"
                        )} km
                    </td>


                    <td>
                        ${Number(
                            item.distance
                        ).toLocaleString(
                            "en-IN",
                            {
                                maximumFractionDigits: 2
                            }
                        )} km
                    </td>


                    <td>
                        ${Number(
                            item.litres
                        ).toLocaleString(
                            "en-IN",
                            {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            }
                        )} L
                    </td>


                    <td>
                        <span class="mileage-badge">
                            ${item.mileage.toFixed(2)}
                            km/L
                        </span>
                    </td>


                    <td>
                        <strong>
                            ${formatHistoryCurrency(
                                item.fuel_cost
                            )}
                        </strong>
                    </td>


                    <td>
                        ${formatHistoryCurrency(
                            item.cost_per_km
                        )}
                        / km
                    </td>

                `;


                tbody.appendChild(
                    row
                );

            }
        );

}


// ========================================
// GET CAR
// ========================================

function getHistoryCar(
    carId
) {

    return historyCars.find(
        car =>
            String(car.id) ===
            String(carId)
    );

}


// ========================================
// COUNT
// ========================================

function updateHistoryCount() {

    const element =
        document.getElementById(
            "historyRecordCount"
        );


    if (!element) {
        return;
    }


    const count =
        historyFilteredRecords.length;


    element.textContent =
        `${count} ${
            count === 1
                ? "fuel record"
                : "fuel records"
        }`;

}


// ========================================
// DATE FORMAT
// ========================================

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


    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}


// ========================================
// CURRENCY
// ========================================

function formatHistoryCurrency(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return "-";

    }


    return Number(
        value
    ).toLocaleString(
        "en-IN",
        {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 2
        }
    );

}


// ========================================
// ESCAPE HTML
// ========================================

function escapeHistoryHtml(
    value
) {

    if (value == null) {
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


// ========================================
// LOADING
// ========================================

function showHistoryLoading() {

    document
        .getElementById(
            "historyLoading"
        )
        ?.classList.remove(
            "d-none"
        );

}


function hideHistoryLoading() {

    document
        .getElementById(
            "historyLoading"
        )
        ?.classList.add(
            "d-none"
        );

}


// ========================================
// ERROR
// ========================================

function showHistoryError(
    message
) {

    const element =
        document.getElementById(
            "fuelHistoryError"
        );


    if (!element) {
        return;
    }


    element.textContent =
        message;


    element.classList.remove(
        "d-none"
    );

}


function hideHistoryError() {

    document
        .getElementById(
            "fuelHistoryError"
        )
        ?.classList.add(
            "d-none"
        );

}