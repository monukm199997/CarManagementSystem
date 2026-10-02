/* =========================================================
   EXPENSE DETAILS
========================================================= */

let currentExpense = null;
let currentVehicle = null;


/* =========================================================
   INITIAL LOAD
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    loadExpenseDetails
);


/* =========================================================
   GET EXPENSE ID
========================================================= */

function getExpenseIdFromUrl() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    return params.get("expense_id");
}


/* =========================================================
   LOAD EXPENSE DETAILS
========================================================= */

async function loadExpenseDetails() {

    const expenseId =
        getExpenseIdFromUrl();


    if (!expenseId) {

        showExpenseDetailsError(
            "Expense ID is missing from the URL."
        );

        return;
    }


    showExpenseDetailsLoading();


    try {

        /*
         * Load expense
         */

        const expense =
            await apiRequest(
                `/expenses/${expenseId}`
            );


        currentExpense = expense;


        /*
         * Load vehicle information
         */

        try {

            currentVehicle =
                await apiRequest(
                    `/cars/${expense.car_id}`
                );

        } catch (vehicleError) {

            console.warn(
                "Vehicle information could not be loaded:",
                vehicleError
            );

            currentVehicle = null;
        }


        /*
         * Render page
         */

        renderExpenseDetails(
            expense,
            currentVehicle
        );


        showExpenseDetailsContent();


    } catch (error) {

        console.error(
            "Failed to load expense details:",
            error
        );


        showExpenseDetailsError(
            error.message ||
            "Failed to load expense details."
        );
    }
}


/* =========================================================
   RENDER
========================================================= */

function renderExpenseDetails(
    expense,
    vehicle
) {

    /*
     * Amount
     */

    setText(
        "expenseAmount",
        formatExpenseDetailAmount(
            expense.amount
        )
    );


    /*
     * Category
     */

    setText(
        "expenseCategory",
        formatCategory(
            expense.category
        )
    );


    /*
     * Status
     */

    const statusElement =
        document.getElementById(
            "expenseStatus"
        );


    if (statusElement) {

        const status =
            expense.status || "active";


        statusElement.textContent =
            capitalizeExpenseDetail(
                status
            );


        statusElement.className =
            "expense-status-badge " +
            (
                status === "active"
                    ? "expense-status-active"
                    : "expense-status-inactive"
            );
    }


    /*
     * Basic information
     */

    setText(
        "expenseDate",
        formatExpenseDetailDate(
            expense.expense_date
        )
    );


    setText(
        "expenseDescription",
        expense.description || "-"
    );


    setText(
        "expenseId",
        `#${expense.id}`
    );


    setText(
        "expenseCreatedAt",
        formatExpenseDetailDateTime(
            expense.created_at
        )
    );


    /*
     * Vehicle
     */

    renderVehicleInformation(
        expense,
        vehicle
    );


    /*
     * Driver
     */

    renderDriverInformation(
        expense.driver
    );


    /*
     * Trip
     */

    renderTripInformation(
        expense.trip
    );


    /*
     * Payment
     */

    setText(
        "expenseVendor",
        expense.vendor || "-"
    );


    setText(
        "expensePaymentMethod",
        formatPaymentMethod(
            expense.payment_method
        )
    );


    setText(
        "expenseReceiptNumber",
        expense.receipt_number || "-"
    );


    /*
     * Notes
     */

    setText(
        "expenseNotes",
        expense.notes || "No notes added."
    );


    /*
     * Edit / Status buttons
     */

    const editButton =
        document.getElementById(
            "editExpenseButton"
        );


    const bottomEditButton =
        document.getElementById(
            "bottomEditExpenseButton"
        );


    const statusActionButton =
        document.getElementById(
            "expenseStatusActionButton"
        );


    const bottomStatusActionButton =
        document.getElementById(
            "bottomStatusActionButton"
        );


    const isInactive =
        expense.status === "inactive";


    if (isInactive) {

        /*
         * Inactive expense cannot be edited.
         */

        if (editButton) {
            editButton.style.display = "none";
        }


        if (bottomEditButton) {
            bottomEditButton.style.display = "none";
        }


        /*
         * Status action becomes Activate.
         */

        if (statusActionButton) {

            statusActionButton.style.display = "";

            statusActionButton.textContent =
                "Activate";

            statusActionButton.className =
                "expense-activate-action";
        }


        if (bottomStatusActionButton) {

            bottomStatusActionButton.style.display = "";

            bottomStatusActionButton.textContent =
                "Activate";

            bottomStatusActionButton.className =
                "expense-activate-action";
        }


    } else {

        /*
         * Active expense can be edited.
         */

        if (editButton) {
            editButton.style.display = "";
        }


        if (bottomEditButton) {
            bottomEditButton.style.display = "";
        }


        /*
         * Status action becomes Deactivate.
         */

        if (statusActionButton) {

            statusActionButton.style.display = "";

            statusActionButton.textContent =
                "Deactivate";

            statusActionButton.className =
                "expense-deactivate-action";
        }


        if (bottomStatusActionButton) {

            bottomStatusActionButton.style.display = "";

            bottomStatusActionButton.textContent =
                "Deactivate";

            bottomStatusActionButton.className =
                "expense-deactivate-action";
        }
    }
}


