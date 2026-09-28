let allFuelRecords = [];
let filteredFuelRecords = [];

let allFuelCars = [];

let currentFuelPage = 1;

const FUEL_PER_PAGE = 5;

let fuelModal = null;

/*
 * Current editing record.
 * null = Add mode
 * number = Edit mode
 */
let editingFuelId = null;


// ========================================
// INITIALIZE
// ========================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        if (!requireLogin()) {
            return;
        }

        initializeFuelModal();

        setDefaultFuelDate();

        setupFuelEvents();

        await loadFuelCars();

        await loadFuelRecords();

        /*
         * If URL is:
         * fuel.html?edit=5
         *
         * automatically open edit modal
         */
        checkFuelEditMode();
    }
);


// ========================================
// MODAL
// ========================================

function initializeFuelModal() {

    const modalElement =
        document.getElementById("fuelModal");

    if (modalElement) {

        fuelModal =
            new bootstrap.Modal(
                modalElement
            );
    }
}


// ========================================
// EVENTS
// ========================================

function setupFuelEvents() {

    // ------------------------------------
    // ADD FUEL BUTTON
    // ------------------------------------

    const addButton =
        document.getElementById(
            "addFuelButton"
        );

    if (addButton) {

        addButton.addEventListener(
            "click",
            openAddFuelModal
        );
    }


    // ------------------------------------
    // FUEL FORM
    // ------------------------------------

    const fuelForm =
        document.getElementById(
            "fuelForm"
        );

    if (fuelForm) {

        fuelForm.addEventListener(
            "submit",
            handleFuelSubmit
        );
    }


    // ------------------------------------
    // SEARCH
    // ------------------------------------

    const search =
        document.getElementById(
            "fuelSearch"
        );

    if (search) {

        search.addEventListener(
            "input",
            applyFuelFilters
        );
    }


    // ------------------------------------
    // CAR FILTER
    // ------------------------------------

    const carFilter =
        document.getElementById(
            "fuelCarFilter"
        );

    if (carFilter) {

        carFilter.addEventListener(
            "change",
            applyFuelFilters
        );
    }


    // ------------------------------------
    // FUEL TYPE FILTER
    // ------------------------------------

    const typeFilter =
        document.getElementById(
            "fuelTypeFilter"
        );

    if (typeFilter) {

        typeFilter.addEventListener(
            "change",
            applyFuelFilters
        );
    }


    // ------------------------------------
    // CLEAR FILTERS
    // ------------------------------------

    const clearButton =
        document.getElementById(
            "clearFuelFilters"
        );

    if (clearButton) {

        clearButton.addEventListener(
            "click",
            clearFuelFilters
        );
    }


    // ------------------------------------
    // REFRESH
    // ------------------------------------

    const refreshButton =
        document.getElementById(
            "refreshFuelButton"
        );

    if (refreshButton) {

        refreshButton.addEventListener(
            "click",
            loadFuelRecords
        );
    }


    // ------------------------------------
    // AUTO CALCULATE TOTAL
    // ------------------------------------

    const litres =
        document.getElementById(
            "fuelLitres"
        );

    const price =
        document.getElementById(
            "fuelPrice"
        );

    if (litres) {

        litres.addEventListener(
            "input",
            calculateFuelTotal
        );
    }

    if (price) {

        price.addEventListener(
            "input",
            calculateFuelTotal
        );
    }
}


// ========================================
// DEFAULT DATE
// ========================================

function setDefaultFuelDate() {

    const dateInput =
        document.getElementById(
            "fuelDate"
        );

    if (!dateInput) {
        return;
    }

    const today =
        new Date();

    const year =
        today.getFullYear();

    const month =
        String(
            today.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            today.getDate()
        ).padStart(2, "0");

    dateInput.value =
        `${year}-${month}-${day}`;
}


// ========================================
// LOAD CARS
// ========================================

async function loadFuelCars() {

    try {

        allFuelCars =
            await apiRequest(
                "/cars/"
            );

        populateCarDropdowns();

    } catch (error) {

        console.error(
            "Failed to load cars:",
            error
        );

        showFuelError(
            error.message ||
            "Failed to load cars."
        );
    }
}


// ========================================
// CAR DROPDOWNS
// ========================================

