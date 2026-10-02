/* =========================================================
   CAR EXPENSE HISTORY
========================================================= */

let currentCarId = null;
let carExpenseHistory = [];


/* =========================================================
   INITIAL LOAD
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        currentCarId =
            getCarIdFromUrl();


        if (!currentCarId) {

            showHistoryError(
                "Car ID is missing from the URL."
            );

            return;
        }


        setupHistoryFilters();

        loadCarExpenseHistory();

    }
);


/* =========================================================
   GET CAR ID
========================================================= */

function getCarIdFromUrl() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    return params.get("car_id");
}


/* =========================================================
   LOAD HISTORY
========================================================= */

async function loadCarExpenseHistory() {

    if (!currentCarId) {
        return;
    }


    showHistoryLoading();


    try {

        const params =
            new URLSearchParams();


        const fromDate =
            document.getElementById(
                "historyFromDate"
            )?.value;


        const toDate =
            document.getElementById(
                "historyToDate"
            )?.value;


        const includeInactive =
            document.getElementById(
                "historyIncludeInactive"
            )?.checked;


        /*
         * Date validation
         */

        if (
            fromDate &&
            toDate &&
            fromDate > toDate
        ) {

            alert(
                "From Date cannot be later than To Date."
            );

            document.getElementById(
                "historyFromDate"
            ).value = "";

            hideHistoryLoading();

            return;
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
                `/expenses/car/${currentCarId}/history${queryString}`
            );


        carExpenseHistory =
            data?.expenses || [];


        renderCarHistory(
            data
        );


        hideHistoryLoading();


    } catch (error) {

        console.error(
            "Car expense history error:",
            error
        );


        showHistoryError(
            error.message ||
            "Failed to load car expense history."
        );
    }
}


/* =========================================================
   RENDER HISTORY
========================================================= */

function renderCarHistory(data) {

    const expenses =
        data?.expenses || [];


    /*
     * Summary
     */

    const totalAmount =
        Number(
            data?.total_amount || 0
        );


    const totalCount =
        Number(
            data?.total_expenses || 0
        );


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


    setText(
        "historyTotalAmount",
        formatHistoryAmount(
            totalAmount
        )
    );


    setText(
        "historyTotalCount",
        totalCount
    );


    setText(
        "historyActiveCount",
        activeCount
    );


    setText(
        "historyInactiveCount",
        inactiveCount
    );


    setText(
        "expenseHistorySubtitle",
        `Car #${currentCarId} expense history`
    );


    setText(
        "historyTableSubtitle",
        `${expenses.length} expense record${expenses.length === 1
            ? ""
            : "s"
        } found`
    );


    /*
     * Empty state
     */

    if (!expenses.length) {

        showHistoryEmpty();

        return;
    }


    /*
     * Render table
     */

    const tbody =
        document.getElementById(
            "expenseHistoryTableBody"
        );


    if (!tbody) {
        return;
    }


    tbody.innerHTML =
        expenses
            .map(
                (expense, index) => {

                    const status =
                        expense.status ||
                        "active";


                    /*
                     * Driver
                     */

                    const driver =
                        expense.driver ||
                        null;


                    const driverHtml =
                        driver
                            ? `
                                <div class="history-driver-name">
                                    ${escapeHistoryHtml(
                                driver.name || "-"
                            )}
                                </div>

                                <span class="history-driver-phone">
                                    ${escapeHistoryHtml(
                                driver.phone || "-"
                            )}
                                </span>
                              `
                            : `
                                <span class="history-no-link">
                                    Not linked
                                </span>
                              `;


                    /*
                     * Trip
                     */

                    const trip =
                        expense.trip ||
                        null;


                    const tripHtml =
                        trip
                            ? `
                                <div class="history-trip-route">
                                    ${escapeHistoryHtml(
                                trip.start_location || "-"
                            )}
                                    →
                                    ${escapeHistoryHtml(
                                trip.destination || "-"
                            )}
                                </div>

                                <span class="history-trip-id">
                                    Trip #${trip.id}
                                </span>
                              `
                            : `
                                <span class="history-no-link">
                                    Not linked
                                </span>
                              `;


                    return `

                        <tr>

                            <!-- Number -->

                            <td>
                                ${index + 1}
                            </td>


                            <!-- Date -->

                            <td>
                                ${formatHistoryDate(
                        expense.expense_date
                    )}
                            </td>


                            <!-- Category -->

                            <td>

                                <span
                                    class="history-category"
                                >
                                    ${escapeHistoryHtml(
                        formatCategory(
                            expense.category
                        )
                    )}
                                </span>

                            </td>


                            <!-- Driver -->

                            <td class="history-linked-cell">

                                ${driverHtml}

                            </td>


                            <!-- Trip -->

                            <td class="history-linked-cell">

                                ${tripHtml}

                            </td>


                            <!-- Description -->

                            <td>
                                ${escapeHistoryHtml(
                        expense.description ||
                        "-"
                    )}
                            </td>


                            <!-- Vendor -->

                            <td>
                                ${escapeHistoryHtml(
                        expense.vendor ||
                        "-"
                    )}
                            </td>


                            <!-- Payment -->

                            <td>
                                ${escapeHistoryHtml(
                        formatPaymentMethod(
                            expense.payment_method
                        )
                    )}
                            </td>


                            <!-- Receipt -->

                            <td>
                                ${escapeHistoryHtml(
                        expense.receipt_number ||
                        "-"
                    )}
                            </td>


                            <!-- Amount -->

                            <td>

                                <span
                                    class="history-amount"
                                >
                                    ${formatHistoryAmount(
                        expense.amount
                    )}
                                </span>

                            </td>


                            <!-- Status -->

                            <td>

                                <span
                                    class="
                                        history-status
                                        ${status}
                                    "
                                >
                                    ${capitalizeHistory(
                        status
                    )}
                                </span>

                            </td>


                            <!-- Action -->

                            <td>

                                <button
                                    type="button"
                                    class="history-view-btn"
                                    onclick="
                                        viewHistoryExpense(
                                            ${expense.id}
                                        )
                                    "
                                >
                                    View
                                </button>

                            </td>

                        </tr>

                    `;

                }
            )
            .join("");


    showHistoryTable();
}


