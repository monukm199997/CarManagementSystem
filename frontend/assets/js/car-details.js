document.addEventListener("DOMContentLoaded", async () => {

    if (!requireLogin()) {
        return;
    }


    const params = new URLSearchParams(
        window.location.search
    );

    const carId = params.get("id");


    if (!carId) {

        showCarError(
            "Car ID is missing."
        );

        return;
    }


    // Load car details
    await loadCarDetails(carId);


    // Load service history
    await loadServiceHistory(carId);

});


// ========================================
// LOAD CAR DETAILS
// ========================================

async function loadCarDetails(carId) {

    try {

        const car = await apiRequest(
            `/cars/${carId}`
        );

        renderCarDetails(car);

    } catch (error) {

        console.error(
            "Failed to load car details:",
            error
        );

        showCarError(
            error.message ||
            "Failed to load car details."
        );

    }

}


// ========================================
// RENDER CAR DETAILS
// ========================================

function renderCarDetails(car) {

    const registration =
        document.getElementById(
            "detailRegistration"
        );

    const brand =
        document.getElementById(
            "detailBrand"
        );

    const model =
        document.getElementById(
            "detailModel"
        );

    const fuel =
        document.getElementById(
            "detailFuel"
        );

    const year =
        document.getElementById(
            "detailYear"
        );

    const color =
        document.getElementById(
            "detailColor"
        );

    const ownerId =
        document.getElementById(
            "detailOwnerId"
        );

    const createdAt =
        document.getElementById(
            "detailCreatedAt"
        );


    if (registration) {
        registration.textContent =
            car.registration_number || "-";
    }


    if (brand) {
        brand.textContent =
            car.brand || "-";
    }


    if (model) {
        model.textContent =
            car.model || "-";
    }


    if (fuel) {
        fuel.textContent =
            car.fuel_type || "-";
    }


    if (year) {
        year.textContent =
            car.year || "-";
    }


    if (color) {
        color.textContent =
            car.color || "-";
    }


    if (ownerId) {
        ownerId.textContent =
            car.owner_id || "-";
    }


    if (createdAt) {
        createdAt.textContent =
            formatDate(car.created_at);
    }


    renderStatus(car.status);


    const loadingSection =
        document.getElementById(
            "loadingSection"
        );

    const carDetailsSection =
        document.getElementById(
            "carDetailsSection"
        );


    if (loadingSection) {
        loadingSection.classList.add("d-none");
    }


    if (carDetailsSection) {
        carDetailsSection.classList.remove("d-none");
    }

}


// ========================================
// CAR STATUS
// ========================================

function renderStatus(status) {

    const element =
        document.getElementById(
            "carStatus"
        );


    if (!element) {
        return;
    }


    const statusClass =
        status === "active"
            ? "active"
            : "inactive";


    const statusText =
        status
            ? status.charAt(0).toUpperCase() +
              status.slice(1)
            : "Unknown";


    element.innerHTML = `
        <span class="car-status ${statusClass}">
            ${statusText}
        </span>
    `;

}


// ========================================
// DATE FORMAT
// ========================================