function populateCarDropdowns() {

    const filter =
        document.getElementById(
            "fuelCarFilter"
        );

    const formCar =
        document.getElementById(
            "fuelCar"
        );


    // ------------------------------------
    // FILTER DROPDOWN
    // ------------------------------------

    if (filter) {

        filter.innerHTML = `
            <option value="">
                All Cars
            </option>
        `;
    }


    // ------------------------------------
    // FORM CAR DROPDOWN
    // ------------------------------------

    if (formCar) {

        formCar.innerHTML = `
            <option value="">
                Select Car
            </option>
        `;
    }


    // ------------------------------------
    // ADD OPTIONS
    // ------------------------------------

    allFuelCars.forEach(car => {

        const label =
            `${car.registration_number} - ${car.brand} ${car.model}`;


        if (filter) {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                car.id;

            option.textContent =
                label;

            filter.appendChild(
                option
            );
        }


        if (formCar) {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                car.id;

            option.textContent =
                label;

            formCar.appendChild(
                option
            );
        }

    });

}


// ========================================
// LOAD FUEL RECORDS
// ========================================

async function loadFuelRecords() {

    showFuelLoading();

    hideFuelMessages();

    try {

        allFuelRecords =
            await apiRequest(
                "/fuel/"
            );

        filteredFuelRecords =
            [...allFuelRecords];

        currentFuelPage = 1;

        renderFuelRecords();

        updateFuelCount();

    } catch (error) {

        console.error(
            "Failed to load fuel records:",
            error
        );

        showFuelError(
            error.message ||
            "Failed to load fuel records."
        );
    }
}


// ========================================
// FILTERS
// ========================================

function applyFuelFilters() {

    const search =
        (
            document.getElementById(
                "fuelSearch"
            )?.value || ""
        )
            .trim()
            .toLowerCase();


    const carId =
        document.getElementById(
            "fuelCarFilter"
        )?.value || "";


    const fuelType =
        document.getElementById(
            "fuelTypeFilter"
        )?.value || "";


    filteredFuelRecords =
        allFuelRecords.filter(
            fuel => {

                const station =
                    (
                        fuel.fuel_station || ""
                    ).toLowerCase();


                const type =
                    (
                        fuel.fuel_type || ""
                    ).toLowerCase();


                const searchMatch =
                    !search ||
                    station.includes(search) ||
                    type.includes(search);


                const carMatch =
                    !carId ||
                    String(fuel.car_id) ===
                    String(carId);


                const typeMatch =
                    !fuelType ||
                    type === fuelType.toLowerCase();


                return (
                    searchMatch &&
                    carMatch &&
                    typeMatch
                );
            }
        );


    currentFuelPage = 1;

    renderFuelRecords();

    updateFuelCount();
}


// ========================================
// CLEAR FILTERS
// ========================================

function clearFuelFilters() {

    const search =
        document.getElementById(
            "fuelSearch"
        );

    const carFilter =
        document.getElementById(
            "fuelCarFilter"
        );

    const typeFilter =
        document.getElementById(
            "fuelTypeFilter"
        );


    if (search) {
        search.value = "";
    }

    if (carFilter) {
        carFilter.value = "";
    }

    if (typeFilter) {
        typeFilter.value = "";
    }


    filteredFuelRecords =
        [...allFuelRecords];

    currentFuelPage = 1;

    renderFuelRecords();

    updateFuelCount();
}


// ========================================
// RENDER RECORDS
// ========================================