/* =========================================================
   VIEW EXPENSE
========================================================= */

function viewHistoryExpense(
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
   FILTER SETUP
========================================================= */

function setupHistoryFilters() {

    const fromDate =
        document.getElementById(
            "historyFromDate"
        );


    const toDate =
        document.getElementById(
            "historyToDate"
        );


    const includeInactive =
        document.getElementById(
            "historyIncludeInactive"
        );


    if (fromDate) {

        fromDate.addEventListener(
            "change",
            () => {

                if (toDate) {

                    toDate.min =
                        fromDate.value || "";
                }


                if (
                    fromDate.value &&
                    toDate?.value &&
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


                loadCarExpenseHistory();

            }
        );
    }


    if (toDate) {

        toDate.addEventListener(
            "change",
            () => {

                if (
                    fromDate?.value &&
                    toDate.value &&
                    fromDate.value > toDate.value
                ) {

                    alert(
                        "From Date cannot be later than To Date."
                    );

                    toDate.value = "";

                    return;
                }


                loadCarExpenseHistory();

            }
        );
    }


    if (includeInactive) {

        includeInactive.addEventListener(
            "change",
            loadCarExpenseHistory
        );
    }
}


/* =========================================================
   RESET
========================================================= */

function resetHistoryFilters() {

    const fromDate =
        document.getElementById(
            "historyFromDate"
        );


    const toDate =
        document.getElementById(
            "historyToDate"
        );


    const includeInactive =
        document.getElementById(
            "historyIncludeInactive"
        );


    if (fromDate) {
        fromDate.value = "";
    }


    if (toDate) {

        toDate.value = "";

        toDate.min = "";
    }


    if (includeInactive) {
        includeInactive.checked = false;
    }


    loadCarExpenseHistory();
}


/* =========================================================
   NAVIGATION
========================================================= */

function goBackToExpenses() {

    window.location.href =
        "/frontend/expenses/expenses.html";
}


function goBackToExpenseDetails() {

    goBackToExpenses();
}


/* =========================================================
   UI STATES
========================================================= */

function showHistoryLoading() {

    const loading =
        document.getElementById(
            "expenseHistoryLoading"
        );


    const table =
        document.getElementById(
            "expenseHistoryTableCard"
        );


    const empty =
        document.getElementById(
            "expenseHistoryEmpty"
        );


    const error =
        document.getElementById(
            "expenseHistoryError"
        );


    if (loading) {
        loading.style.display = "flex";
    }


    if (table) {
        table.style.display = "none";
    }


    if (empty) {
        empty.style.display = "none";
    }


    if (error) {
        error.style.display = "none";
    }
}


function hideHistoryLoading() {

    const loading =
        document.getElementById(
            "expenseHistoryLoading"
        );


    if (loading) {
        loading.style.display = "none";
    }
}


function showHistoryTable() {

    hideHistoryLoading();


    const table =
        document.getElementById(
            "expenseHistoryTableCard"
        );


    const empty =
        document.getElementById(
            "expenseHistoryEmpty"
        );


    const error =
        document.getElementById(
            "expenseHistoryError"
        );


    if (table) {
        table.style.display = "block";
    }


    if (empty) {
        empty.style.display = "none";
    }


    if (error) {
        error.style.display = "none";
    }
}


function showHistoryEmpty() {

    hideHistoryLoading();


    const table =
        document.getElementById(
            "expenseHistoryTableCard"
        );


    const empty =
        document.getElementById(
            "expenseHistoryEmpty"
        );


    const error =
        document.getElementById(
            "expenseHistoryError"
        );


    if (table) {
        table.style.display = "none";
    }


    if (empty) {
        empty.style.display = "block";
    }


    if (error) {
        error.style.display = "none";
    }
}


function showHistoryError(
    message
) {

    hideHistoryLoading();


    const table =
        document.getElementById(
            "expenseHistoryTableCard"
        );


    const empty =
        document.getElementById(
            "expenseHistoryEmpty"
        );


    const error =
        document.getElementById(
            "expenseHistoryError"
        );


    const errorMessage =
        document.getElementById(
            "expenseHistoryErrorMessage"
        );


    if (table) {
        table.style.display = "none";
    }


    if (empty) {
        empty.style.display = "none";
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
    id,
    value
) {

    const element =
        document.getElementById(id);


    if (element) {

        element.textContent =
            value ?? "-";
    }
}


function formatHistoryAmount(
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


function formatHistoryDate(
    value
) {

    if (!value) {
        return "-";
    }


    const date =
        new Date(
            `${value}T00:00:00`
        );


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


function capitalizeHistory(
    value
) {

    if (!value) {
        return "";
    }


    return value.charAt(0).toUpperCase()
        + value.slice(1);
}


function escapeHistoryHtml(
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