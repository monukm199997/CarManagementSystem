let monthlySummaryData = null;
let summaryCars = [];

const summaryYear =
    document.getElementById("summaryYear");

const summaryCar =
    document.getElementById("summaryCar");

const monthlyLoading =
    document.getElementById("monthlyLoading");

const monthlyError =
    document.getElementById("monthlyError");

const monthlyErrorMessage =
    document.getElementById(
        "monthlyErrorMessage"
    );

const monthlyContent =
    document.getElementById("monthlyContent");


// =========================================
// Helpers
// =========================================

function formatCurrency(amount) {
    return new Intl.NumberFormat(
        "en-IN",
        {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 2
        }
    ).format(Number(amount || 0));
}


function formatNumber(value) {
    return new Intl.NumberFormat(
        "en-IN"
    ).format(Number(value || 0));
}


function formatCategory(category) {

    if (!category) {
        return "-";
    }

    return category
        .replace(/_/g, " ")
        .replace(/\b\w/g, letter =>
            letter.toUpperCase()
        );
}


function formatMonth(month) {

    if (!month) {
        return "-";
    }

    const parts =
        month.split("-");

    if (parts.length !== 2) {
        return month;
    }

    const year =
        Number(parts[0]);

    const monthNumber =
        Number(parts[1]);

    const date =
        new Date(
            year,
            monthNumber - 1,
            1
        );

    return date.toLocaleString(
        "en-IN",
        {
            month: "long",
            year: "numeric"
        }
    );
}


// =========================================
// State
// =========================================

function showLoading() {

    monthlyLoading.style.display =
        "flex";

    monthlyError.style.display =
        "none";

    monthlyContent.style.display =
        "none";
}


function showContent() {

    monthlyLoading.style.display =
        "none";

    monthlyError.style.display =
        "none";

    monthlyContent.style.display =
        "block";
}


function showError(message) {

    monthlyLoading.style.display =
        "none";

    monthlyContent.style.display =
        "none";

    monthlyError.style.display =
        "flex";

    monthlyErrorMessage.textContent =
        message ||
        "Failed to load monthly summary.";
}


// =========================================
// Year Options
// =========================================

function populateYears() {

    if (!summaryYear) {
        return;
    }

    const currentYear =
        new Date().getFullYear();

    summaryYear.innerHTML = "";

    for (
        let year = currentYear;
        year >= currentYear - 5;
        year--
    ) {

        const option =
            document.createElement("option");

        option.value = year;
        option.textContent = year;

        if (year === currentYear) {
            option.selected = true;
        }

        summaryYear.appendChild(option);
    }
}


// =========================================
// Load Cars
// =========================================

async function loadSummaryCars() {

    try {

        const response =
            await apiRequest("/cars/");

        summaryCars =
            Array.isArray(response)
                ? response
                : response?.items || [];

        renderSummaryCars();

    } catch (error) {

        console.error(
            "Load cars error:",
            error
        );

        summaryCars = [];

        renderSummaryCars();
    }
}


function renderSummaryCars() {

    if (!summaryCar) {
        return;
    }

    summaryCar.innerHTML = `
        <option value="">
            All Cars
        </option>
    `;

    summaryCars.forEach(car => {

        const option =
            document.createElement("option");

        option.value = car.id;

        const registration =
            car.registration_number || "";

        const brand =
            car.brand || "";

        const model =
            car.model || "";

        const vehicleName =
            `${brand} ${model}`.trim();

        option.textContent =
            registration && vehicleName
                ? `${registration} - ${vehicleName}`
                : (
                    registration ||
                    vehicleName ||
                    `Car #${car.id}`
                );

        summaryCar.appendChild(option);
    });
}


// =========================================
// API URL
// =========================================

function buildSummaryUrl() {

    const params =
        new URLSearchParams();

    params.set(
        "year",
        summaryYear.value
    );

    if (
        summaryCar &&
        summaryCar.value
    ) {

        params.set(
            "car_id",
            summaryCar.value
        );
    }

    return `/expenses/monthly-summary?${params.toString()}`;
}


// =========================================
// Load Monthly Summary
// =========================================

async function loadMonthlySummary() {

    showLoading();

    try {

        const data =
            await apiRequest(
                buildSummaryUrl()
            );

        monthlySummaryData = data;

        renderMonthlySummary(data);

        showContent();

    } catch (error) {

        console.error(
            "Monthly summary error:",
            error
        );

        showError(
            error.message ||
            "Failed to load monthly expense summary."
        );
    }
}


// =========================================
// Render Main Summary
// =========================================

function renderMonthlySummary(data) {

    document.getElementById(
        "yearlyExpense"
    ).textContent =
        formatCurrency(
            data.total_amount
        );

    document.getElementById(
        "yearlyTransactions"
    ).textContent =
        formatNumber(
            data.total_expenses
        );

    document.getElementById(
        "yearlyAverage"
    ).textContent =
        formatCurrency(
            data.average_expense
        );

    renderHighestMonth(
        data.months || []
    );

    renderMonthlyTable(
        data.months || []
    );

    if (
        data.months &&
        data.months.length
    ) {

        showMonthDetails(
            data.months[
            data.months.length - 1
            ]
        );

    } else {

        showEmptyMonthDetails();
    }
}


// =========================================
// Highest Month
// =========================================

function renderHighestMonth(months) {

    const element =
        document.getElementById(
            "highestExpenseMonth"
        );

    if (!months.length) {

        element.textContent = "-";

        return;
    }

    const highest =
        months.reduce(
            (max, item) =>
                Number(item.total_amount) >
                    Number(max.total_amount)
                    ? item
                    : max
        );

    element.textContent =
        `${formatMonth(highest.month)} - ${formatCurrency(highest.total_amount)}`;
}