function renderFuelRecords() {

    const tableBody =
        document.getElementById(
            "fuelTableBody"
        );

    const emptyState =
        document.getElementById(
            "fuelEmptyState"
        );

    const loading =
        document.getElementById(
            "fuelLoading"
        );


    if (!tableBody) {
        return;
    }


    if (loading) {

        loading.classList.add(
            "d-none"
        );
    }


    tableBody.innerHTML = "";


    // ------------------------------------
    // EMPTY
    // ------------------------------------

    if (
        !filteredFuelRecords ||
        filteredFuelRecords.length === 0
    ) {

        emptyState?.classList.remove(
            "d-none"
        );

        renderFuelPagination();

        return;
    }


    emptyState?.classList.add(
        "d-none"
    );


    // ------------------------------------
    // PAGINATION
    // ------------------------------------

    const start =
        (
            currentFuelPage - 1
        ) * FUEL_PER_PAGE;


    const end =
        start + FUEL_PER_PAGE;


    const pageRecords =
        filteredFuelRecords.slice(
            start,
            end
        );


    // ------------------------------------
    // TABLE
    // ------------------------------------

    pageRecords.forEach(
        (fuel, index) => {

            const row =
                document.createElement(
                    "tr"
                );


            const car =
                getFuelCar(
                    fuel.car_id
                );


            const carLabel =
                car
                    ? `${car.registration_number} - ${car.brand} ${car.model}`
                    : `Car #${fuel.car_id}`;


            row.innerHTML = `

                <td>
                    ${start + index + 1}
                </td>


                <td>
                    <strong>
                        ${escapeFuelHtml(
                            carLabel
                        )}
                    </strong>
                </td>


                <td>
                    ${formatFuelDate(
                        fuel.fuel_date
                    )}
                </td>


                <td>
                    ${Number(
                        fuel.odometer_reading
                    ).toLocaleString(
                        "en-IN"
                    )} km
                </td>


                <td>
                    <span class="fuel-type-badge">
                        ${escapeFuelHtml(
                            capitalizeFuelWords(
                                fuel.fuel_type
                            )
                        )}
                    </span>
                </td>


                <td>
                    ${Number(
                        fuel.litres
                    ).toLocaleString(
                        "en-IN",
                        {
                            maximumFractionDigits: 2
                        }
                    )} L
                </td>


                <td>
                    ${formatFuelCurrency(
                        fuel.price_per_litre
                    )}
                </td>


                <td>
                    <strong>
                        ${formatFuelCurrency(
                            fuel.total_cost
                        )}
                    </strong>
                </td>


                <td>
                    ${escapeFuelHtml(
                        fuel.fuel_station || "-"
                    )}
                </td>


                <td>

                    <div class="d-flex gap-1">

                        <!-- VIEW -->

                        <button
                            type="button"
                            class="btn btn-sm btn-outline-primary"
                            onclick="viewFuel(${fuel.id})"
                        >
                            View
                        </button>


                        <!-- EDIT -->

                        <button
                            type="button"
                            class="btn btn-sm btn-outline-warning"
                            onclick="editFuel(${fuel.id})"
                        >
                            Edit
                        </button>


                        <!-- DELETE -->

                        <button
                            type="button"
                            class="btn btn-sm btn-outline-danger"
                            onclick="deleteFuel(${fuel.id})"
                        >
                            Delete
                        </button>

                    </div>

                </td>

            `;


            tableBody.appendChild(
                row
            );

        }
    );


    renderFuelPagination();
}


// ========================================
// GET CAR
// ========================================

function getFuelCar(carId) {

    return allFuelCars.find(
        car =>
            String(car.id) ===
            String(carId)
    );
}


// ========================================
// PAGINATION
// ========================================

function renderFuelPagination() {

    const container =
        document.getElementById(
            "fuelPaginationContainer"
        );

    const info =
        document.getElementById(
            "fuelPaginationInfo"
        );

    const pagination =
        document.getElementById(
            "fuelPagination"
        );


    if (!container || !pagination) {
        return;
    }


    const total =
        filteredFuelRecords.length;


    const totalPages =
        Math.ceil(
            total / FUEL_PER_PAGE
        );


    pagination.innerHTML = "";


    if (total === 0) {

        container.classList.add(
            "d-none"
        );

        return;
    }


    container.classList.remove(
        "d-none"
    );


    const start =
        (
            currentFuelPage - 1
        ) * FUEL_PER_PAGE + 1;


    const end =
        Math.min(
            currentFuelPage *
            FUEL_PER_PAGE,
            total
        );


    if (info) {

        info.textContent =
            `Showing ${start}-${end} of ${total} records`;
    }


    for (
        let page = 1;
        page <= totalPages;
        page++
    ) {

        const li =
            document.createElement(
                "li"
            );


        li.className =
            `page-item ${
                page === currentFuelPage
                    ? "active"
                    : ""
            }`;


        const button =
            document.createElement(
                "button"
            );


        button.className =
            "page-link";


        button.textContent =
            page;


        button.addEventListener(
            "click",
            () => {

                currentFuelPage =
                    page;

                renderFuelRecords();

            }
        );


        li.appendChild(
            button
        );


        pagination.appendChild(
            li
        );
    }
}


// ========================================
// ADD FUEL MODAL
// ========================================

