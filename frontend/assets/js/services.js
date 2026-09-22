let allServices = [];
let filteredServices = [];

let allCars = [];

let currentPage = 1;

const SERVICES_PER_PAGE = 5;


/* =========================================
   INITIALIZATION
========================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        if (!requireLogin()) {
            return;
        }

        setupServiceEvents();

        await loadCars();

        await loadServices();

        const editId = new URLSearchParams(window.location.search).get("edit");

        if (editId) {
            await openEditServiceFromQuery(editId);
        }

        applyServicePermissions();

        const editForm =
            document.getElementById("editServiceForm");

        if (editForm) {
            editForm.addEventListener(
                "submit",
                handleUpdateService
            );
        }

    }
);


/* =========================================
   EVENTS
========================================= */

function setupServiceEvents() {

    const addButton =
        document.getElementById(
            "addServiceButton"
        );

    if (addButton) {

        addButton.addEventListener(
            "click",
            openAddServiceModal
        );

    }


    const addForm =
        document.getElementById(
            "addServiceForm"
        );

    if (addForm) {

        addForm.addEventListener(
            "submit",
            handleAddService
        );

    }


    const search =
        document.getElementById(
            "serviceSearch"
        );

    if (search) {

        search.addEventListener(
            "input",
            handleServiceFilters
        );

    }


    const carFilter =
        document.getElementById(
            "carFilter"
        );

    if (carFilter) {

        carFilter.addEventListener(
            "change",
            handleServiceFilters
        );

    }


    const statusFilter =
        document.getElementById(
            "statusFilter"
        );

    if (statusFilter) {

        statusFilter.addEventListener(
            "change",
            handleServiceFilters
        );

    }


    const clearButton =
        document.getElementById(
            "clearFiltersButton"
        );

    if (clearButton) {

        clearButton.addEventListener(
            "click",
            clearServiceFilters
        );

    }


    const sidebarLogout =
        document.getElementById(
            "sidebarLogout"
        );

    if (sidebarLogout) {

        sidebarLogout.addEventListener(
            "click",
            event => {

                event.preventDefault();

                logout();

            }
        );

    }

}


/* =========================================
   LOAD CARS
========================================= */

async function loadCars() {

    try {

        const cars =
            await apiRequest("/cars/");

        allCars =
            Array.isArray(cars)
                ? cars
                : [];


        populateCarDropdowns();

    } catch (error) {

        console.error(
            "Failed to load cars:",
            error
        );

    }

}


/* =========================================
   CAR DROPDOWNS
========================================= */

function populateCarDropdowns() {

    const filter =
        document.getElementById(
            "carFilter"
        );

    const serviceCar =
        document.getElementById(
            "serviceCar"
        );


    if (filter) {

        filter.innerHTML = `
            <option value="">
                All Cars
            </option>
        `;

    }


    if (serviceCar) {

        serviceCar.innerHTML = `
            <option value="">
                Select Car
            </option>
        `;

    }


    allCars.forEach(car => {

        const label =
            `${car.registration_number} - ${car.brand} ${car.model}`;


        if (filter) {

            const option =
                document.createElement(
                    "option"
                );

            option.value = car.id;

            option.textContent = label;

            filter.appendChild(option);

        }


        if (serviceCar) {

            const option =
                document.createElement(
                    "option"
                );

            option.value = car.id;

            option.textContent = label;

            serviceCar.appendChild(option);

        }

    });

}


/* =========================================
   LOAD SERVICES
========================================= */

async function loadServices() {

    hideMessages();


    const tableBody =
        document.getElementById(
            "servicesTableBody"
        );


    if (tableBody) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="10"
                    class="text-center py-4">
                    Loading services...
                </td>
            </tr>
        `;

    }


    try {

        const services =
            await apiRequest("/services/");


        allServices =
            Array.isArray(services)
                ? services
                : [];


        filteredServices =
            [...allServices];


        currentPage = 1;


        updateServiceCount();

        renderServices();


    } catch (error) {

        console.error(
            "Failed to load services:",
            error
        );


        if (tableBody) {

            tableBody.innerHTML = `
                <tr>
                    <td colspan="10"
                        class="text-center text-danger py-4">
                        Failed to load services.
                    </td>
                </tr>
            `;

        }


        showError(
            error.message ||
            "Failed to load services."
        );

    }

}


/* =========================================
   RENDER SERVICES
========================================= */

function renderServices() {

    const tableBody =
        document.getElementById(
            "servicesTableBody"
        );


    if (!tableBody) {
        return;
    }


    if (filteredServices.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="10"
                    class="text-center text-muted py-4"
                >
                    No service records found.
                </td>
            </tr>
        `;


        renderPagination();

        updatePaginationInfo();

        return;

    }


    const start =
        (currentPage - 1) *
        SERVICES_PER_PAGE;


    const end =
        start +
        SERVICES_PER_PAGE;


    const pageServices =
        filteredServices.slice(
            start,
            end
        );


    tableBody.innerHTML =
        pageServices
            .map(
                (service, index) =>
                    createServiceRow(
                        service,
                        start + index
                    )
            )
            .join("");


    renderPagination();

    updatePaginationInfo();

}


