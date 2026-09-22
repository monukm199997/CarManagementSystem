let currentService = null;
let currentCar = null;


document.addEventListener("DOMContentLoaded", async () => {

    if (!requireLogin()) {
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const serviceId = params.get("id");

    if (!serviceId) {
        showNotFound();
        return;
    }

    await loadServiceDetails(serviceId);
});


async function loadServiceDetails(serviceId) {

    try {

        const service = await apiRequest(`/services/${serviceId}`);

        currentService = service;

        await loadCarDetails(service.car_id);

        renderServiceDetails();

        document.getElementById("loadingState")
            .classList.add("d-none");

        document.getElementById("serviceContent")
            .classList.remove("d-none");

    } catch (error) {

        console.error("Failed to load service:", error);

        document.getElementById("loadingState")
            .classList.add("d-none");

        showError(error.message || "Failed to load service details.");

    }
}


async function loadCarDetails(carId) {

    try {

        currentCar = await apiRequest(`/cars/${carId}`);

    } catch (error) {

        console.error("Failed to load car:", error);

        currentCar = null;
    }
}


function renderServiceDetails() {

    const service = currentService;

    if (!service) {
        showNotFound();
        return;
    }


    document.getElementById("serviceId").textContent =
        service.id ?? "-";


    document.getElementById("serviceType").textContent =
        capitalizeWords(service.service_type);


    document.getElementById("serviceDate").textContent =
        formatDate(service.service_date);


    document.getElementById("odometerReading").textContent =
        service.odometer_reading != null
            ? `${Number(service.odometer_reading).toLocaleString()} km`
            : "-";


    document.getElementById("serviceCenter").textContent =
        capitalizeWords(service.service_center);


    document.getElementById("serviceCost").textContent =
        formatCurrency(service.cost);


    document.getElementById("nextServiceDue").textContent =
        service.next_service_due
            ? formatDate(service.next_service_due)
            : "Not scheduled";


    document.getElementById("createdAt").textContent =
        formatDateTime(service.created_at);


    document.getElementById("sideStatus").textContent =
        formatStatus(service.status);


    renderStatus(service.status);

    renderCarDetails();

    renderActions();
}


function renderCarDetails() {

    const service = currentService;

    document.getElementById("carId").textContent =
        service.car_id ?? "-";


    if (!currentCar) {

        document.getElementById("carRegistration").textContent = "-";
        document.getElementById("carBrand").textContent = "-";
        document.getElementById("carModel").textContent = "-";

        return;
    }


    document.getElementById("carRegistration").textContent =
        currentCar.registration_number || "-";


    document.getElementById("carBrand").textContent =
        currentCar.brand || "-";


    document.getElementById("carModel").textContent =
        currentCar.model || "-";
}


function renderStatus(status) {

    const statusElement =
        document.getElementById("serviceStatus");

    statusElement.textContent =
        formatStatus(status);

    statusElement.className =
        "service-status-badge " +
        getStatusClass(status);
}


function renderActions() {

    const actionsContainer =
        document.getElementById("serviceActions");

    const quickActions =
        document.getElementById("quickActions");

    actionsContainer.innerHTML = "";
    quickActions.innerHTML = "";


    const role = getCurrentUserRole();

    const canEdit =
        ["staff", "manager", "admin", "super_admin"]
            .includes(role);

    const canComplete =
        ["staff", "manager", "admin", "super_admin"]
            .includes(role);

    const canCancel =
        ["manager", "admin", "super_admin"]
            .includes(role);


    const status = currentService.status;


    if (canEdit && status !== "completed" && status !== "cancelled") {

        actionsContainer.innerHTML += `
            <button
                class="btn btn-primary"
                onclick="editService()"
            >
                ✏ Edit Service
            </button>
        `;

        quickActions.innerHTML += `
            <button
                class="btn btn-outline-primary"
                onclick="editService()"
            >
                ✏ Edit Service
            </button>
        `;
    }


    if (canComplete && status !== "completed" && status !== "cancelled") {

        quickActions.innerHTML += `
            <button
                class="btn btn-outline-success"
                onclick="completeService()"
            >
                ✓ Mark Completed
            </button>
        `;
    }


    if (canCancel && status !== "cancelled" && status !== "completed") {

        quickActions.innerHTML += `
            <button
                class="btn btn-outline-danger"
                onclick="cancelService()"
            >
                ✕ Cancel Service
            </button>
        `;
    }


    if (currentCar) {

        quickActions.innerHTML += `
            <a
                href="../cars/car-details.html?id=${currentCar.id}"
                class="btn btn-outline-secondary"
            >
                🚗 View Vehicle
            </a>
        `;
    }


    if (!quickActions.innerHTML) {

        quickActions.innerHTML = `
            <div class="text-muted small">
                No actions available for your role.
            </div>
        `;
    }
}


function editService() {

    if (!currentService) {
        return;
    }

    window.location.href =
        `services.html?edit=${currentService.id}`;
}


async function completeService() {

    if (!currentService) {
        return;
    }


    const confirmed = confirm(
        "Are you sure you want to mark this service as completed?"
    );

    if (!confirmed) {
        return;
    }


    try {

        await apiRequest(
            `/services/${currentService.id}/complete`,
            {
                method: "PATCH"
            }
        );

        showSuccess("Service marked as completed.");

        setTimeout(() => {
            window.location.reload();
        }, 700);

    } catch (error) {

        showError(
            error.message || "Failed to complete service."
        );
    }
}


async function cancelService() {

    if (!currentService) {
        return;
    }


    const confirmed = confirm(
        "Are you sure you want to cancel this service?"
    );

    if (!confirmed) {
        return;
    }


    try {

        await apiRequest(
            `/services/${currentService.id}/cancel`,
            {
                method: "PATCH"
            }
        );

        showSuccess("Service cancelled.");

        setTimeout(() => {
            window.location.reload();
        }, 700);

    } catch (error) {

        showError(
            error.message || "Failed to cancel service."
        );
    }
}


function showSuccess(message) {

    const element =
        document.getElementById("successMessage");

    element.textContent = message;
    element.classList.remove("d-none");

    document.getElementById("errorMessage")
        .classList.add("d-none");
}


function showError(message) {

    const element =
        document.getElementById("errorMessage");

    element.textContent = message;
    element.classList.remove("d-none");

    document.getElementById("successMessage")
        .classList.add("d-none");
}


function showNotFound() {

    document.getElementById("loadingState")
        .classList.add("d-none");

    document.getElementById("notFoundState")
        .classList.remove("d-none");
}


function formatDate(value) {

    if (!value) {
        return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
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
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}


function formatCurrency(value) {

    if (value == null) {
        return "-";
    }

    return Number(value).toLocaleString("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2
    });
}


function formatStatus(status) {

    if (!status) {
        return "Unknown";
    }

    return status
        .replace(/_/g, " ")
        .replace(/\b\w/g, char => char.toUpperCase());
}


function getStatusClass(status) {

    switch ((status || "").toLowerCase()) {

        case "completed":
            return "status-completed";

        case "cancelled":
        case "canceled":
            return "status-cancelled";

        case "pending":
            return "status-pending";

        case "in_progress":
        case "in progress":
            return "status-progress";

        default:
            return "status-default";
    }
}


function capitalizeWords(value) {

    if (!value) {
        return "-";
    }

    return value
        .toLowerCase()
        .replace(/\b\w/g, char => char.toUpperCase());
}


function goBack() {

    window.location.href = "services.html";
}