// =========================================
// Monthly Table
// =========================================

function renderMonthlyTable(months) {

    const tbody =
        document.getElementById(
            "monthlySummaryTable"
        );

    if (!tbody) {
        return;
    }

    if (!months.length) {

        tbody.innerHTML = `
            <tr>
                <td
                    colspan="7"
                    style="
                        text-align:center;
                        padding:35px;
                        color:#7c8594;
                    "
                >
                    No expenses found for
                    ${summaryYear.value}.
                </td>
            </tr>
        `;

        return;
    }

    tbody.innerHTML =
        months.map(
            (month, index) => {

                const topCategory =
                    month.categories &&
                    month.categories.length
                        ? month.categories[0]
                        : null;

                /*
                 * Example:
                 * month = 2026-10
                 *
                 * We create:
                 * 2026-10-01
                 * 2026-10-31
                 */

                const [year, monthNumber] =
                    month.month.split("-");

                const firstDate =
                    `${year}-${monthNumber}-01`;

                const lastDay =
                    new Date(
                        Number(year),
                        Number(monthNumber),
                        0
                    ).getDate();

                const lastDate =
                    `${year}-${monthNumber}-${String(
                        lastDay
                    ).padStart(2, "0")}`;

                const expensesUrl =
                    `/frontend/expenses/expenses.html?from_date=${firstDate}&to_date=${lastDate}`;

                return `
                    <tr>

                        <td>
                            ${index + 1}
                        </td>

                        <td>
                            <span class="month-name">
                                ${formatMonth(
                                    month.month
                                )}
                            </span>
                        </td>

                        <td>
                            ${formatNumber(
                                month.expense_count
                            )}
                        </td>

                        <td>
                            ${formatCurrency(
                                month.average_expense
                            )}
                        </td>

                        <td>
                            <span class="month-total">
                                ${formatCurrency(
                                    month.total_amount
                                )}
                            </span>
                        </td>

                        <td>
                            ${
                                topCategory
                                    ? `
                                        <span class="month-top-category">
                                            ${formatCategory(
                                                topCategory.category
                                            )}
                                        </span>
                                    `
                                    : "-"
                            }
                        </td>

                        <td>

                            <a
                                href="${expensesUrl}"
                                class="month-details-btn"
                            >
                                View
                            </a>

                        </td>

                    </tr>
                `;
            }
        ).join("");
}

// =========================================
// View Month
// =========================================

function showMonthDetailsByIndex(index) {

    console.log(
        "Opening month details:",
        index
    );

    if (
        !monthlySummaryData ||
        !Array.isArray(
            monthlySummaryData.months
        )
    ) {

        console.error(
            "Monthly summary data is missing."
        );

        return;
    }

    const month =
        monthlySummaryData.months[index];

    if (!month) {

        console.error(
            "Month not found:",
            index
        );

        return;
    }

    showMonthDetails(month);
}


// =========================================
// Show Month Details
// =========================================

function showMonthDetails(month) {

    const title =
        document.getElementById(
            "monthDetailsTitle"
        );

    const grid =
        document.getElementById(
            "monthCategoryGrid"
        );

    if (!title || !grid) {

        console.error(
            "Month details elements not found."
        );

        return;
    }


    title.textContent =
        `${formatMonth(month.month)} - Category Details`;


    if (
        !month.categories ||
        !month.categories.length
    ) {

        grid.innerHTML = `
            <div
                style="
                    color:#7c8594;
                    font-size:13px;
                "
            >
                No category data available.
            </div>
        `;

    } else {

        grid.innerHTML =
            month.categories.map(
                category => `
                    <div class="month-category-card">

                        <h4>
                            ${formatCategory(
                    category.category
                )}
                        </h4>

                        <div class="category-count">
                            ${formatNumber(
                    category.expense_count
                )}
                            transaction(s)
                        </div>

                        <div class="category-amount">
                            ${formatCurrency(
                    category.total_amount
                )}
                        </div>

                    </div>
                `
            ).join("");
    }


    /*
     * Scroll to details section
     */

    const detailsCard =
        document.getElementById(
            "monthDetailsCard"
        );

    if (detailsCard) {

        setTimeout(() => {

            detailsCard.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        }, 100);
    }
}


// =========================================
// Empty Details
// =========================================

function showEmptyMonthDetails() {

    const title =
        document.getElementById(
            "monthDetailsTitle"
        );

    const grid =
        document.getElementById(
            "monthCategoryGrid"
        );

    if (!title || !grid) {
        return;
    }

    title.textContent =
        "Month Details";

    grid.innerHTML = `
        <div
            style="
                color:#7c8594;
                font-size:13px;
            "
        >
            No expense data available.
        </div>
    `;
}


// =========================================
// Navigation
// =========================================

function goBackToExpenses() {

    window.location.href =
        "/frontend/expenses/expenses.html";
}


// =========================================
// Events
// =========================================

function setupMonthlyEvents() {

    if (summaryYear) {

        summaryYear.addEventListener(
            "change",
            loadMonthlySummary
        );
    }


    if (summaryCar) {

        summaryCar.addEventListener(
            "change",
            loadMonthlySummary
        );
    }
}


// =========================================
// Initialize
// =========================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        try {

            populateYears();

            setupMonthlyEvents();

            await loadSummaryCars();

            await loadMonthlySummary();

        } catch (error) {

            console.error(
                "Monthly summary initialization error:",
                error
            );

            showError(
                error.message ||
                "Failed to initialize monthly summary."
            );
        }
    }
);