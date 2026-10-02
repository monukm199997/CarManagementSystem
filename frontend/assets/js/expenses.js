/* =========================================================
   EXPENSES PAGE
========================================================= */

let allExpenses = [];
let allCars = [];
let expenseCategories = [];

let editingExpenseId = null;


/* =========================================================
   INITIAL LOAD
========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

    try {

        await loadCars();

        await loadExpenseCategories();

        applyExpenseUrlFilters();

        await loadExpenses();

        setupExpenseEvents();

        const params =
            new URLSearchParams(
                window.location.search
            );

        const editExpenseId =
            params.get("edit_expense_id");

        if (editExpenseId) {

            const expense =
                allExpenses.find(
                    item =>
                        Number(item.id) ===
                        Number(editExpenseId)
                );

            if (expense) {

                await editExpense(expense.id);

            } else {

                /*
                 * Expense may be inactive and therefore
                 * hidden from normal list.
                 */

                try {

                    const expenseDetails =
                        await apiRequest(
                            `/expenses/${editExpenseId}`
                        );

                    if (
                        expenseDetails.status ===
                        "active"
                    ) {

                        await openExpenseModal(
                            expenseDetails
                        );

                    } else {

                        alert(
                            "Inactive expenses cannot be edited."
                        );

                    }

                } catch (error) {

                    alert(
                        error.message ||
                        "Expense could not be loaded."
                    );

                }

            }

        }

    } catch (error) {

        console.error(
            "Expense page initialization error:",
            error
        );

        showExpenseError(
            error.message ||
            "Failed to load expense page."
        );

    }

});


/* =========================================================
   EVENTS
========================================================= */

function setupExpenseEvents() {

    const form =
        document.getElementById("expenseForm");

    if (form) {

        form.addEventListener(
            "submit",
            handleExpenseSubmit
        );

    }


    const carFilter =
        document.getElementById(
            "expenseCarFilter"
        );

    const categoryFilter =
        document.getElementById(
            "expenseCategoryFilter"
        );

    const fromDate =
        document.getElementById(
            "expenseFromDate"
        );

    const toDate =
        document.getElementById(
            "expenseToDate"
        );

    const search =
        document.getElementById(
            "expenseSearch"
        );

    const includeInactive =
        document.getElementById(
            "includeInactiveExpenses"
        );


    [
        carFilter,
        categoryFilter,
        includeInactive
    ].forEach(element => {

        if (element) {

            element.addEventListener(
                "change",
                loadExpenses
            );

        }

    });


    /*
     * From date
     */

    if (fromDate) {

        fromDate.addEventListener(
            "change",
            () => {

                if (toDate && fromDate.value) {

                    toDate.min =
                        fromDate.value;

                }

                if (
                    fromDate.value &&
                    toDate.value &&
                    fromDate.value > toDate.value
                ) {

                    alert(
                        "From Date cannot be later than To Date."
                    );

                    fromDate.value = "";

                    if (toDate) {
                        toDate.min = "";
                    }

                    return;

                }

                loadExpenses();

            }
        );

    }


    /*
     * To date
     */

    if (toDate) {

        toDate.addEventListener(
            "change",
            () => {

                if (
                    fromDate.value &&
                    toDate.value &&
                    fromDate.value > toDate.value
                ) {

                    alert(
                        "From Date cannot be later than To Date."
                    );

                    toDate.value = "";

                    return;

                }

                loadExpenses();

            }
        );

    }


    /*
     * Search
     */

    if (search) {

        search.addEventListener(
            "input",
            applyExpenseSearch
        );

    }


    /*
     * Car change inside expense form
     */

    const expenseCar =
        document.getElementById(
            "expenseCar"
        );

    if (expenseCar) {

        expenseCar.addEventListener(
            "change",
            async function () {

                const carId =
                    this.value;

                resetExpenseDriverAndTrip();

                if (!carId) {
                    return;
                }

                await loadExpenseDrivers(
                    carId
                );

            }
        );

    }


    /*
     * Driver change inside expense form
     */

    const expenseDriver =
        document.getElementById(
            "expenseDriver"
        );

    if (expenseDriver) {

        expenseDriver.addEventListener(
            "change",
            async function () {

                const driverId =
                    this.value;

                const carId =
                    document.getElementById(
                        "expenseCar"
                    )?.value;

                if (!carId) {

                    resetExpenseTrip();

                    return;

                }

                await loadExpenseTrips(
                    carId,
                    driverId || null
                );

            }
        );

    }

}