/* =========================================
   CREATE SERVICE ROW
========================================= */

function createServiceRow(
    service,
    index
) {

    const car =
        allCars.find(
            item =>
                Number(item.id) ===
                Number(service.car_id)
        );


    const carName =
        car
            ? `${car.registration_number} - ${car.brand} ${car.model}`
            : `Car #${service.car_id}`;


    return `
        <tr>

            <td>
                ${index + 1}
            </td>

            <td class="service-car">
                ${escapeHtml(carName)}
            </td>

            <td class="service-type">
                ${escapeHtml(
        service.service_type
    )}
            </td>

            <td>
                ${formatDateOnly(
        service.service_date
    )}
            </td>

            <td>
                ${Number(
        service.odometer_reading
    ).toLocaleString("en-IN")}
            </td>

            <td>
                ${escapeHtml(
        service.service_center
    )}
            </td>

            <td>
                ₹${Number(
        service.cost || 0
    ).toLocaleString(
        "en-IN",
        {
            minimumFractionDigits: 2
        }
    )}
            </td>

            <td>
                ${service.next_service_due
            ? formatDateOnly(
                service.next_service_due
            )
            : "-"
        }
            </td>

            <td>
                ${createStatusBadge(
            service.status
        )}
            </td>

            <td>
                ${createServiceActions(
            service
        )}
            </td>

        </tr>
    `;
}


/* =========================================
   STATUS BADGE
========================================= */

function createStatusBadge(status) {

    const safeStatus =
        status || "unknown";


    const label =
        safeStatus
            .charAt(0)
            .toUpperCase() +
        safeStatus.slice(1);


    return `
        <span class="service-status ${safeStatus}">
            ${escapeHtml(label)}
        </span>
    `;

}


/* =========================================
   ACTIONS
========================================= */

function createServiceActions(service) {

    const user =
        getStoredUser();


    if (!user) {
        return "";
    }


    const canManage = [
        "manager",
        "admin",
        "super_admin"
    ].includes(
        user.role
    );


    let html = `
        <div class="service-actions">

            <button
                type="button"
                class="btn btn-sm btn-outline-primary"
                onclick="viewService(${service.id})"
            >
                View
            </button>
    `;


    if (canManage) {

        html += `
            <button
                type="button"
                class="btn btn-sm btn-outline-warning"
                onclick="editService(${service.id})"
            >
                Edit
            </button>
        `;


        if (service.status === "completed") {

            html += `
                <button
                    type="button"
                    class="btn btn-sm btn-outline-secondary"
                    disabled
                >
                    Completed
                </button>
            `;

        } else {

            html += `
                <button
                    type="button"
                    class="btn btn-sm btn-outline-success"
                    onclick="completeService(${service.id})"
                >
                    Complete
                </button>
            `;

        }

    }


    html += `
        </div>
    `;


    return html;

}


function viewService(serviceId) {
    window.location.href = `service-details.html?id=${serviceId}`;
}



function openAddServiceModal() {

    const form =
        document.getElementById(
            "addServiceForm"
        );


    if (form) {
        form.reset();
    }


    const modalElement =
        document.getElementById(
            "addServiceModal"
        );


    const modal =
        bootstrap.Modal.getOrCreateInstance(
            modalElement
        );


    modal.show();

}


/* =========================================
   ADD SERVICE
========================================= */