function openAddFuelModal() {

    /*
     * Important:
     * Add mode
     */
    editingFuelId = null;


    const form =
        document.getElementById(
            "fuelForm"
        );


    if (form) {
        form.reset();
    }


    setDefaultFuelDate();

    calculateFuelTotal();

    hideFuelMessages();


    const title =
        document.querySelector(
            "#fuelModal .modal-title"
        );

    if (title) {

        title.textContent =
            "Add Fuel Record";
    }


    const saveButton =
        document.getElementById(
            "saveFuelButton"
        );

    if (saveButton) {

        saveButton.disabled = false;

        saveButton.textContent =
            "Save Fuel";
    }


    if (fuelModal) {
        fuelModal.show();
    }
}


// ========================================
// HANDLE ADD / EDIT SUBMIT
// ========================================

async function handleFuelSubmit(event) {

    event.preventDefault();


    if (editingFuelId) {

        await handleUpdateFuel(
            editingFuelId
        );

    } else {

        await handleCreateFuel(
            event
        );
    }
}


// ========================================
// CREATE FUEL
// ========================================

async function handleCreateFuel(event) {

    /*
     * event may already be prevented
     * by handleFuelSubmit().
     */
    if (event) {
        event.preventDefault();
    }


    const saveButton =
        document.getElementById(
            "saveFuelButton"
        );


    const payload =
        getFuelFormPayload();


    // ------------------------------------
    // VALIDATION
    // ------------------------------------

    if (!validateFuelPayload(payload)) {
        return;
    }


    try {

        if (saveButton) {

            saveButton.disabled = true;

            saveButton.textContent =
                "Saving...";
        }


        await apiRequest(
            "/fuel/",
            {
                method: "POST",

                body: JSON.stringify(
                    payload
                )
            }
        );


        if (fuelModal) {
            fuelModal.hide();
        }


        await loadFuelRecords();


        showFuelSuccess(
            "Fuel record added successfully."
        );


    } catch (error) {

        console.error(
            "Failed to create fuel:",
            error
        );


        showFuelError(
            error.message ||
            "Failed to create fuel record."
        );


    } finally {

        if (saveButton) {

            saveButton.disabled = false;

            saveButton.textContent =
                "Save Fuel";
        }
    }
}


// ========================================
// EDIT FUEL
// ========================================

function editFuel(fuelId) {

    openFuelModal(
        fuelId
    );
}


// ========================================
// OPEN EDIT MODAL
// ========================================

async function openFuelModal(
    fuelId = null
) {

    /*
     * Save editing ID
     */
    editingFuelId =
        fuelId
            ? Number(fuelId)
            : null;


    const modalElement =
        document.getElementById(
            "fuelModal"
        );


    if (!modalElement) {

        console.error(
            "Fuel modal not found."
        );

        return;
    }


    const form =
        document.getElementById(
            "fuelForm"
        );


    if (form) {
        form.reset();
    }


    hideFuelMessages();


    const title =
        document.querySelector(
            "#fuelModal .modal-title"
        );


    const saveButton =
        document.getElementById(
            "saveFuelButton"
        );


    // ====================================
    // ADD MODE
    // ====================================

    if (!fuelId) {

        if (title) {

            title.textContent =
                "Add Fuel Record";
        }


        if (saveButton) {

            saveButton.disabled = false;

            saveButton.textContent =
                "Save Fuel";
        }


        setDefaultFuelDate();

        calculateFuelTotal();

    }


    // ====================================
    // EDIT MODE
    // ====================================

    else {

        if (title) {

            title.textContent =
                "Edit Fuel Record";
        }


        if (saveButton) {

            saveButton.disabled = true;

            saveButton.textContent =
                "Loading...";
        }


        try {

            await loadFuelForEdit(
                fuelId
            );


            if (saveButton) {

                saveButton.disabled = false;

                saveButton.textContent =
                    "Update Fuel";
            }

        } catch (error) {

            console.error(
                "Failed to load fuel for edit:",
                error
            );


            editingFuelId = null;

            return;
        }
    }


    const modal =
        bootstrap.Modal.getOrCreateInstance(
            modalElement
        );


    modal.show();
}


// ========================================
// LOAD FUEL FOR EDIT
// ========================================