/* =========================================================
   LOAD CARS
========================================================= */

async function loadCars() {

    const data =
        await apiRequest("/cars/");

    allCars =
        Array.isArray(data)
            ? data
            : (
                data?.items ||
                data?.cars ||
                []
            );

    populateCarDropdowns();

}


/* =========================================================
   CAR DROPDOWNS
========================================================= */

function populateCarDropdowns() {

    const filter =
        document.getElementById(
            "expenseCarFilter"
        );

    const formSelect =
        document.getElementById(
            "expenseCar"
        );


    /*
     * Filter dropdown
     */

    if (filter) {

        filter.innerHTML = `
            <option value="">
                All Cars
            </option>
        `;

        allCars.forEach(car => {

            filter.insertAdjacentHTML(
                "beforeend",
                `
                    <option value="${car.id}">
                        ${escapeExpenseHtml(
                    getCarDisplayName(car)
                )}
                    </option>
                `
            );

        });

    }


    /*
     * Form dropdown
     */

    if (formSelect) {

        formSelect.innerHTML = `
            <option value="">
                Select Car
            </option>
        `;

        allCars.forEach(car => {

            formSelect.insertAdjacentHTML(
                "beforeend",
                `
                    <option value="${car.id}">
                        ${escapeExpenseHtml(
                    getCarDisplayName(car)
                )}
                    </option>
                `
            );

        });

    }

}


/* =========================================================
   LOAD CATEGORIES
========================================================= */

async function loadExpenseCategories() {

    const data =
        await apiRequest(
            "/expenses/categories"
        );

    expenseCategories =
        Array.isArray(data)
            ? data
            : [];

    populateCategoryDropdowns();

}


/* =========================================================
   CATEGORY DROPDOWNS
========================================================= */

function populateCategoryDropdowns() {

    const filter =
        document.getElementById(
            "expenseCategoryFilter"
        );

    const formSelect =
        document.getElementById(
            "expenseCategory"
        );


    /*
     * Filter
     */

    if (filter) {

        filter.innerHTML = `
            <option value="">
                All Categories
            </option>
        `;

        expenseCategories.forEach(category => {

            filter.insertAdjacentHTML(
                "beforeend",
                `
                    <option value="${escapeExpenseHtml(
                    category.value
                )}">
                        ${escapeExpenseHtml(
                    category.label
                )}
                    </option>
                `
            );

        });

    }


    /*
     * Form
     */

    if (formSelect) {

        formSelect.innerHTML = `
            <option value="">
                Select Category
            </option>
        `;

        expenseCategories.forEach(category => {

            formSelect.insertAdjacentHTML(
                "beforeend",
                `
                    <option value="${escapeExpenseHtml(
                    category.value
                )}">
                        ${escapeExpenseHtml(
                    category.label
                )}
                    </option>
                `
            );

        });

    }

}


/* =========================================================
   LOAD EXPENSES
========================================================= */

async function loadExpenses() {

    try {

        const params =
            new URLSearchParams();


        const carId =
            document.getElementById(
                "expenseCarFilter"
            )?.value;

        const category =
            document.getElementById(
                "expenseCategoryFilter"
            )?.value;

        const fromDate =
            document.getElementById(
                "expenseFromDate"
            )?.value;

        const toDate =
            document.getElementById(
                "expenseToDate"
            )?.value;

        const includeInactive =
            document.getElementById(
                "includeInactiveExpenses"
            )?.checked;


        if (
            fromDate &&
            toDate &&
            fromDate > toDate
        ) {

            alert(
                "From Date cannot be later than To Date."
            );

            return;

        }


        if (carId) {

            params.append(
                "car_id",
                carId
            );

        }


        if (category) {

            params.append(
                "category",
                category
            );

        }


        if (fromDate) {

            params.append(
                "from_date",
                fromDate
            );

        }


        if (toDate) {

            params.append(
                "to_date",
                toDate
            );

        }


        if (includeInactive) {

            params.append(
                "include_inactive",
                "true"
            );

        }


        const queryString =
            params.toString()
                ? `?${params.toString()}`
                : "";


        const data =
            await apiRequest(
                `/expenses/${queryString}`
            );


        allExpenses =
            Array.isArray(data)
                ? data
                : (
                    data?.items ||
                    data?.expenses ||
                    []
                );


        renderExpenseTable(
            allExpenses
        );

        updateExpenseSummary(
            allExpenses
        );

        applyExpenseSearch();


    } catch (error) {

        console.error(
            "Failed to load expenses:",
            error
        );

        showExpenseError(
            error.message ||
            "Failed to load expenses."
        );

    }

}