/* =========================================================
   VEHICLE INFORMATION
========================================================= */

function renderVehicleInformation(
    expense,
    vehicle
) {

    setText(
        "vehicleId",
        expense.car_id
            ? `#${expense.car_id}`
            : "-"
    );


    if (!vehicle) {

        setText(
            "vehicleName",
            "Vehicle information unavailable"
        );

        setText(
            "vehicleRegistration",
            "-"
        );

        setText(
            "vehicleBrand",
            "-"
        );

        setText(
            "vehicleModel",
            "-"
        );

        return;
    }


    const registration =
        vehicle.registration_number ||
        vehicle.registrationNumber ||
        "-";


    const brand =
        vehicle.brand || "-";


    const model =
        vehicle.model || "-";


    const vehicleName =
        [brand, model]
            .filter(
                value =>
                    value &&
                    value !== "-"
            )
            .join(" ") ||
        `Car #${vehicle.id}`;


    setText(
        "vehicleName",
        vehicleName
    );


    setText(
        "vehicleRegistration",
        registration
    );


    setText(
        "vehicleBrand",
        brand
    );


    setText(
        "vehicleModel",
        model
    );
}


/* =========================================================
   DRIVER INFORMATION
========================================================= */

function renderDriverInformation(driver) {

    const container =
        document.getElementById(
            "expenseDriverContent"
        );


    if (!container) return;


    /*
     * No driver linked
     */

    if (!driver) {

        container.innerHTML = `
            <div class="expense-no-link">
                No driver is linked with this expense.
            </div>
        `;

        return;
    }


    const status =
        driver.status || "-";


    const statusClass =
        status === "active"
            ? ""
            : "inactive";


    container.innerHTML = `

        <div class="expense-linked-box">

            <div class="expense-linked-header">

                <div class="expense-linked-icon">
                    👤
                </div>

                <div>

                    <h3>
                        ${escapeExpenseHtml(
        driver.name || "-"
    )}
                    </h3>

                    <p>
                        Driver #${driver.id}
                    </p>

                </div>

            </div>


            <div class="expense-info-grid">

                <div class="expense-info-item">

                    <span>
                        Driver ID
                    </span>

                    <strong>
                        #${driver.id}
                    </strong>

                </div>


                <div class="expense-info-item">

                    <span>
                        Phone
                    </span>

                    <strong>
                        ${escapeExpenseHtml(
        driver.phone || "-"
    )}
                    </strong>

                </div>


                <div class="expense-info-item">

                    <span>
                        License Number
                    </span>

                    <strong>
                        ${escapeExpenseHtml(
        driver.license_number || "-"
    )}
                    </strong>

                </div>


                <div class="expense-info-item">

                    <span>
                        Status
                    </span>

                    <strong>

                        <span
                            class="expense-linked-status ${statusClass}"
                        >
                            ${escapeExpenseHtml(
        capitalizeExpenseDetail(status)
    )}
                        </span>

                    </strong>

                </div>

            </div>

        </div>
    `;
}


/* =========================================================
   TRIP INFORMATION
========================================================= */

function renderTripInformation(trip) {

    const container =
        document.getElementById(
            "expenseTripContent"
        );


    if (!container) return;


    /*
     * No trip linked
     */

    if (!trip) {

        container.innerHTML = `
            <div class="expense-no-link">
                No trip is linked with this expense.
            </div>
        `;

        return;
    }


    const status =
        trip.status || "-";


    const statusClass =
        status === "cancelled"
            ? "cancelled"
            : "";


    container.innerHTML = `

        <div class="expense-linked-box">

            <div class="expense-linked-header">

                <div class="expense-linked-icon">
                    🛣️
                </div>

                <div>

                    <h3 class="expense-trip-route">

                        ${escapeExpenseHtml(
        trip.start_location || "-"
    )}

                        →

                        ${escapeExpenseHtml(
        trip.destination || "-"
    )}

                    </h3>

                    <p>
                        Trip #${trip.id}
                    </p>

                </div>

            </div>


            <div class="expense-info-grid">


                <div class="expense-info-item">

                    <span>
                        Trip ID
                    </span>

                    <strong>
                        #${trip.id}
                    </strong>

                </div>


                <div class="expense-info-item">

                    <span>
                        Driver ID
                    </span>

                    <strong>
                        #${trip.driver_id}
                    </strong>

                </div>


                <div class="expense-info-item">

                    <span>
                        Car ID
                    </span>

                    <strong>
                        #${trip.car_id}
                    </strong>

                </div>


                <div class="expense-info-item">

                    <span>
                        Start Date
                    </span>

                    <strong>
                        ${formatExpenseDateTime(
        trip.start_datetime
    )}
                    </strong>

                </div>


                <div class="expense-info-item">

                    <span>
                        End Date
                    </span>

                    <strong>
                        ${formatExpenseDateTime(
        trip.end_datetime
    )}
                    </strong>

                </div>


                <div class="expense-info-item">

                    <span>
                        Status
                    </span>

                    <strong>

                        <span
                            class="expense-linked-status ${statusClass}"
                        >
                            ${escapeExpenseHtml(
        capitalizeExpenseDetail(status)
    )}
                        </span>

                    </strong>

                </div>

            </div>

        </div>
    `;
}


