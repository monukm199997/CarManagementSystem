let ownersMap = {};
let allCars = [];
let filteredCars = [];

let currentPage = 1;

const CARS_PER_PAGE = 5;


/* =========================================
   PAGE INITIALIZATION
========================================= */

document.addEventListener("DOMContentLoaded", async () => {

    if (!requireLogin()) {
        return;
    }

    setupEventListeners();

    await loadOwnersMap();

    await loadOwners();

    await loadCars();

    applyRolePermissions();

});

/* =========================================
   EVENT LISTENERS
========================================= */

function setupEventListeners() {

    const addCarButton =
        document.getElementById("addCarButton");

    if (addCarButton) {
        addCarButton.addEventListener(
            "click",
            openAddCarModal
        );
    }


    const addCarForm =
        document.getElementById("addCarForm");

    if (addCarForm) {
        addCarForm.addEventListener(
            "submit",
            handleAddCar
        );
    }


    const searchInput =
        document.getElementById("carSearch");

    if (searchInput) {
        searchInput.addEventListener(
            "input",
            handleCarSearch
        );
    }


    const brandFilter =
        document.getElementById("brandFilter");

    if (brandFilter) {
        brandFilter.addEventListener(
            "change",
            handleCarFilter
        );
    }


    const refreshButton =
        document.getElementById("refreshCarsButton");

    if (refreshButton) {
        refreshButton.addEventListener(
            "click",
            async () => {
                await loadCars();
            }
        );
    }

    const clearFiltersButton =
        document.getElementById(
            "clearFiltersButton"
        );

    if (clearFiltersButton) {

        clearFiltersButton.addEventListener(
            "click",
            clearFilters
        );

    }


    const sidebarLogout =
        document.getElementById("sidebarLogout");

    if (sidebarLogout) {
        sidebarLogout.addEventListener(
            "click",
            (event) => {
                event.preventDefault();
                logout();
            }
        );
    }

    const editCarForm =
        document.getElementById("editCarForm");

    if (editCarForm) {

        editCarForm.addEventListener(
            "submit",
            handleUpdateCar
        );

    }

    const fuelFilter =
        document.getElementById("fuelFilter");

    if (fuelFilter) {

        fuelFilter.addEventListener(
            "change",
            handleAdvancedFilter
        );

    }


    const statusFilter =
        document.getElementById("statusFilter");

    if (statusFilter) {

        statusFilter.addEventListener(
            "change",
            handleAdvancedFilter
        );

    }

}


/* =========================================
   LOAD CARS
========================================= */

async function loadCars() {

    hideMessages();

    const tableBody =
        document.getElementById("carsTableBody");

    if (tableBody) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="10" class="text-center py-4">
                    Loading cars...
                </td>
            </tr>
        `;

    }


    try {

        const cars = await apiRequest("/cars/");

        allCars = Array.isArray(cars)
            ? cars
            : [];

        filteredCars = [...allCars];

        currentPage = 1;

        updateBrandFilter();

        updateCarCount();

        renderCars();

    } catch (error) {

        console.error("Failed to load cars:", error);

        if (tableBody) {

            tableBody.innerHTML = `
                <tr>
                    <td colspan="10"
                        class="text-center text-danger py-4">
                        Failed to load cars.
                    </td>
                </tr>
            `;

        }

        showError(
            error.message || "Failed to load cars"
        );

    }

}


/* =========================================
   RENDER CARS
========================================= */

function renderCars() {

    const tableBody =
        document.getElementById("carsTableBody");

    if (!tableBody) {
        return;
    }


    if (filteredCars.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="10"
                    class="text-center text-muted py-4"
                >
                    No cars found.
                </td>
            </tr>
        `;

        renderPagination();

        updatePaginationInfo();

        return;
    }


    const startIndex =
        (currentPage - 1) * CARS_PER_PAGE;

    const endIndex =
        startIndex + CARS_PER_PAGE;

    const pageCars =
        filteredCars.slice(
            startIndex,
            endIndex
        );


    tableBody.innerHTML =
        pageCars
            .map(
                (car, index) =>
                    createCarRow(
                        car,
                        startIndex + index
                    )
            )
            .join("");


    renderPagination();

    updatePaginationInfo();

}


/* =========================================
   CREATE TABLE ROW
========================================= */

