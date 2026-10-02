let categoryExpenseChart = null;
let paymentExpenseChart = null;
let monthlyExpenseChart = null;
let carExpenseChart = null;

let analyticsCars = [];
let analyticsCategories = [];

const analyticsFromDate =
    document.getElementById("analyticsFromDate");

const analyticsToDate =
    document.getElementById("analyticsToDate");

const analyticsCarFilter =
    document.getElementById("analyticsCarFilter");

const analyticsCategoryFilter =
    document.getElementById(
        "analyticsCategoryFilter"
    );

const analyticsLoading =
    document.getElementById("analyticsLoading");

const analyticsError =
    document.getElementById("analyticsError");

const analyticsErrorMessage =
    document.getElementById(
        "analyticsErrorMessage"
    );

const analyticsContent =
    document.getElementById("analyticsContent");


// =========================================
// Helpers
// =========================================

function formatCurrency(amount) {
    const value = Number(amount || 0);

    return new Intl.NumberFormat(
        "en-IN",
        {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 2
        }
    ).format(value);
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


function formatPaymentMethod(method) {
    if (!method) {
        return "-";
    }

    return method
        .replace(/_/g, " ")
        .replace(/\b\w/g, letter =>
            letter.toUpperCase()
        );
}


function getCarLabel(carId) {
    const car =
        analyticsCars.find(
            item =>
                Number(item.id) ===
                Number(carId)
        );

    if (!car) {
        return `Car #${carId}`;
    }

    const registration =
        car.registration_number || "";

    const brand =
        car.brand || "";

    const model =
        car.model || "";

    const vehicleName =
        `${brand} ${model}`.trim();

    if (registration && vehicleName) {
        return `${registration} - ${vehicleName}`;
    }

    return (
        registration ||
        vehicleName ||
        `Car #${carId}`
    );
}


// =========================================
// UI State
// =========================================

function showAnalyticsLoading() {

    analyticsLoading.style.display =
        "flex";

    analyticsError.style.display =
        "none";

    analyticsContent.style.display =
        "none";
}


function showAnalyticsContent() {

    analyticsLoading.style.display =
        "none";

    analyticsError.style.display =
        "none";

    analyticsContent.style.display =
        "block";
}


function showAnalyticsError(message) {

    analyticsLoading.style.display =
        "none";

    analyticsContent.style.display =
        "none";

    analyticsError.style.display =
        "flex";

    analyticsErrorMessage.textContent =
        message ||
        "Failed to load expense analytics.";
}


// =========================================
// Load Cars
// =========================================

async function loadAnalyticsCars() {

    try {

        const response =
            await apiRequest("/cars/");

        analyticsCars =
            Array.isArray(response)
                ? response
                : response?.items || [];

        renderCarFilter();

    } catch (error) {

        console.error(
            "Load analytics cars error:",
            error
        );

        analyticsCars = [];

        renderCarFilter();
    }
}


function renderCarFilter() {

    if (!analyticsCarFilter) {
        return;
    }

    analyticsCarFilter.innerHTML = `
        <option value="">
            All Cars
        </option>
    `;

    analyticsCars.forEach(car => {

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

        analyticsCarFilter.appendChild(
            option
        );
    });
}


// =========================================
// Load Categories
// =========================================

async function loadAnalyticsCategories() {

    try {

        const response =
            await apiRequest(
                "/expenses/categories"
            );

        analyticsCategories =
            Array.isArray(response)
                ? response
                : [];

        renderCategoryFilter();

    } catch (error) {

        console.error(
            "Load analytics categories error:",
            error
        );

        analyticsCategories = [];

        renderCategoryFilter();
    }
}


function renderCategoryFilter() {

    if (!analyticsCategoryFilter) {
        return;
    }

    analyticsCategoryFilter.innerHTML = `
        <option value="">
            All Categories
        </option>
    `;

    analyticsCategories.forEach(
        category => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                category.value;

            option.textContent =
                category.label;

            analyticsCategoryFilter
                .appendChild(option);
        }
    );
}


// =========================================
// Build API URL
// =========================================

function buildAnalyticsUrl() {

    const params =
        new URLSearchParams();

    if (
        analyticsFromDate &&
        analyticsFromDate.value
    ) {
        params.set(
            "from_date",
            analyticsFromDate.value
        );
    }

    if (
        analyticsToDate &&
        analyticsToDate.value
    ) {
        params.set(
            "to_date",
            analyticsToDate.value
        );
    }

    if (
        analyticsCarFilter &&
        analyticsCarFilter.value
    ) {
        params.set(
            "car_id",
            analyticsCarFilter.value
        );
    }

    if (
        analyticsCategoryFilter &&
        analyticsCategoryFilter.value
    ) {
        params.set(
            "category",
            analyticsCategoryFilter.value
        );
    }

    const queryString =
        params.toString();

    return queryString
        ? `/expenses/analytics?${queryString}`
        : "/expenses/analytics";
}


// =========================================
// Main Analytics API
// =========================================