async function handleAddService(event) {

    event.preventDefault();


    const saveButton =
        document.getElementById(
            "saveServiceButton"
        );


    const payload = {

        car_id: Number(
            document.getElementById(
                "serviceCar"
            ).value
        ),

        service_type:
            capitalizeWords(
                document.getElementById(
                    "serviceType"
                ).value
            ),

        service_date:
            document.getElementById(
                "serviceDate"
            ).value,

        odometer_reading:
            Number(
                document.getElementById(
                    "odometerReading"
                ).value
            ),

        service_center:
            capitalizeWords(
                document.getElementById(
                    "serviceCenter"
                ).value
            ),

        cost:
            Number(
                document.getElementById(
                    "serviceCost"
                ).value
            ),

        next_service_due:
            document.getElementById(
                "nextServiceDue"
            ).value || null,

        status:
            document.getElementById(
                "serviceStatus"
            ).value

    };


    if (!payload.car_id) {

        showError(
            "Please select a car."
        );

        return;

    }


    try {

        saveButton.disabled = true;

        saveButton.textContent =
            "Adding...";


        await apiRequest(
            "/services/",
            {
                method: "POST",
                body: JSON.stringify(payload)
            }
        );


        const modalElement =
            document.getElementById(
                "addServiceModal"
            );


        const modal =
            bootstrap.Modal.getInstance(
                modalElement
            );


        if (modal) {
            modal.hide();
        }


        await loadServices();


        showSuccess(
            "Service added successfully."
        );


    } catch (error) {

        console.error(
            "Failed to add service:",
            error
        );


        showError(
            error.message ||
            "Failed to add service."
        );


    } finally {

        saveButton.disabled = false;

        saveButton.textContent =
            "Add Service";

    }

}


/* =========================================
   COMPLETE SERVICE
========================================= */

async function completeService(serviceId) {

    const service =
        allServices.find(
            item =>
                Number(item.id) ===
                Number(serviceId)
        );


    if (!service) {
        showError("Service not found.");
        return;
    }


    const confirmed =
        window.confirm(
            `Mark ${service.service_type} as completed?`
        );


    if (!confirmed) {
        return;
    }


    try {

        /*
         * IMPORTANT:
         * This endpoint assumes your backend
         * provides:
         *
         * PATCH /services/{id}/complete
         */

        await apiRequest(
            `/services/${serviceId}/complete`,
            {
                method: "PATCH"
            }
        );


        await loadServices();


        showSuccess(
            "Service marked as completed."
        );


    } catch (error) {

        console.error(
            "Failed to complete service:",
            error
        );


        showError(
            error.message ||
            "Failed to complete service."
        );

    }

}


/* =========================================
   EDIT SERVICE
========================================= */

async function editService(serviceId) {

    try {

        const service = await apiRequest(
            `/services/${serviceId}`
        );

        openEditServiceModal(service);

    } catch (error) {

        console.error("Edit service error:", error);

        showError(
            error.message || "Failed to load service details."
        );
    }
}



function handleServiceFilters() {

    const search =
        document.getElementById(
            "serviceSearch"
        );


    const carFilter =
        document.getElementById(
            "carFilter"
        );


    const statusFilter =
        document.getElementById(
            "statusFilter"
        );


    const searchTerm =
        search
            ? search.value
                .trim()
                .toLowerCase()
            : "";


    const selectedCar =
        carFilter
            ? carFilter.value
            : "";


    const selectedStatus =
        statusFilter
            ? statusFilter.value
            : "";


    filteredServices =
        allServices.filter(
            service => {

                const matchesSearch =
                    !searchTerm ||
                    String(
                        service.service_type
                    )
                        .toLowerCase()
                        .includes(searchTerm) ||

                    String(
                        service.service_center
                    )
                        .toLowerCase()
                        .includes(searchTerm);


                const matchesCar =
                    !selectedCar ||
                    String(
                        service.car_id
                    ) ===
                    String(selectedCar);


                const matchesStatus =
                    !selectedStatus ||
                    service.status ===
                    selectedStatus;


                return (
                    matchesSearch &&
                    matchesCar &&
                    matchesStatus
                );

            }
        );


    currentPage = 1;

    updateServiceCount();

    renderServices();

}


/* =========================================
   CLEAR FILTERS
========================================= */

function clearServiceFilters() {

    const search =
        document.getElementById(
            "serviceSearch"
        );

    const carFilter =
        document.getElementById(
            "carFilter"
        );

    const statusFilter =
        document.getElementById(
            "statusFilter"
        );


    if (search) {
        search.value = "";
    }


    if (carFilter) {
        carFilter.value = "";
    }


    if (statusFilter) {
        statusFilter.value = "";
    }


    filteredServices =
        [...allServices];


    currentPage = 1;

    updateServiceCount();

    renderServices();

}