function createCarRow(car, index) {

    const statusClass =
        car.status === "active"
            ? "active"
            : "inactive";


    const statusText =
        capitalizeText(car.status);


    return `
        <tr>

            <td>
                ${index + 1}
            </td>

            <td class="car-registration">
                ${escapeHtml(car.registration_number)}
            </td>

            <td class="car-brand">
                ${escapeHtml(car.brand)}
            </td>

            <td>
                ${escapeHtml(car.model)}
            </td>

            <td>
                ${escapeHtml(car.fuel_type)}
            </td>

            <td>
                ${car.year}
            </td>

            <td>
                ${car.color
            ? escapeHtml(car.color)
            : "-"
        }
            </td>

            <td>
                <span class="car-status ${statusClass}">
                    ${statusText}
                </span>
            </td>

            <td>
                ${getOwnerDisplay(car.owner_id)}
            </td>

            <td>
                <div class="car-actions">

                ${createCarActions(car)}

                </div>
            </td>

        </tr>
    `;
}


function viewCar(carId) {

    window.location.href =
        `car-details.html?id=${carId}`;

}

/* =========================================
   SEARCH
========================================= */

function handleCarSearch(event) {

    handleAdvancedFilter();

}


function handleCarFilter() {

    handleAdvancedFilter();

}


function applyFilters(searchTerm = "") {

    const brandFilter =
        document.getElementById("brandFilter");


    const selectedBrand =
        brandFilter
            ? brandFilter.value
            : "";


    filteredCars =
        allCars.filter(car => {

            const matchesSearch =
                !searchTerm ||
                String(car.registration_number)
                    .toLowerCase()
                    .includes(searchTerm) ||
                String(car.brand)
                    .toLowerCase()
                    .includes(searchTerm) ||
                String(car.model)
                    .toLowerCase()
                    .includes(searchTerm);


            const matchesBrand =
                !selectedBrand ||
                car.brand === selectedBrand;


            return (
                matchesSearch &&
                matchesBrand
            );

        });


    currentPage = 1;

    updateCarCount();

    renderCars();

}


/* =========================================
   BRAND FILTER
========================================= */

function updateBrandFilter() {

    const brandFilter =
        document.getElementById("brandFilter");

    if (!brandFilter) {
        return;
    }


    const currentValue =
        brandFilter.value;


    const brands =
        [
            ...new Set(
                allCars
                    .map(car => car.brand)
                    .filter(Boolean)
            )
        ]
            .sort();


    brandFilter.innerHTML = `
        <option value="">
            All Brands
        </option>
    `;


    brands.forEach(brand => {

        const option =
            document.createElement("option");

        option.value = brand;
        option.textContent = brand;

        brandFilter.appendChild(option);

    });


    if (brands.includes(currentValue)) {
        brandFilter.value = currentValue;
    }

}


/* =========================================
   PAGINATION
========================================= */