async function loadExpenseAnalytics() {

    if (
        analyticsFromDate &&
        analyticsToDate &&
        analyticsFromDate.value &&
        analyticsToDate.value &&
        analyticsFromDate.value >
        analyticsToDate.value
    ) {

        alert(
            "From Date cannot be later than To Date."
        );

        return;
    }

    showAnalyticsLoading();

    try {

        const data =
            await apiRequest(
                buildAnalyticsUrl()
            );

        renderAnalytics(data);

        showAnalyticsContent();

    } catch (error) {

        console.error(
            "Expense analytics error:",
            error
        );

        showAnalyticsError(
            error.message ||
            "Failed to load expense analytics."
        );
    }
}


// =========================================
// Render Analytics
// =========================================

function renderAnalytics(data) {

    renderSummary(data);

    renderCategoryChart(
        data.category_summary || []
    );

    renderPaymentChart(
        data.payment_summary || []
    );

    renderMonthlyChart(
        data.monthly_summary || []
    );

    renderCarChart(
        data.car_summary || []
    );

    renderCategoryTable(
        data.category_summary || []
    );
}


// =========================================
// Summary
// =========================================

function renderSummary(data) {

    document.getElementById(
        "totalExpenseAmount"
    ).textContent =
        formatCurrency(
            data.total_amount
        );

    document.getElementById(
        "totalExpenseCount"
    ).textContent =
        formatNumber(
            data.total_expenses
        );

    document.getElementById(
        "averageExpenseAmount"
    ).textContent =
        formatCurrency(
            data.average_expense
        );
}


// =========================================
// Category Chart
// =========================================

function renderCategoryChart(rows) {

    const canvas =
        document.getElementById(
            "categoryExpenseChart"
        );

    if (!canvas) {
        return;
    }

    if (categoryExpenseChart) {
        categoryExpenseChart.destroy();
    }

    const labels =
        rows.map(
            row =>
                formatCategory(
                    row.category
                )
        );

    const values =
        rows.map(
            row =>
                Number(
                    row.total_amount || 0
                )
        );

    categoryExpenseChart =
        new Chart(
            canvas,
            {
                type: "doughnut",

                data: {
                    labels,

                    datasets: [
                        {
                            data: values,

                            borderWidth: 2,

                            hoverOffset: 8
                        }
                    ]
                },

                options: {
                    responsive: true,

                    maintainAspectRatio: false,

                    plugins: {
                        legend: {
                            position: "bottom"
                        },

                        tooltip: {
                            callbacks: {
                                label:
                                    function (
                                        context
                                    ) {

                                        return (
                                            " " +
                                            formatCurrency(
                                                context.raw
                                            )
                                        );
                                    }
                            }
                        }
                    }
                }
            }
        );
}


// =========================================
// Payment Chart
// =========================================

function renderPaymentChart(rows) {

    const canvas =
        document.getElementById(
            "paymentExpenseChart"
        );

    if (!canvas) {
        return;
    }

    if (paymentExpenseChart) {
        paymentExpenseChart.destroy();
    }

    const labels =
        rows.map(
            row =>
                formatPaymentMethod(
                    row.payment_method
                )
        );

    const values =
        rows.map(
            row =>
                Number(
                    row.total_amount || 0
                )
        );

    paymentExpenseChart =
        new Chart(
            canvas,
            {
                type: "doughnut",

                data: {
                    labels,

                    datasets: [
                        {
                            data: values,

                            borderWidth: 2,

                            hoverOffset: 8
                        }
                    ]
                },

                options: {
                    responsive: true,

                    maintainAspectRatio: false,

                    cutout: "62%",

                    plugins: {
                        legend: {
                            position: "bottom"
                        },

                        tooltip: {
                            callbacks: {
                                label:
                                    function (
                                        context
                                    ) {

                                        return (
                                            " " +
                                            formatCurrency(
                                                context.raw
                                            )
                                        );
                                    }
                            }
                        }
                    }
                }
            }
        );
}


// =========================================
// Monthly Chart
// =========================================

function renderMonthlyChart(rows) {

    const canvas =
        document.getElementById(
            "monthlyExpenseChart"
        );

    if (!canvas) {
        return;
    }

    if (monthlyExpenseChart) {
        monthlyExpenseChart.destroy();
    }

    const labels =
        rows.map(
            row => row.month
        );

    const values =
        rows.map(
            row =>
                Number(
                    row.total_amount || 0
                )
        );

    monthlyExpenseChart =
        new Chart(
            canvas,
            {
                type: "line",

                data: {
                    labels,

                    datasets: [
                        {
                            label:
                                "Expense Amount",

                            data: values,

                            tension: 0.35,

                            fill: true,

                            borderWidth: 2,

                            pointRadius: 4,

                            pointHoverRadius: 6
                        }
                    ]
                },

                options: {
                    responsive: true,

                    maintainAspectRatio: false,

                    interaction: {
                        intersect: false,

                        mode: "index"
                    },

                    scales: {

                        y: {
                            beginAtZero: true,

                            ticks: {
                                callback:
                                    function (
                                        value
                                    ) {
                                        return formatCurrency(
                                            value
                                        );
                                    }
                            }
                        }

                    },

                    plugins: {

                        legend: {
                            display: false
                        },

                        tooltip: {
                            callbacks: {
                                label:
                                    function (
                                        context
                                    ) {

                                        return (
                                            " " +
                                            formatCurrency(
                                                context.raw
                                            )
                                        );
                                    }
                            }
                        }
                    }
                }
            }
        );
}