/* =========================================================
   EDIT CURRENT EXPENSE
========================================================= */

function editCurrentExpense() {

    if (!currentExpense) {

        alert(
            "Expense information is not available."
        );

        return;
    }


    if (
        currentExpense.status ===
        "inactive"
    ) {

        alert(
            "Inactive expenses cannot be edited."
        );

        return;
    }


    window.location.href =
        `/frontend/expenses/expenses.html?edit_expense_id=${currentExpense.id}`;
}


/* =========================================================
   BACK
========================================================= */

function goBackToExpenses() {

    window.location.href =
        "/frontend/expenses/expenses.html";
}


/* =========================================================
   UI STATES
========================================================= */

function showExpenseDetailsLoading() {

    const loading =
        document.getElementById(
            "expenseDetailsLoading"
        );

    const error =
        document.getElementById(
            "expenseDetailsError"
        );

    const content =
        document.getElementById(
            "expenseDetailsContent"
        );


    if (loading) {
        loading.style.display = "flex";
    }

    if (error) {
        error.style.display = "none";
    }

    if (content) {
        content.style.display = "none";
    }
}


function showExpenseDetailsContent() {

    const loading =
        document.getElementById(
            "expenseDetailsLoading"
        );

    const error =
        document.getElementById(
            "expenseDetailsError"
        );

    const content =
        document.getElementById(
            "expenseDetailsContent"
        );


    if (loading) {
        loading.style.display = "none";
    }

    if (error) {
        error.style.display = "none";
    }

    if (content) {
        content.style.display = "block";
    }
}


function showExpenseDetailsError(
    message
) {

    const loading =
        document.getElementById(
            "expenseDetailsLoading"
        );

    const error =
        document.getElementById(
            "expenseDetailsError"
        );

    const content =
        document.getElementById(
            "expenseDetailsContent"
        );

    const errorMessage =
        document.getElementById(
            "expenseErrorMessage"
        );


    if (loading) {
        loading.style.display = "none";
    }

    if (content) {
        content.style.display = "none";
    }

    if (error) {
        error.style.display = "block";
    }

    if (errorMessage) {
        errorMessage.textContent =
            message;
    }
}


/* =========================================================
   HELPERS
========================================================= */

function setText(
    elementId,
    value
) {

    const element =
        document.getElementById(
            elementId
        );


    if (!element) return;


    element.textContent =
        value ?? "-";
}


function formatExpenseDetailAmount(
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


function formatExpenseDetailDate(
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


function formatExpenseDetailDateTime(
    dateValue
) {

    if (!dateValue) {
        return "-";
    }


    const date =
        new Date(dateValue);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return dateValue;
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


function formatExpenseDateTime(
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


function formatCategory(
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


function capitalizeExpenseDetail(
    value
) {

    if (!value) {
        return "";
    }


    return value.charAt(0).toUpperCase()
        + value.slice(1);
}


function escapeExpenseHtml(value) {

    return String(
        value ?? ""
    )
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/* =========================================================
   TOGGLE EXPENSE STATUS
========================================================= */

async function toggleExpenseStatus() {

    if (!currentExpense) {

        alert(
            "Expense information is not available."
        );

        return;
    }


    const isInactive =
        currentExpense.status ===
        "inactive";


    /*
     * Activate
     */

    if (isInactive) {

        if (!confirm(
            "Are you sure you want to activate this expense?"
        )) {

            return;
        }


        try {

            const updatedExpense =
                await apiRequest(
                    `/expenses/${currentExpense.id}/activate`,
                    {
                        method: "PATCH"
                    }
                );


            currentExpense =
                updatedExpense;


            alert(
                "Expense activated successfully."
            );


            renderExpenseDetails(
                currentExpense,
                currentVehicle
            );


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


        return;
    }


    /*
     * Deactivate
     */

    if (!confirm(
        "Are you sure you want to deactivate this expense?"
    )) {

        return;
    }


    try {

        const updatedExpense =
            await apiRequest(
                `/expenses/${currentExpense.id}`,
                {
                    method: "DELETE"
                }
            );


        currentExpense =
            updatedExpense;


        alert(
            "Expense deactivated successfully."
        );


        renderExpenseDetails(
            currentExpense,
            currentVehicle
        );


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
   CAR EXPENSE HISTORY
========================================================= */

function viewCarExpenseHistory() {

    if (!currentExpense) {

        alert(
            "Expense information is not available."
        );

        return;
    }


    if (!currentExpense.car_id) {

        alert(
            "Car information is not available."
        );

        return;
    }


    window.location.href =
        `/frontend/expenses/expense-history.html?car_id=${currentExpense.car_id}`;
}