function formatDate(dateValue) {

    if (!dateValue) {
        return "-";
    }


    const date =
        new Date(dateValue);


    if (Number.isNaN(date.getTime())) {
        return "-";
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


// ========================================
// CAR ERROR
// ========================================

function showCarError(message) {

    const loading =
        document.getElementById(
            "loadingSection"
        );

    const details =
        document.getElementById(
            "carDetailsSection"
        );

    const error =
        document.getElementById(
            "errorSection"
        );


    if (loading) {
        loading.classList.add("d-none");
    }


    if (details) {
        details.classList.add("d-none");
    }


    if (error) {

        error.textContent =
            message;

        error.classList.remove(
            "d-none"
        );

    }

}


// ========================================
// LOAD SERVICE HISTORY
// ========================================

async function loadServiceHistory(carId) {

    const loadingElement =
        document.getElementById(
            "serviceHistoryLoading"
        );

    const emptyElement =
        document.getElementById(
            "serviceHistoryEmpty"
        );

    const errorElement =
        document.getElementById(
            "serviceHistoryError"
        );

    const tableContainer =
        document.getElementById(
            "serviceHistoryTableContainer"
        );

    const tableBody =
        document.getElementById(
            "serviceHistoryTableBody"
        );


    if (!tableBody) {

        console.error(
            "Service history table body not found."
        );

        return;
    }


    if (loadingElement) {
        loadingElement.classList.remove(
            "d-none"
        );
    }


    if (emptyElement) {
        emptyElement.classList.add(
            "d-none"
        );
    }


    if (errorElement) {
        errorElement.classList.add(
            "d-none"
        );
    }


    if (tableContainer) {
        tableContainer.classList.add(
            "d-none"
        );
    }


    tableBody.innerHTML = "";


    console.log(
        "Loading service history for car:",
        carId
    );


    try {

        const services =
            await apiRequest(
                `/services/car/${carId}`
            );


        console.log(
            "Service history response:",
            services
        );


        if (loadingElement) {
            loadingElement.classList.add(
                "d-none"
            );
        }


        if (
            !services ||
            services.length === 0
        ) {

            if (emptyElement) {
                emptyElement.classList.remove(
                    "d-none"
                );
            }

            return;
        }


        renderServiceHistory(
            services
        );


        if (tableContainer) {
            tableContainer.classList.remove(
                "d-none"
            );
        }


    } catch (error) {

        console.error(
            "Failed to load service history:",
            error
        );


        if (loadingElement) {
            loadingElement.classList.add(
                "d-none"
            );
        }


        if (tableContainer) {
            tableContainer.classList.add(
                "d-none"
            );
        }


        if (errorElement) {

            errorElement.textContent =
                error.message ||
                "Failed to load service history.";

            errorElement.classList.remove(
                "d-none"
            );

        }

    }

}


// ========================================
// RENDER SERVICE HISTORY
// ========================================

function renderServiceHistory(services) {

    const tableBody =
        document.getElementById(
            "serviceHistoryTableBody"
        );


    if (!tableBody) {
        return;
    }


    tableBody.innerHTML = "";


    services.forEach(
        (service, index) => {

            const row =
                document.createElement(
                    "tr"
                );


            row.innerHTML = `

                <td class="ps-4">
                    ${index + 1}
                </td>


                <td>
                    ${formatServiceDate(
                        service.service_date
                    )}
                </td>


                <td>
                    <strong>
                        ${escapeServiceHtml(
                            capitalizeServiceWords(
                                service.service_type
                            )
                        )}
                    </strong>
                </td>


                <td>
                    ${
                        service.odometer_reading != null
                            ? Number(
                                service.odometer_reading
                            ).toLocaleString(
                                "en-IN"
                            ) + " km"
                            : "-"
                    }
                </td>


                <td>
                    ${escapeServiceHtml(
                        capitalizeServiceWords(
                            service.service_center
                        )
                    )}
                </td>


                <td>
                    ${formatServiceCurrency(
                        service.cost
                    )}
                </td>


                <td>
                    <span
                        class="service-history-status ${getServiceHistoryStatusClass(
                            service.status
                        )}"
                    >
                        ${formatServiceStatus(
                            service.status
                        )}
                    </span>
                </td>


                <td class="text-end pe-4">

                    <button
                        type="button"
                        class="btn btn-sm btn-outline-primary"
                        onclick="viewServiceFromCar(${service.id})"
                    >
                        View
                    </button>

                </td>

            `;


            tableBody.appendChild(row);

        }
    );

}


// ========================================
// VIEW SERVICE
// ========================================

function viewServiceFromCar(serviceId) {

    window.location.href =
        `../services/service-details.html?id=${serviceId}`;

}


// ========================================
// SERVICE DATE
// ========================================

function formatServiceDate(value) {

    if (!value) {
        return "-";
    }


    const date =
        new Date(value);


    if (Number.isNaN(date.getTime())) {
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
// SERVICE CURRENCY
// ========================================

function formatServiceCurrency(value) {

    if (value == null) {
        return "-";
    }


    return Number(value).toLocaleString(
        "en-IN",
        {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 2
        }
    );

}


// ========================================
// SERVICE STATUS
// ========================================

function formatServiceStatus(status) {

    if (!status) {
        return "Unknown";
    }


    return status
        .replace(/_/g, " ")
        .replace(
            /\b\w/g,
            char => char.toUpperCase()
        );

}


// ========================================
// SERVICE STATUS CLASS
// ========================================

function getServiceHistoryStatusClass(status) {

    switch (
        (status || "").toLowerCase()
    ) {

        case "completed":
            return "service-status-completed";


        case "cancelled":
        case "canceled":
            return "service-status-cancelled";


        case "scheduled":
        case "pending":
            return "service-status-pending";


        case "in_progress":
        case "in progress":
            return "service-status-progress";


        default:
            return "service-status-default";
    }

}


// ========================================
// CAPITALIZE WORDS
// ========================================

function capitalizeServiceWords(value) {

    if (!value) {
        return "-";
    }


    return String(value)
        .toLowerCase()
        .replace(
            /\b\w/g,
            char => char.toUpperCase()
        );

}


// ========================================
// ESCAPE HTML
// ========================================

function escapeServiceHtml(value) {

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