// =========================================
// Car Chart
// =========================================

function renderCarChart(rows) {

    const canvas =
        document.getElementById(
            "carExpenseChart"
        );

    if (!canvas) {
        return;
    }

    if (carExpenseChart) {
        carExpenseChart.destroy();
    }

    const labels =
        rows.map(
            row =>
                getCarLabel(
                    row.car_id
                )
        );

    const values =
        rows.map(
            row =>
                Number(
                    row.total_amount || 0
                )
        );

    carExpenseChart =
        new Chart(
            canvas,
            {
                type: "bar",

                data: {
                    labels,

                    datasets: [
                        {
                            label:
                                "Total Expense",

                            data: values,

                            borderWidth: 1,

                            borderRadius: 7
                        }
                    ]
                },

                options: {
                    responsive: true,

                    maintainAspectRatio: false,

                    scales: {

                        y: {
                            beginAtZero: true,

                            ticks: {
                                callback:
                                    function (
                                        value
                                    ) {
                                        return formatCurrency(
                                            value
                                        );
                                    }
                            }
                        }

                    },

                    plugins: {

                        legend: {
                            display: false
                        },

                        tooltip: {
                            callbacks: {
                                label:
                                    function (
                                        context
                                    ) {

                                        return (
                                            " " +
                                            formatCurrency(
                                                context.raw
                                            )
                                        );
                                    }
                            }
                        }
                    }
                }
            }
        );
}


// =========================================
// Category Table
// =========================================

function renderCategoryTable(rows) {

    const tbody =
        document.getElementById(
            "categorySummaryTable"
        );

    if (!tbody) {
        return;
    }

    if (!rows.length) {

        tbody.innerHTML = `
            <tr>
                <td
                    colspan="4"
                    style="
                        text-align:center;
                        padding:30px;
                        color:#7c8594;
                    "
                >
                    No expense data available.
                </td>
            </tr>
        `;

        return;
    }

    tbody.innerHTML =
        rows.map(
            (row, index) => `
                <tr>

                    <td>
                        ${index + 1}
                    </td>

                    <td>
                        <span
                            class="analytics-category-name"
                        >
                            ${formatCategory(
                row.category
            )}
                        </span>
                    </td>

                    <td>
                        ${formatNumber(
                row.expense_count
            )}
                    </td>

                    <td>
                        <span
                            class="analytics-amount"
                        >
                            ${formatCurrency(
                row.total_amount
            )}
                        </span>
                    </td>

                </tr>
            `
        )
            .join("");
}


// =========================================
// Reset
// =========================================

function resetAnalyticsFilters() {

    if (analyticsFromDate) {
        analyticsFromDate.value = "";
    }

    if (analyticsToDate) {
        analyticsToDate.value = "";
        analyticsToDate.min = "";
    }

    if (analyticsCarFilter) {
        analyticsCarFilter.value = "";
    }

    if (analyticsCategoryFilter) {
        analyticsCategoryFilter.value = "";
    }

    loadExpenseAnalytics();
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

function setupAnalyticsEvents() {

    if (analyticsCarFilter) {

        analyticsCarFilter.addEventListener(
            "change",
            loadExpenseAnalytics
        );
    }

    if (analyticsCategoryFilter) {

        analyticsCategoryFilter.addEventListener(
            "change",
            loadExpenseAnalytics
        );
    }


    if (analyticsFromDate) {

        analyticsFromDate.addEventListener(
            "change",
            () => {

                if (analyticsToDate) {

                    analyticsToDate.min =
                        analyticsFromDate.value ||
                        "";
                }

                if (
                    analyticsFromDate.value &&
                    analyticsToDate.value &&
                    analyticsFromDate.value >
                    analyticsToDate.value
                ) {

                    alert(
                        "From Date cannot be later than To Date."
                    );

                    analyticsFromDate.value =
                        "";

                    if (analyticsToDate) {
                        analyticsToDate.min =
                            "";
                    }

                    return;
                }

                loadExpenseAnalytics();
            }
        );
    }


    if (analyticsToDate) {

        analyticsToDate.addEventListener(
            "change",
            () => {

                if (
                    analyticsFromDate.value &&
                    analyticsToDate.value &&
                    analyticsFromDate.value >
                    analyticsToDate.value
                ) {

                    alert(
                        "From Date cannot be later than To Date."
                    );

                    analyticsToDate.value =
                        "";

                    return;
                }

                loadExpenseAnalytics();
            }
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

            setupAnalyticsEvents();

            await Promise.all([
                loadAnalyticsCars(),
                loadAnalyticsCategories()
            ]);

            await loadExpenseAnalytics();

        } catch (error) {

            console.error(
                "Expense analytics initialization error:",
                error
            );

            showAnalyticsError(
                error.message ||
                "Failed to initialize expense analytics."
            );
        }
    }
);