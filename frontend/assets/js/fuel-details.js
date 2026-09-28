// ============================================
// FUEL DETAILS
// ============================================


let currentFuelRecord = null;


// ============================================
// PAGE LOAD
// ============================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        if (!requireLogin()) {
            return;
        }


        await loadFuelDetails();

    }
);


// ============================================
// GET FUEL ID
// ============================================

function getFuelId() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    return params.get("id");
}


// ============================================
// LOAD FUEL DETAILS
// ============================================

async function loadFuelDetails() {

    const fuelId =
        getFuelId();


    if (!fuelId) {

        showFuelDetailsError(
            "Fuel record ID is missing."
        );

        return;
    }


    showFuelDetailsLoading();


    try {

        /*
         * IMPORTANT:
         * This assumes your existing backend
         * has GET /fuel/{fuel_id}
         */

        const fuel =
            await apiRequest(
                `/fuel/${fuelId}`
            );


        currentFuelRecord =
            fuel;


        renderFuelDetails(fuel);


        await loadVehicleDetails(
            fuel.car_id
        );


    } catch (error) {

        console.error(
            "Failed to load fuel details:",
            error
        );


        showFuelDetailsError(
            error.message ||
            "Failed to load fuel details."
        );

    }

}


// ============================================
// RENDER FUEL
// ============================================

function renderFuelDetails(fuel) {


    document.getElementById(
        "detailTotalCost"
    ).textContent =
        formatCurrency(
            fuel.total_cost
        );


    document.getElementById(
        "detailLitres"
    ).textContent =
        fuel.litres != null
            ? `${fuel.litres} L`
            : "-";


    document.getElementById(
        "detailPricePerLitre"
    ).textContent =
        fuel.price_per_litre != null
            ? formatCurrency(
                fuel.price_per_litre
            )
            : "-";


    document.getElementById(
        "detailFuelType"
    ).textContent =
        formatFuelType(
            fuel.fuel_type
        );


    document.getElementById(
        "detailFuelDate"
    ).textContent =
        formatDate(
            fuel.fuel_date
        );


    document.getElementById(
        "detailOdometer"
    ).textContent =
        fuel.odometer_reading != null
            ? `${Number(
                fuel.odometer_reading
            ).toLocaleString("en-IN")} km`
            : "-";


    document.getElementById(
        "detailFuelStation"
    ).textContent =
        fuel.fuel_station || "-";


    document.getElementById(
        "detailCreatedAt"
    ).textContent =
        formatDateTime(
            fuel.created_at
        );


    document.getElementById(
        "detailNotes"
    ).textContent =
        fuel.notes || "No notes available.";


    hideFuelDetailsLoading();


    document.getElementById(
        "fuelDetailsContent"
    ).classList.remove(
        "d-none"
    );

}


// ============================================
// LOAD VEHICLE
// ============================================

async function loadVehicleDetails(
    carId
) {

    if (!carId) {
        return;
    }


    try {

        const car =
            await apiRequest(
                `/cars/${carId}`
            );


        document.getElementById(
            "detailCarRegistration"
        ).textContent =
            car.registration_number || "-";


        document.getElementById(
            "detailCarBrand"
        ).textContent =
            car.brand || "-";


        document.getElementById(
            "detailCarModel"
        ).textContent =
            car.model || "-";


        const viewCarButton =
            document.getElementById(
                "viewCarButton"
            );


        if (viewCarButton) {

            viewCarButton.dataset.carId =
                car.id;

        }

    } catch (error) {

        console.error(
            "Failed to load vehicle details:",
            error
        );

        document.getElementById(
            "detailCarRegistration"
        ).textContent = "Unable to load";


        document.getElementById(
            "detailCarBrand"
        ).textContent = "-";


        document.getElementById(
            "detailCarModel"
        ).textContent = "-";

    }

}


// ============================================
// EDIT
// ============================================

function editFuelRecord() {

    const fuelId =
        getFuelId();


    if (!fuelId) {
        return;
    }


    window.location.href =
        `fuel.html?edit=${fuelId}`;

}


// ============================================
// VIEW VEHICLE
// ============================================

function viewFuelCar() {

    const button =
        document.getElementById(
            "viewCarButton"
        );


    const carId =
        button?.dataset?.carId;


    if (!carId) {

        showFuelDetailsError(
            "Vehicle information is unavailable."
        );

        return;
    }


    window.location.href =
        `../cars/car-details.html?id=${carId}`;

}


// ============================================
// BACK
// ============================================

function goBackToFuel() {

    window.location.href =
        "fuel.html";

}


// ============================================
// LOADING
// ============================================

function showFuelDetailsLoading() {

    const loading =
        document.getElementById(
            "fuelDetailsLoading"
        );


    const content =
        document.getElementById(
            "fuelDetailsContent"
        );


    const error =
        document.getElementById(
            "fuelDetailsError"
        );


    loading.classList.remove(
        "d-none"
    );


    content.classList.add(
        "d-none"
    );


    error.classList.add(
        "d-none"
    );

}


function hideFuelDetailsLoading() {

    const loading =
        document.getElementById(
            "fuelDetailsLoading"
        );


    loading.classList.add(
        "d-none"
    );

}


// ============================================
// ERROR
// ============================================

function showFuelDetailsError(
    message
) {

    const loading =
        document.getElementById(
            "fuelDetailsLoading"
        );


    const content =
        document.getElementById(
            "fuelDetailsContent"
        );


    const error =
        document.getElementById(
            "fuelDetailsError"
        );


    loading.classList.add(
        "d-none"
    );


    content.classList.add(
        "d-none"
    );


    error.textContent =
        message;


    error.classList.remove(
        "d-none"
    );

}


// ============================================
// FORMAT CURRENCY
// ============================================

function formatCurrency(
    value
) {

    if (
        value === null ||
        value === undefined ||
        value === ""
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


// ============================================
// FORMAT DATE
// ============================================

function formatDate(
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


// ============================================
// FORMAT DATE + TIME
// ============================================

function formatDateTime(
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
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}


// ============================================
// FORMAT FUEL TYPE
// ============================================

function formatFuelType(
    value
) {

    if (!value) {
        return "-";
    }


    return String(value)
        .replace(
            /_/g,
            " "
        )
        .replace(
            /\b\w/g,
            char =>
                char.toUpperCase()
        );

}