/* =========================================================
   SEARCH
========================================================= */

function applyExpenseSearch() {

    const searchInput =
        document.getElementById(
            "expenseSearch"
        );

    const searchValue =
        (searchInput?.value || "")
            .trim()
            .toLowerCase();


    if (!searchValue) {

        renderExpenseTable(
            allExpenses
        );

        updateExpenseSummary(
            allExpenses
        );

        return;

    }


    const filtered =
        allExpenses.filter(expense => {

            const driverName =
                expense.driver?.name || "";

            const driverPhone =
                expense.driver?.phone || "";

            const tripText =
                expense.trip
                    ? `${expense.trip.start_location || ""} ${expense.trip.destination || ""}`
                    : "";

            const searchableText = [

                expense.description,

                expense.vendor,

                expense.receipt_number,

                expense.category,

                driverName,

                driverPhone,

                tripText,

                getCarDisplayName(
                    getCarById(
                        expense.car_id
                    )
                )

            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();


            return searchableText.includes(
                searchValue
            );

        });


    renderExpenseTable(
        filtered
    );

    updateExpenseSummary(
        filtered
    );

}


/* =========================================================
   TABLE
========================================================= */

/* =========================================================
   TABLE
========================================================= */

function renderExpenseTable(expenses) {

    const tbody =
        document.getElementById(
            "expenseTableBody"
        );

    if (!tbody) return;


    if (!expenses.length) {

        tbody.innerHTML = `
            <tr>
                <td
                    colspan="12"
                    class="expense-empty-cell"
                >
                    No expenses found.
                </td>
            </tr>
        `;

        updateExpenseSubtitle(0);

        return;
    }


    tbody.innerHTML =
        expenses
            .map((expense, index) => {

                const car =
                    getCarById(
                        expense.car_id
                    );

                const categoryLabel =
                    getCategoryLabel(
                        expense.category
                    );


                const statusClass =
                    expense.status === "active"
                        ? "expense-status-active"
                        : "expense-status-inactive";


                const statusLabel =
                    capitalize(
                        expense.status ||
                        "active"
                    );


                const actionButton =
                    expense.status === "active"
                        ? `
                            <button
                                type="button"
                                class="
                                    expense-action-btn
                                    expense-deactivate-btn
                                "
                                onclick="
                                    deactivateExpense(
                                        ${expense.id}
                                    )
                                "
                            >
                                Deactivate
                            </button>
                        `
                        : `
                            <button
                                type="button"
                                class="
                                    expense-action-btn
                                    expense-activate-btn
                                "
                                onclick="
                                    activateExpense(
                                        ${expense.id}
                                    )
                                "
                            >
                                Activate
                            </button>
                        `;


                return `
                    <tr>

                        <!-- # -->
                        <td>
                            ${index + 1}
                        </td>


                        <!-- Date -->
                        <td>
                            ${formatExpenseDate(
                    expense.expense_date
                )}
                        </td>


                        <!-- Vehicle -->
                        <td>

                            <div class="expense-car-name">
                                ${escapeExpenseHtml(
                    getCarDisplayName(car)
                )}
                            </div>

                            ${car?.id
                        ? `
                                        <div
                                            class="
                                                expense-car-meta
                                            "
                                        >
                                            Car ID:
                                            ${car.id}
                                        </div>
                                    `
                        : ""
                    }

                        </td>


                        <!-- Category -->
                        <td>

                            <span
                                class="
                                    expense-category-badge
                                "
                            >
                                ${escapeExpenseHtml(
                        categoryLabel
                    )}
                            </span>

                        </td>


                        <!-- Driver -->
                        <td>

                            ${expense.driver
                        ? `
                                        <div
                                            class="
                                                expense-car-name
                                            "
                                        >
                                            ${escapeExpenseHtml(
                            expense.driver.name
                        )}
                                        </div>

                                        <div
                                            class="
                                                expense-car-meta
                                            "
                                        >
                                            ${escapeExpenseHtml(
                            expense.driver.phone || ""
                        )}
                                        </div>
                                    `
                        : "-"
                    }

                        </td>


                        <!-- Trip -->
                        <td>

                            ${expense.trip
                        ? `
                                        <div
                                            class="
                                                expense-car-name
                                            "
                                        >
                                            #${expense.trip.id}
                                            -
                                            ${escapeExpenseHtml(
                            expense.trip.start_location
                        )}
                                            →
                                            ${escapeExpenseHtml(
                            expense.trip.destination
                        )}
                                        </div>

                                        <div
                                            class="
                                                expense-car-meta
                                            "
                                        >
                                            ${capitalize(
                            expense.trip.status || ""
                        )}
                                        </div>
                                    `
                        : "-"
                    }

                        </td>


                        <!-- Description -->
                        <td>

                            ${escapeExpenseHtml(
                        expense.description || "-"
                    )}

                        </td>


                        <!-- Vendor -->
                        <td>

                            ${escapeExpenseHtml(
                        expense.vendor || "-"
                    )}

                        </td>


                        <!-- Payment Method -->
                        <td>

                            ${escapeExpenseHtml(
                        formatPaymentMethod(
                            expense.payment_method
                        )
                    )}

                        </td>


                        <!-- Amount -->
                        <td>

                            <span
                                class="expense-amount"
                            >
                                ${formatExpenseAmount(
                        expense.amount
                    )}
                            </span>

                        </td>


                        <!-- Status -->
                        <td>

                            <span
                                class="
                                    expense-status-badge
                                    ${statusClass}
                                "
                            >
                                ${statusLabel}
                            </span>

                        </td>


                        <!-- Actions -->
                        <td>

                            <div
                                class="expense-actions"
                            >

                                <button
                                    type="button"
                                    class="
                                        expense-action-btn
                                        expense-view-btn
                                    "
                                    onclick="
                                        viewExpense(
                                            ${expense.id}
                                        )
                                    "
                                >
                                    View
                                </button>


                                ${expense.status === "active"
                        ? `
                                            <button
                                                type="button"
                                                class="
                                                    expense-action-btn
                                                    expense-edit-btn
                                                "
                                                onclick="
                                                    editExpense(
                                                        ${expense.id}
                                                    )
                                                "
                                            >
                                                Edit
                                            </button>
                                        `
                        : ""
                    }


                                ${actionButton}

                            </div>

                        </td>

                    </tr>
                `;

            })
            .join("");


    updateExpenseSubtitle(
        expenses.length
    );

}

/* =========================================================
   SUMMARY
========================================================= */

function updateExpenseSummary(expenses) {

    const totalAmount =
        expenses.reduce(
            (sum, expense) =>
                sum +
                Number(
                    expense.amount || 0
                ),
            0
        );


    const totalCount =
        expenses.length;


    const activeCount =
        expenses.filter(
            expense =>
                expense.status === "active"
        ).length;


    const inactiveCount =
        expenses.filter(
            expense =>
                expense.status === "inactive"
        ).length;


    const totalAmountElement =
        document.getElementById(
            "totalExpenseAmount"
        );

    const totalCountElement =
        document.getElementById(
            "totalExpenseCount"
        );

    const activeElement =
        document.getElementById(
            "activeExpenseCount"
        );

    const inactiveElement =
        document.getElementById(
            "inactiveExpenseCount"
        );


    if (totalAmountElement) {

        totalAmountElement.textContent =
            formatExpenseAmount(
                totalAmount
            );

    }


    if (totalCountElement) {

        totalCountElement.textContent =
            totalCount;

    }


    if (activeElement) {

        activeElement.textContent =
            activeCount;

    }


    if (inactiveElement) {

        inactiveElement.textContent =
            inactiveCount;

    }

}


/* =========================================================
   LOAD EXPENSE DRIVERS
========================================================= */

async function loadExpenseDrivers(
    carId = null
) {

    const expenseDriver =
        document.getElementById(
            "expenseDriver"
        );

    if (!expenseDriver) {
        return;
    }


    expenseDriver.innerHTML = `
        <option value="">
            Select Driver
        </option>
    `;


    if (!carId) {
        return;
    }


    try {

        const drivers =
            await apiRequest(
                "/drivers/"
            );


        const activeDrivers =
            Array.isArray(drivers)
                ? drivers.filter(driver => {

                    if (
                        driver.status !==
                        "active"
                    ) {
                        return false;
                    }


                    if (
                        !driver.assigned_car
                    ) {
                        return false;
                    }


                    return (
                        Number(
                            driver.assigned_car.id
                        ) ===
                        Number(carId)
                    );

                })
                : [];


        activeDrivers.forEach(
            driver => {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    driver.id;

                option.textContent =
                    `${driver.name} - ${driver.phone}`;

                expenseDriver.appendChild(
                    option
                );

            }
        );


    } catch (error) {

        console.error(
            "Failed to load expense drivers:",
            error
        );

    }

}


/* =========================================================
   LOAD EXPENSE TRIPS
========================================================= */

async function loadExpenseTrips(
    carId = null,
    driverId = null
) {

    const expenseTrip =
        document.getElementById(
            "expenseTrip"
        );

    if (!expenseTrip) {
        return;
    }


    expenseTrip.innerHTML = `
        <option value="">
            Select Trip
        </option>
    `;


    if (!carId) {
        return;
    }


    try {

        const trips =
            await apiRequest(
                "/trips/"
            );


        const validTrips =
            Array.isArray(trips)
                ? trips.filter(trip => {

                    /*
                     * Correct car
                     */

                    if (
                        Number(trip.car_id) !==
                        Number(carId)
                    ) {
                        return false;
                    }


                    /*
                     * If driver selected,
                     * trip must belong to
                     * selected driver.
                     */

                    if (
                        driverId &&
                        Number(trip.driver_id) !==
                        Number(driverId)
                    ) {
                        return false;
                    }


                    /*
                     * Cancelled trips should
                     * not be selectable.
                     */

                    if (
                        trip.status ===
                        "cancelled"
                    ) {
                        return false;
                    }


                    return true;

                })
                : [];


        validTrips.forEach(
            trip => {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    trip.id;


                const start =
                    trip.start_location ||
                    "Unknown";

                const destination =
                    trip.destination ||
                    "Unknown";


                option.textContent =
                    `#${trip.id} - ${start} → ${destination} (${trip.status})`;


                expenseTrip.appendChild(
                    option
                );

            }
        );


    } catch (error) {

        console.error(
            "Failed to load expense trips:",
            error
        );

    }

}


/* =========================================================
   RESET DRIVER + TRIP
========================================================= */

function resetExpenseDriverAndTrip() {

    const expenseDriver =
        document.getElementById(
            "expenseDriver"
        );

    const expenseTrip =
        document.getElementById(
            "expenseTrip"
        );


    if (expenseDriver) {

        expenseDriver.innerHTML = `
            <option value="">
                Select Driver
            </option>
        `;

    }


    if (expenseTrip) {

        expenseTrip.innerHTML = `
            <option value="">
                Select Trip
            </option>
        `;

    }

}


/* =========================================================
   RESET TRIP
========================================================= */

function resetExpenseTrip() {

    const expenseTrip =
        document.getElementById(
            "expenseTrip"
        );

    if (!expenseTrip) {
        return;
    }


    expenseTrip.innerHTML = `
        <option value="">
            Select Trip
        </option>
    `;

}


/* =========================================================
   ADD / EDIT MODAL
========================================================= */

async function openExpenseModal(
    expense = null
) {

    const modal =
        document.getElementById(
            "expenseModal"
        );

    if (!modal) return;


    editingExpenseId =
        expense?.id || null;


    document.getElementById(
        "expenseModalTitle"
    ).textContent =
        expense
            ? "Edit Expense"
            : "Add Expense";


    document.getElementById(
        "expenseId"
    ).value =
        expense?.id || "";


    const expenseCar =
        document.getElementById(
            "expenseCar"
        );

    const expenseDriver =
        document.getElementById(
            "expenseDriver"
        );

    const expenseTrip =
        document.getElementById(
            "expenseTrip"
        );


    /*
     * Reset dependent dropdowns
     */

    resetExpenseDriverAndTrip();


    /*
     * Car
     */

    if (expenseCar) {

        expenseCar.value =
            expense?.car_id || "";

    }


    /*
     * Date
     */

    document.getElementById(
        "expenseDate"
    ).value =
        expense?.expense_date ||
        getTodayDate();


    /*
     * Category
     */

    document.getElementById(
        "expenseCategory"
    ).value =
        expense?.category || "";


    /*
     * Amount
     */

    document.getElementById(
        "expenseAmount"
    ).value =
        expense?.amount ?? "";


    /*
     * Description
     */

    document.getElementById(
        "expenseDescription"
    ).value =
        expense?.description || "";


    /*
     * Vendor
     */

    document.getElementById(
        "expenseVendor"
    ).value =
        expense?.vendor || "";


    /*
     * Payment method
     */

    document.getElementById(
        "expensePaymentMethod"
    ).value =
        expense?.payment_method || "";


    /*
     * Receipt number
     */

    document.getElementById(
        "expenseReceiptNumber"
    ).value =
        expense?.receipt_number || "";


    /*
     * Notes
     */

    document.getElementById(
        "expenseNotes"
    ).value =
        expense?.notes || "";


    /*
     * Edit mode:
     * load matching drivers and trips.
     */

    if (
        expense?.car_id
    ) {

        await loadExpenseDrivers(
            expense.car_id
        );


        if (
            expenseDriver &&
            expense.driver_id
        ) {

            expenseDriver.value =
                String(
                    expense.driver_id
                );

        }


        await loadExpenseTrips(
            expense.car_id,
            expense.driver_id || null
        );


        if (
            expenseTrip &&
            expense.trip_id
        ) {

            expenseTrip.value =
                String(
                    expense.trip_id
                );

        }

    }


    modal.classList.add(
        "show"
    );

}


/* =========================================================
   CLOSE MODAL
========================================================= */

function closeExpenseModal() {

    const modal =
        document.getElementById(
            "expenseModal"
        );

    if (modal) {

        modal.classList.remove(
            "show"
        );

    }

    editingExpenseId = null;

}


/* =========================================================
   SUBMIT EXPENSE
========================================================= */

async function handleExpenseSubmit(
    event
) {

    event.preventDefault();


    const carValue =
        document.getElementById(
            "expenseCar"
        )?.value;


    if (!carValue) {

        alert(
            "Please select a car."
        );

        return;

    }


    const expenseData = {

        car_id:
            Number(carValue),


        driver_id:
            document.getElementById(
                "expenseDriver"
            )?.value
                ? Number(
                    document.getElementById(
                        "expenseDriver"
                    ).value
                )
                : null,


        trip_id:
            document.getElementById(
                "expenseTrip"
            )?.value
                ? Number(
                    document.getElementById(
                        "expenseTrip"
                    ).value
                )
                : null,


        expense_date:
            document.getElementById(
                "expenseDate"
            ).value,


        category:
            document.getElementById(
                "expenseCategory"
            ).value,


        amount:
            Number(
                document.getElementById(
                    "expenseAmount"
                ).value
            ),


        description:
            getOptionalValue(
                "expenseDescription"
            ),


        vendor:
            getOptionalValue(
                "expenseVendor"
            ),


        payment_method:
            getOptionalValue(
                "expensePaymentMethod"
            ),


        receipt_number:
            getOptionalValue(
                "expenseReceiptNumber"
            ),


        notes:
            getOptionalValue(
                "expenseNotes"
            )

    };


    try {

        if (editingExpenseId) {

            await apiRequest(
                `/expenses/${editingExpenseId}`,
                {
                    method: "PUT",
                    body:
                        JSON.stringify(
                            expenseData
                        )
                }
            );


            alert(
                "Expense updated successfully."
            );


        } else {

            await apiRequest(
                "/expenses/",
                {
                    method: "POST",
                    body:
                        JSON.stringify(
                            expenseData
                        )
                }
            );


            alert(
                "Expense created successfully."
            );

        }


        closeExpenseModal();

        await loadExpenses();


    } catch (error) {

        console.error(
            "Expense save error:",
            error
        );


        alert(
            error.message ||
            "Failed to save expense."
        );

    }

}


/* =========================================================
   EDIT
========================================================= */

async function editExpense(
    expenseId
) {

    let expense =
        allExpenses.find(
            item =>
                Number(item.id) ===
                Number(expenseId)
        );


    /*
     * If not found in current list,
     * load directly from API.
     */

    if (!expense) {

        try {

            expense =
                await apiRequest(
                    `/expenses/${expenseId}`
                );

        } catch (error) {

            alert(
                error.message ||
                "Expense could not be loaded."
            );

            return;

        }

    }


    if (!expense) {

        alert(
            "Expense not found."
        );

        return;

    }


    if (
        expense.status &&
        expense.status !== "active"
    ) {

        alert(
            "Inactive expenses cannot be edited."
        );

        return;

    }


    await openExpenseModal(
        expense
    );

}


/* =========================================================
   VIEW
========================================================= */

function viewExpense(
    expenseId
) {

    if (!expenseId) {

        alert(
            "Expense ID is missing."
        );

        return;

    }


    window.location.href =
        `/frontend/expenses/expense-details.html?expense_id=${expenseId}`;

}


/* =========================================================
   DEACTIVATE
========================================================= */

async function deactivateExpense(
    expenseId
) {

    if (
        !confirm(
            "Are you sure you want to deactivate this expense?"
        )
    ) {

        return;

    }


    try {

        await apiRequest(
            `/expenses/${expenseId}`,
            {
                method: "DELETE"
            }
        );


        alert(
            "Expense deactivated successfully."
        );


        await loadExpenses();


    } catch (error) {

        console.error(
            "Deactivate expense error:",
            error
        );


        alert(
            error.message ||
            "Failed to deactivate expense."
        );

    }

}


/* =========================================================
   ACTIVATE
========================================================= */

async function activateExpense(
    expenseId
) {

    try {

        await apiRequest(
            `/expenses/${expenseId}/activate`,
            {
                method: "PATCH"
            }
        );


        alert(
            "Expense activated successfully."
        );


        await loadExpenses();


    } catch (error) {

        console.error(
            "Activate expense error:",
            error
        );


        alert(
            error.message ||
            "Failed to activate expense."
        );

    }

}


/* =========================================================
   RESET FILTERS
========================================================= */

function resetExpenseFilters() {

    const carFilter =
        document.getElementById(
            "expenseCarFilter"
        );

    const categoryFilter =
        document.getElementById(
            "expenseCategoryFilter"
        );

    const fromDate =
        document.getElementById(
            "expenseFromDate"
        );

    const toDate =
        document.getElementById(
            "expenseToDate"
        );

    const search =
        document.getElementById(
            "expenseSearch"
        );

    const includeInactive =
        document.getElementById(
            "includeInactiveExpenses"
        );


    if (carFilter) {
        carFilter.value = "";
    }

    if (categoryFilter) {
        categoryFilter.value = "";
    }

    if (fromDate) {
        fromDate.value = "";
    }

    if (toDate) {
        toDate.value = "";
        toDate.min = "";
    }

    if (search) {
        search.value = "";
    }

    if (includeInactive) {
        includeInactive.checked = false;
    }


    loadExpenses();

}


/* =========================================================
   HELPERS
========================================================= */

function getCarById(
    carId
) {

    return allCars.find(
        car =>
            Number(car.id) ===
            Number(carId)
    ) || null;

}


function getCarDisplayName(
    car
) {

    if (!car) {
        return "Car #Unknown";
    }


    const registration =
        car.registration_number ||
        car.registrationNumber ||
        "";


    const brand =
        car.brand || "";


    const model =
        car.model || "";


    const vehicleName =
        [brand, model]
            .filter(Boolean)
            .join(" ");


    if (
        registration &&
        vehicleName
    ) {

        return `${registration} - ${vehicleName}`;

    }


    if (registration) {
        return registration;
    }


    if (vehicleName) {
        return vehicleName;
    }


    return `Car #${car.id}`;

}


function getCategoryLabel(
    value
) {

    const category =
        expenseCategories.find(
            item =>
                item.value === value
        );


    return category
        ? category.label
        : capitalize(
            value || "Other"
        );

}


function formatPaymentMethod(
    value
) {

    if (!value) {
        return "-";
    }


    return value
        .replaceAll("_", " ")
        .replace(
            /\b\w/g,
            char =>
                char.toUpperCase()
        );

}


function formatExpenseAmount(
    amount
) {

    return new Intl.NumberFormat(
        "en-IN",
        {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 2
        }
    ).format(
        Number(amount || 0)
    );

}


function formatExpenseDate(
    dateValue
) {

    if (!dateValue) {
        return "-";
    }


    const date =
        new Date(
            `${dateValue}T00:00:00`
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return dateValue;

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


function getTodayDate() {

    const today =
        new Date();


    const year =
        today.getFullYear();


    const month =
        String(
            today.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const day =
        String(
            today.getDate()
        ).padStart(
            2,
            "0"
        );


    return `${year}-${month}-${day}`;

}


function getOptionalValue(
    id
) {

    const value =
        document.getElementById(
            id
        )?.value
            ?.trim();


    return value || null;

}


function capitalize(
    value
) {

    if (!value) {
        return "";
    }


    return (
        value.charAt(0).toUpperCase() +
        value.slice(1)
    );

}


function escapeExpenseHtml(
    value
) {

    return String(
        value ?? ""
    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

}


function updateExpenseSubtitle(
    count
) {

    const element =
        document.getElementById(
            "expenseTableSubtitle"
        );

    if (!element) return;


    element.textContent =
        `${count} expense record${count === 1 ? "" : "s"} found`;

}


function showExpenseError(
    message
) {

    const tbody =
        document.getElementById(
            "expenseTableBody"
        );

    if (!tbody) return;


    tbody.innerHTML = `
        <tr>
            <td
                colspan="10"
                class="expense-empty-cell"
            >
                ${escapeExpenseHtml(
        message
    )}
            </td>
        </tr>
    `;

}


/* =========================================================
   ANALYTICS
========================================================= */

function openExpenseAnalytics() {

    window.location.href =
        "/frontend/expenses/expense-analytics.html";

}


/* =========================================================
   MONTHLY SUMMARY
========================================================= */

function openMonthlyExpenseSummary() {

    window.location.href =
        "/frontend/expenses/monthly-expense-summary.html";

}


/* =========================================================
   URL FILTERS
========================================================= */

function applyExpenseUrlFilters() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    const fromDate =
        document.getElementById(
            "expenseFromDate"
        );

    const toDate =
        document.getElementById(
            "expenseToDate"
        );

    const carFilter =
        document.getElementById(
            "expenseCarFilter"
        );

    const categoryFilter =
        document.getElementById(
            "expenseCategoryFilter"
        );


    const urlFromDate =
        params.get(
            "from_date"
        );

    const urlToDate =
        params.get(
            "to_date"
        );

    const urlCarId =
        params.get(
            "car_id"
        );

    const urlCategory =
        params.get(
            "category"
        );


    if (
        urlFromDate &&
        fromDate
    ) {

        fromDate.value =
            urlFromDate;

    }


    if (
        urlToDate &&
        toDate
    ) {

        toDate.value =
            urlToDate;

    }


    if (
        urlFromDate &&
        toDate
    ) {

        toDate.min =
            urlFromDate;

    }


    if (
        urlCarId &&
        carFilter
    ) {

        carFilter.value =
            urlCarId;

    }


    if (
        urlCategory &&
        categoryFilter
    ) {

        categoryFilter.value =
            urlCategory;

    }

}