async function loadFuelForEdit(
    fuelId
) {

    try {

        const fuel =
            await apiRequest(
                `/fuel/${fuelId}`
            );


        if (!fuel) {

            throw new Error(
                "Fuel record not found."
            );
        }


        /*
         * Make sure edit mode stays active.
         */
        editingFuelId =
            Number(fuel.id);


        // --------------------------------
        // CAR
        // --------------------------------

        setFuelFormValue(
            "fuelCar",
            fuel.car_id
        );


        // --------------------------------
        // DATE
        // --------------------------------

        setFuelFormValue(
            "fuelDate",
            fuel.fuel_date
        );


        // --------------------------------
        // ODOMETER
        // --------------------------------

        setFuelFormValue(
            "fuelOdometer",
            fuel.odometer_reading
        );


        // --------------------------------
        // FUEL TYPE
        // --------------------------------

        setFuelFormValue(
            "fuelType",
            fuel.fuel_type
        );


        // --------------------------------
        // LITRES
        // --------------------------------

        setFuelFormValue(
            "fuelLitres",
            fuel.litres
        );


        // --------------------------------
        // PRICE
        // --------------------------------

        setFuelFormValue(
            "fuelPrice",
            fuel.price_per_litre
        );


        // --------------------------------
        // TOTAL
        // --------------------------------

        setFuelFormValue(
            "fuelTotal",
            fuel.total_cost
        );


        // --------------------------------
        // STATION
        // --------------------------------

        setFuelFormValue(
            "fuelStation",
            fuel.fuel_station || ""
        );


        // --------------------------------
        // NOTES
        // --------------------------------

        setFuelFormValue(
            "fuelNotes",
            fuel.notes || ""
        );


    } catch (error) {

        console.error(
            "Failed to load fuel record:",
            error
        );


        showFuelError(
            error.message ||
            "Failed to load fuel record."
        );


        throw error;
    }
}


// ========================================
// UPDATE FUEL
// ========================================

async function handleUpdateFuel(
    fuelId
) {

    const saveButton =
        document.getElementById(
            "saveFuelButton"
        );


    const payload =
        getFuelFormPayload();


    // ------------------------------------
    // VALIDATION
    // ------------------------------------

    if (!validateFuelPayload(payload)) {
        return;
    }


    try {

        if (saveButton) {

            saveButton.disabled = true;

            saveButton.textContent =
                "Updating...";
        }


        await apiRequest(
            `/fuel/${fuelId}`,
            {
                method: "PUT",

                body: JSON.stringify(
                    payload
                )
            }
        );


        /*
         * Reset edit mode before
         * closing modal.
         */
        editingFuelId = null;


        if (fuelModal) {
            fuelModal.hide();
        }


        /*
         * Refresh list
         */
        await loadFuelRecords();


        /*
         * Show success after refresh
         */
        showFuelSuccess(
            "Fuel record updated successfully."
        );


    } catch (error) {

        console.error(
            "Failed to update fuel:",
            error
        );


        showFuelError(
            error.message ||
            "Failed to update fuel record."
        );


    } finally {

        if (saveButton) {

            saveButton.disabled = false;

            saveButton.textContent =
                "Save Fuel";
        }
    }
}


// ========================================
// GET FORM PAYLOAD
// ========================================

function getFuelFormPayload() {

    return {

        car_id:
            Number(
                document.getElementById(
                    "fuelCar"
                )?.value || 0
            ),


        fuel_date:
            document.getElementById(
                "fuelDate"
            )?.value || "",


        odometer_reading:
            Number(
                document.getElementById(
                    "fuelOdometer"
                )?.value || 0
            ),


        fuel_type:
            document.getElementById(
                "fuelType"
            )?.value || "",


        litres:
            Number(
                document.getElementById(
                    "fuelLitres"
                )?.value || 0
            ),


        price_per_litre:
            Number(
                document.getElementById(
                    "fuelPrice"
                )?.value || 0
            ),


        total_cost:
            Number(
                document.getElementById(
                    "fuelTotal"
                )?.value || 0
            ),


        fuel_station:
            document.getElementById(
                "fuelStation"
            )?.value.trim() || null,


        notes:
            document.getElementById(
                "fuelNotes"
            )?.value.trim() || null
    };
}


// ========================================
// VALIDATE FUEL
// ========================================

function validateFuelPayload(
    payload
) {

    if (!payload.car_id) {

        showFuelError(
            "Please select a car."
        );

        return false;
    }


    if (!payload.fuel_date) {

        showFuelError(
            "Please select fuel date."
        );

        return false;
    }


    if (
        payload.odometer_reading <= 0
    ) {

        showFuelError(
            "Please enter a valid odometer reading."
        );

        return false;
    }


    if (!payload.fuel_type) {

        showFuelError(
            "Please select fuel type."
        );

        return false;
    }


    if (payload.litres <= 0) {

        showFuelError(
            "Please enter valid litres."
        );

        return false;
    }


    if (
        payload.price_per_litre <= 0
    ) {

        showFuelError(
            "Please enter valid price per litre."
        );

        return false;
    }


    if (payload.total_cost <= 0) {

        showFuelError(
            "Please enter valid total cost."
        );

        return false;
    }


    return true;
}