/* =========================================
   PAGINATION
========================================= */

function renderPagination() {

    const pagination =
        document.getElementById(
            "pagination"
        );


    if (!pagination) {
        return;
    }


    const totalPages =
        Math.ceil(
            filteredServices.length /
            SERVICES_PER_PAGE
        );


    if (totalPages <= 1) {

        pagination.innerHTML = "";

        return;

    }


    let html = "";


    html += `
        <li class="page-item ${currentPage === 1
            ? "disabled"
            : ""
        }">

            <button
                class="page-link"
                onclick="goToServicePage(
                    ${currentPage - 1}
                )"
            >
                Previous
            </button>

        </li>
    `;


    for (
        let page = 1;
        page <= totalPages;
        page++
    ) {

        html += `
            <li class="page-item ${currentPage === page
                ? "active"
                : ""
            }">

                <button
                    class="page-link"
                    onclick="goToServicePage(
                        ${page}
                    )"
                >
                    ${page}
                </button>

            </li>
        `;

    }


    html += `
        <li class="page-item ${currentPage === totalPages
            ? "disabled"
            : ""
        }">

            <button
                class="page-link"
                onclick="goToServicePage(
                    ${currentPage + 1}
                )"
            >
                Next
            </button>

        </li>
    `;


    pagination.innerHTML = html;

}


function goToServicePage(page) {

    const totalPages =
        Math.ceil(
            filteredServices.length /
            SERVICES_PER_PAGE
        );


    if (
        page < 1 ||
        page > totalPages
    ) {
        return;
    }


    currentPage = page;

    renderServices();

}


/* =========================================
   PAGINATION INFO
========================================= */

function updatePaginationInfo() {

    const info =
        document.getElementById(
            "paginationInfo"
        );


    if (!info) {
        return;
    }


    if (filteredServices.length === 0) {

        info.textContent =
            "Showing 0 services";

        return;

    }


    const start =
        (currentPage - 1) *
        SERVICES_PER_PAGE +
        1;


    const end =
        Math.min(
            currentPage *
            SERVICES_PER_PAGE,
            filteredServices.length
        );


    info.textContent =
        `Showing ${start}-${end} of ${filteredServices.length} services`;

}


/* =========================================
   COUNT
========================================= */

function updateServiceCount() {

    const count =
        document.getElementById(
            "serviceCount"
        );


    if (count) {
        count.textContent =
            filteredServices.length;
    }

}


/* =========================================
   ROLE PERMISSIONS
========================================= */

function applyServicePermissions() {

    const user =
        getStoredUser();


    if (!user) {
        return;
    }


    const allowedRoles = [
        "manager",
        "admin",
        "super_admin"
    ];


    const addButton =
        document.getElementById(
            "addServiceButton"
        );


    if (
        addButton &&
        !allowedRoles.includes(
            user.role
        )
    ) {

        addButton.classList.add(
            "d-none"
        );

    }

}


/* =========================================
   DATE
========================================= */