function renderPagination() {

    const pagination =
        document.getElementById("pagination");

    if (!pagination) {
        return;
    }


    const totalPages =
        Math.ceil(
            filteredCars.length / CARS_PER_PAGE
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
                onclick="goToPage(${currentPage - 1})"
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
                    onclick="goToPage(${page})"
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
                onclick="goToPage(${currentPage + 1})"
            >
                Next
            </button>

        </li>
    `;


    pagination.innerHTML = html;

}


function goToPage(page) {

    const totalPages =
        Math.ceil(
            filteredCars.length / CARS_PER_PAGE
        );


    if (
        page < 1 ||
        page > totalPages
    ) {
        return;
    }


    currentPage = page;

    renderCars();

}


/* =========================================
   PAGINATION INFO
========================================= */

function updatePaginationInfo() {

    const info =
        document.getElementById("paginationInfo");

    if (!info) {
        return;
    }


    if (filteredCars.length === 0) {

        info.textContent =
            "Showing 0 cars";

        return;
    }


    const start =
        (currentPage - 1) * CARS_PER_PAGE + 1;


    const end =
        Math.min(
            currentPage * CARS_PER_PAGE,
            filteredCars.length
        );


    info.textContent =
        `Showing ${start}-${end} of ${filteredCars.length} cars`;

}


/* =========================================
   CAR COUNT
========================================= */

function updateCarCount() {

    const count =
        document.getElementById("carCount");

    if (count) {
        count.textContent =
            filteredCars.length;
    }

}


/* =========================================
   LOAD OWNERS
========================================= */

async function loadOwners() {

    const ownerSelect =
        document.getElementById("ownerId");

    if (!ownerSelect) {
        return;
    }

    try {

        const users =
            await apiRequest("/user/users");

        const activeCustomers =
            users.filter(
                user =>
                    user.is_active &&
                    String(user.role).toLowerCase() === "customer"
            );

        ownerSelect.innerHTML = `
            <option value="">
                Select Owner
            </option>
        `;

        if (activeCustomers.length === 0) {

            const option =
                document.createElement("option");

            option.value = "";
            option.textContent =
                "No active customers found";

            option.disabled = true;

            ownerSelect.appendChild(option);

            return;
        }

        activeCustomers.forEach(user => {

            const option =
                document.createElement("option");

            option.value = user.id;

            option.textContent =
                user.email
                    ? `${user.name} (${user.email})`
                    : user.name;

            ownerSelect.appendChild(option);

        });

    } catch (error) {

        console.error(
            "Failed to load owners:",
            error
        );

        ownerSelect.innerHTML = `
            <option value="">
                Failed to load customers
            </option>
        `;
    }
}

/* =========================================
   ADD CAR MODAL
========================================= */

function openAddCarModal() {

    const form =
        document.getElementById("addCarForm");

    if (form) {
        form.reset();
    }


    const modalElement =
        document.getElementById("addCarModal");


    if (!modalElement) {
        return;
    }


    const modal =
        bootstrap.Modal.getOrCreateInstance(
            modalElement
        );


    modal.show();

}


/* =========================================
   ADD CAR
========================================= */

async function handleAddCar(event) {

    event.preventDefault();


    const saveButton =
        document.getElementById("saveCarButton");


    const registrationNumber =
        document
            .getElementById("registrationNumber")
            .value
            .trim()
            .toUpperCase();


    const brand =
        document
            .getElementById("brand")
            .value
            .trim();


    const model =
        document
            .getElementById("model")
            .value
            .trim();


    const fuelType =
        document
            .getElementById("fuelType")
            .value;


    const year =
        Number(
            document
                .getElementById("carYear")
                .value
        );


    const color =
        document
            .getElementById("carColor")
            .value
            .trim();


    const ownerId =
        Number(
            document
                .getElementById("ownerId")
                .value
        );


    if (!ownerId) {

        showError(
            "Please select a car owner."
        );

        return;
    }


    const payload = {

        registration_number:
            registrationNumber,

        brand:
            brand,

        model:
            model,

        fuel_type:
            fuelType,

        year:
            year,

        color:
            color || null,

        owner_id:
            ownerId

    };


    try {

        saveButton.disabled = true;

        saveButton.textContent =
            "Adding...";


        await apiRequest(
            "/cars/",
            {
                method: "POST",
                body: JSON.stringify(payload)
            }
        );


        const modalElement =
            document.getElementById(
                "addCarModal"
            );


        const modal =
            bootstrap.Modal.getInstance(
                modalElement
            );


        if (modal) {
            modal.hide();
        }


        document
            .getElementById("addCarForm")
            .reset();


        await loadCars();


        showSuccess(
            "Car added successfully."
        );


    } catch (error) {

        console.error(
            "Failed to add car:",
            error
        );


        showError(
            error.message ||
            "Failed to add car."
        );


    } finally {

        saveButton.disabled = false;

        saveButton.textContent =
            "Add Car";

    }

}


/* =========================================
   ROLE PERMISSIONS
========================================= */

function applyRolePermissions() {

    const user =
        getStoredUser();


    if (!user) {
        return;
    }


    const allowedToCreate = [
        "manager",
        "admin",
        "super_admin"
    ];


    const addCarButton =
        document.getElementById(
            "addCarButton"
        );


    if (
        addCarButton &&
        !allowedToCreate.includes(
            user.role
        )
    ) {

        addCarButton.classList.add(
            "d-none"
        );

    }

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
   TEXT HELPERS
========================================= */

function capitalizeText(value) {

    if (!value) {
        return "";
    }

    return (
        value.charAt(0).toUpperCase() +
        value.slice(1)
    );

}


/* =========================================
   HTML ESCAPING
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

const brand =
    capitalizeWords(
        document
            .getElementById("brand")
            .value
    );

const model =
    capitalizeWords(
        document
            .getElementById("model")
            .value
    );

const fuelType =
    capitalizeWords(
        document
            .getElementById("fuelType")
            .value
    );

const color =
    capitalizeWords(
        document
            .getElementById("carColor")
            .value
    );



function createCarActions(car) {

    const user = getStoredUser();

    if (!user) {
        return "";
    }

    const canManage = [
        "manager",
        "admin",
        "super_admin"
    ].includes(user.role);


    let html = `
        <div class="car-actions">

            <button
                type="button"
                class="btn btn-sm btn-outline-primary"
                onclick="viewCar(${car.id})"
            >
                View
            </button>
    `;


    if (canManage) {

        html += `
            <button
                type="button"
                class="btn btn-sm btn-outline-warning"
                onclick="openEditCar(${car.id})"
            >
                Edit
            </button>
        `;


        if (car.status === "active") {

            html += `
                <button
                    type="button"
                    class="btn btn-sm btn-outline-danger"
                    onclick="deactivateCar(${car.id})"
                >
                    Deactivate
                </button>
            `;

        } else {

            html += `
                <button
                    type="button"
                    class="btn btn-sm btn-outline-success"
                    onclick="activateCar(${car.id})"
                >
                    Activate
                </button>
            `;

        }

    }


    html += `
        </div>
    `;


    return html;
}



function openEditCar(carId) {

    const car = allCars.find(
        item => Number(item.id) === Number(carId)
    );


    if (!car) {
        showError("Car not found.");
        return;
    }


    document.getElementById(
        "editCarId"
    ).value = car.id;


    document.getElementById(
        "editRegistrationNumber"
    ).value = car.registration_number || "";


    document.getElementById(
        "editBrand"
    ).value = car.brand || "";


    document.getElementById(
        "editModel"
    ).value = car.model || "";


    document.getElementById(
        "editFuelType"
    ).value = car.fuel_type || "";


    document.getElementById(
        "editCarYear"
    ).value = car.year || "";


    document.getElementById(
        "editCarColor"
    ).value = car.color || "";


    const modalElement =
        document.getElementById("editCarModal");


    const modal =
        bootstrap.Modal.getOrCreateInstance(
            modalElement
        );


    modal.show();
}


async function handleUpdateCar(event) {

    event.preventDefault();


    const carId =
        document.getElementById(
            "editCarId"
        ).value;


    const updateButton =
        document.getElementById(
            "updateCarButton"
        );


    const payload = {

        brand: capitalizeWords(
            document.getElementById(
                "editBrand"
            ).value
        ),

        model: capitalizeWords(
            document.getElementById(
                "editModel"
            ).value
        ),

        fuel_type: capitalizeWords(
            document.getElementById(
                "editFuelType"
            ).value
        ),

        year: Number(
            document.getElementById(
                "editCarYear"
            ).value
        ),

        color: capitalizeWords(
            document.getElementById(
                "editCarColor"
            ).value
        ) || null

    };


    try {

        updateButton.disabled = true;

        updateButton.textContent =
            "Saving...";


        await apiRequest(
            `/cars/${carId}`,
            {
                method: "PUT",
                body: JSON.stringify(payload)
            }
        );


        const modalElement =
            document.getElementById(
                "editCarModal"
            );


        const modal =
            bootstrap.Modal.getInstance(
                modalElement
            );


        if (modal) {
            modal.hide();
        }


        await loadCars();


        showSuccess(
            "Car updated successfully."
        );


    } catch (error) {

        console.error(
            "Failed to update car:",
            error
        );


        showError(
            error.message ||
            "Failed to update car."
        );


    } finally {

        updateButton.disabled = false;

        updateButton.textContent =
            "Save Changes";

    }

}

async function deactivateCar(carId) {

    const car = allCars.find(
        item => Number(item.id) === Number(carId)
    );


    if (!car) {
        showError("Car not found.");
        return;
    }


    const confirmed = window.confirm(
        `Are you sure you want to deactivate ${car.registration_number}?`
    );


    if (!confirmed) {
        return;
    }


    try {

        await apiRequest(
            `/cars/${carId}`,
            {
                method: "DELETE"
            }
        );


        await loadCars();


        showSuccess(
            "Car deactivated successfully."
        );


    } catch (error) {

        console.error(
            "Failed to deactivate car:",
            error
        );


        showError(
            error.message ||
            "Failed to deactivate car."
        );

    }

}

async function activateCar(carId) {

    const car = allCars.find(
        item => Number(item.id) === Number(carId)
    );


    if (!car) {
        showError("Car not found.");
        return;
    }


    const confirmed = window.confirm(
        `Are you sure you want to activate ${car.registration_number}?`
    );


    if (!confirmed) {
        return;
    }


    try {

        await apiRequest(
            `/cars/${carId}/activate`,
            {
                method: "PATCH"
            }
        );


        await loadCars();


        showSuccess(
            "Car activated successfully."
        );


    } catch (error) {

        console.error(
            "Failed to activate car:",
            error
        );


        showError(
            error.message ||
            "Failed to activate car."
        );

    }

}

function capitalizeWords(value) {

    if (!value) {
        return "";
    }

    return value
        .trim()
        .toLowerCase()
        .replace(/\b\w/g, char => char.toUpperCase());

}


function getOwnerDisplay(ownerId) {

    const user = getStoredUser();

    if (!ownerId) {
        return "-";
    }

    // Customer viewing own car
    if (
        user &&
        Number(user.id) === Number(ownerId)
    ) {
        return "You";
    }

    // Owner loaded from backend
    if (ownersMap[ownerId]) {
        return escapeHtml(
            ownersMap[ownerId]
        );
    }

    return `User #${ownerId}`;
}


async function loadOwnersMap() {

    const user = getStoredUser();

    if (!user) {
        return;
    }

    // Customer does not need the complete owner list
    if (user.role === "customer") {
        return;
    }

    try {

        const owners =
            await apiRequest("/cars/owners");

        ownersMap = {};

        owners.forEach(owner => {

            ownersMap[owner.id] =
                owner.name;

        });

    } catch (error) {

        console.error(
            "Failed to load owners:",
            error
        );

    }
}

function handleAdvancedFilter() {

    const searchInput =
        document.getElementById("carSearch");

    const searchTerm =
        searchInput
            ? searchInput.value
                .trim()
                .toLowerCase()
            : "";


    const brandFilter =
        document.getElementById("brandFilter");

    const selectedBrand =
        brandFilter
            ? brandFilter.value
            : "";


    const fuelFilter =
        document.getElementById("fuelFilter");

    const selectedFuel =
        fuelFilter
            ? fuelFilter.value
            : "";


    const statusFilter =
        document.getElementById("statusFilter");

    const selectedStatus =
        statusFilter
            ? statusFilter.value
            : "";


    filteredCars = allCars.filter(car => {

        const matchesSearch =
            !searchTerm ||
            String(car.registration_number)
                .toLowerCase()
                .includes(searchTerm) ||
            String(car.brand)
                .toLowerCase()
                .includes(searchTerm) ||
            String(car.model)
                .toLowerCase()
                .includes(searchTerm);


        const matchesBrand =
            !selectedBrand ||
            car.brand === selectedBrand;


        const matchesFuel =
            !selectedFuel ||
            car.fuel_type === selectedFuel;


        const matchesStatus =
            !selectedStatus ||
            car.status === selectedStatus;


        return (
            matchesSearch &&
            matchesBrand &&
            matchesFuel &&
            matchesStatus
        );

    });


    currentPage = 1;

    updateCarCount();

    renderCars();

}

function clearFilters() {

    const searchInput =
        document.getElementById("carSearch");

    const brandFilter =
        document.getElementById("brandFilter");

    const fuelFilter =
        document.getElementById("fuelFilter");

    const statusFilter =
        document.getElementById("statusFilter");


    if (searchInput) {
        searchInput.value = "";
    }

    if (brandFilter) {
        brandFilter.value = "";
    }

    if (fuelFilter) {
        fuelFilter.value = "";
    }

    if (statusFilter) {
        statusFilter.value = "";
    }


    filteredCars = [...allCars];

    currentPage = 1;

    updateCarCount();

    renderCars();

}