// ========================================
// SET FORM VALUE
// ========================================

function setFuelFormValue(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (!element) {

        console.warn(
            `Element #${id} not found.`
        );

        return;
    }


    element.value =
        value ?? "";
}


// ========================================
// EDIT MODE FROM URL
// ========================================

function checkFuelEditMode() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    const editId =
        params.get(
            "edit"
        );


    if (!editId) {
        return;
    }


    const fuelId =
        Number(editId);


    if (!fuelId) {
        return;
    }


    /*
     * Open edit modal.
     */
    openFuelModal(
        fuelId
    );
}


// ========================================
// AUTO CALCULATE TOTAL
// ========================================

function calculateFuelTotal() {

    const litres =
        Number(
            document.getElementById(
                "fuelLitres"
            )?.value || 0
        );


    const price =
        Number(
            document.getElementById(
                "fuelPrice"
            )?.value || 0
        );


    const total =
        litres * price;


    const totalInput =
        document.getElementById(
            "fuelTotal"
        );


    if (
        totalInput &&
        litres > 0 &&
        price > 0
    ) {

        totalInput.value =
            total.toFixed(2);
    }
}


// ========================================
// VIEW FUEL
// ========================================

function viewFuel(
    fuelId
) {

    window.location.href =
        `fuel-details.html?id=${fuelId}`;
}


// ========================================
// DELETE FUEL
// ========================================

async function deleteFuel(
    fuelId
) {

    const confirmed =
        window.confirm(
            "Are you sure you want to delete this fuel record?"
        );


    if (!confirmed) {
        return;
    }


    try {

        await apiRequest(
            `/fuel/${fuelId}`,
            {
                method: "DELETE"
            }
        );


        await loadFuelRecords();


        showFuelSuccess(
            "Fuel record deleted successfully."
        );


    } catch (error) {

        console.error(
            "Failed to delete fuel:",
            error
        );


        showFuelError(
            error.message ||
            "Failed to delete fuel record."
        );
    }
}


// ========================================
// LOADING
// ========================================

function showFuelLoading() {

    const loading =
        document.getElementById(
            "fuelLoading"
        );


    const empty =
        document.getElementById(
            "fuelEmptyState"
        );


    if (loading) {

        loading.classList.remove(
            "d-none"
        );
    }


    if (empty) {

        empty.classList.add(
            "d-none"
        );
    }
}


// ========================================
// MESSAGES
// ========================================

function hideFuelMessages() {

    document
        .getElementById(
            "successMessage"
        )
        ?.classList.add(
            "d-none"
        );


    document
        .getElementById(
            "errorMessage"
        )
        ?.classList.add(
            "d-none"
        );
}


// ========================================
// SUCCESS MESSAGE
// ========================================

function showFuelSuccess(
    message
) {

    const element =
        document.getElementById(
            "successMessage"
        );


    if (!element) {
        return;
    }


    element.textContent =
        message;


    element.classList.remove(
        "d-none"
    );


    setTimeout(() => {

        element.classList.add(
            "d-none"
        );

    }, 4000);
}


// ========================================
// ERROR MESSAGE
// ========================================

function showFuelError(
    message
) {

    const element =
        document.getElementById(
            "errorMessage"
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


// ========================================
// FORMAT DATE
// ========================================

function formatFuelDate(
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
// FORMAT CURRENCY
// ========================================

function formatFuelCurrency(
    value
) {

    if (value == null) {
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
// CAPITALIZE
// ========================================

function capitalizeFuelWords(
    value
) {

    if (!value) {
        return "-";
    }


    return String(value)
        .toLowerCase()
        .replace(
            /\b\w/g,
            char =>
                char.toUpperCase()
        );
}


// ========================================
// ESCAPE HTML
// ========================================

function escapeFuelHtml(
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
// UPDATE FUEL COUNT
// ========================================

function updateFuelCount() {

    const countElement =
        document.getElementById(
            "fuelRecordCount"
        );


    if (!countElement) {
        return;
    }


    const count =
        filteredFuelRecords.length;


    countElement.textContent =
        `${count} ${
            count === 1
                ? "record"
                : "records"
        } found`;
}