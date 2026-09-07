document.addEventListener("DOMContentLoaded", async () => {

    if (!requireLogin()) {
        return;
    }

    await loadCarDetails();

});


async function loadCarDetails() {

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


function renderCarDetails(car) {

    document.getElementById(
        "detailRegistration"
    ).textContent =
        car.registration_number || "-";


    document.getElementById(
        "detailBrand"
    ).textContent =
        car.brand || "-";


    document.getElementById(
        "detailModel"
    ).textContent =
        car.model || "-";


    document.getElementById(
        "detailFuel"
    ).textContent =
        car.fuel_type || "-";


    document.getElementById(
        "detailYear"
    ).textContent =
        car.year || "-";


    document.getElementById(
        "detailColor"
    ).textContent =
        car.color || "-";


    document.getElementById(
        "detailOwnerId"
    ).textContent =
        car.owner_id || "-";


    document.getElementById(
        "detailCreatedAt"
    ).textContent =
        formatDate(car.created_at);


    renderStatus(car.status);


    document.getElementById(
        "loadingSection"
    ).classList.add("d-none");


    document.getElementById(
        "carDetailsSection"
    ).classList.remove("d-none");

}


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