function formatDateOnly(value) {

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


/* =========================================
   CAPITALIZATION
========================================= */

function capitalizeWords(value) {

    if (!value) {
        return "";
    }


    return value
        .trim()
        .toLowerCase()
        .replace(
            /\b\w/g,
            char =>
                char.toUpperCase()
        );

}


/* =========================================
   ALERTS
========================================= */

function showSuccess(message) {

    const element =
        document.getElementById(
            "successMessage"
        );


    if (!element) {
        return;
    }


    element.textContent =
        `✓ ${message}`;


    element.classList.remove(
        "d-none"
    );


    setTimeout(() => {

        element.classList.add(
            "d-none"
        );

        element.textContent = "";

    }, 3000);

}


function showError(message) {

    const element =
        document.getElementById(
            "errorMessage"
        );


    if (!element) {
        return;
    }


    element.textContent =
        `✕ ${message}`;


    element.classList.remove(
        "d-none"
    );

}


/* =========================================
   HIDE ALERTS
========================================= */

function hideMessages() {

    const success =
        document.getElementById(
            "successMessage"
        );

    const error =
        document.getElementById(
            "errorMessage"
        );


    if (success) {

        success.classList.add(
            "d-none"
        );

        success.textContent = "";

    }


    if (error) {

        error.classList.add(
            "d-none"
        );

        error.textContent = "";

    }

}


/* =========================================
   HTML ESCAPING
========================================= */

function escapeHtml(value) {

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


async function openEditServiceFromQuery(serviceId) {

    try {

        const service = await apiRequest(`/services/${serviceId}`);

        openEditServiceModal(service);

    } catch (error) {

        showError(
            error.message || "Failed to load service for editing."
        );
    }
}


function openEditServiceModal(service) {

    document.getElementById("editServiceId").value =
        service.id;

    document.getElementById("editServiceType").value =
        service.service_type || "";

    document.getElementById("editServiceDate").value =
        service.service_date || "";

    document.getElementById("editOdometer").value =
        service.odometer_reading ?? "";

    document.getElementById("editServiceCenter").value =
        service.service_center || "";

    document.getElementById("editServiceCost").value =
        service.cost ?? "";

    document.getElementById("editNextServiceDue").value =
        service.next_service_due || "";


    const carSelect =
        document.getElementById("editServiceCar");

    if (carSelect) {

        carSelect.innerHTML = "";

        const car = allCars.find(
            item => Number(item.id) === Number(service.car_id)
        );

        if (car) {

            const option = document.createElement("option");

            option.value = car.id;

            option.textContent =
                `${car.registration_number} - ${car.brand} ${car.model}`;

            option.selected = true;

            carSelect.appendChild(option);

        } else {

            const option = document.createElement("option");

            option.value = service.car_id;

            option.textContent =
                `Car #${service.car_id}`;

            option.selected = true;

            carSelect.appendChild(option);
        }
    }


    const errorElement =
        document.getElementById("editServiceError");

    errorElement.classList.add("d-none");
    errorElement.textContent = "";


    const modalElement =
        document.getElementById("editServiceModal");

    const modal =
        bootstrap.Modal.getOrCreateInstance(modalElement);

    modal.show();
}


async function handleUpdateService(event) {

    event.preventDefault();


    const serviceId =
        document.getElementById("editServiceId").value;


    const payload = {

        service_type:
            document.getElementById("editServiceType")
                .value
                .trim(),

        service_date:
            document.getElementById("editServiceDate")
                .value,

        odometer_reading:
            Number(
                document.getElementById("editOdometer")
                    .value
            ),

        service_center:
            document.getElementById("editServiceCenter")
                .value
                .trim(),

        cost:
            Number(
                document.getElementById("editServiceCost")
                    .value
            ),

        next_service_due:
            document.getElementById("editNextServiceDue")
                .value || null
    };


    const errorElement =
        document.getElementById("editServiceError");

    const button =
        document.getElementById("updateServiceButton");


    errorElement.classList.add("d-none");
    errorElement.textContent = "";


    if (!payload.service_type) {

        showEditError(
            "Service type is required."
        );

        return;
    }


    if (!payload.service_date) {

        showEditError(
            "Service date is required."
        );

        return;
    }


    if (payload.odometer_reading < 0) {

        showEditError(
            "Odometer reading cannot be negative."
        );

        return;
    }


    if (!payload.service_center) {

        showEditError(
            "Service center is required."
        );

        return;
    }


    if (payload.cost < 0) {

        showEditError(
            "Cost cannot be negative."
        );

        return;
    }


    try {

        button.disabled = true;

        button.innerHTML = `
            <span
                class="spinner-border spinner-border-sm me-1"
            ></span>
            Saving...
        `;


        await apiRequest(
            `/services/${serviceId}`,
            {
                method: "PUT",
                body: JSON.stringify(payload)
            }
        );


        const modalElement =
            document.getElementById("editServiceModal");

        const modal =
            bootstrap.Modal.getInstance(modalElement);

        if (modal) {
            modal.hide();
        }


        showSuccess(
            "Service updated successfully."
        );


        await loadServices();


    } catch (error) {

        console.error(
            "Update service error:",
            error
        );

        showEditError(
            error.message ||
            "Failed to update service."
        );

    } finally {

        button.disabled = false;

        button.textContent =
            "Save Changes";
    }
}


function showEditError(message) {

    const errorElement =
        document.getElementById("editServiceError");

    errorElement.textContent = message;

    errorElement.classList.remove("d-none");
}