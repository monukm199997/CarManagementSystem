/* =========================================================
   REPORTS MODULE
   Car Management System
   ========================================================= */

"use strict";

/* =========================================================
   REPORT CONFIGURATION
   ========================================================= */

const REPORT_CONFIG = {

    dashboard: {
        title: "Dashboard Summary",
        description: "Overview of your vehicle management data.",
        endpoint: "/reports/dashboard-summary",
        dateFilter: true,
        exports: false
    },

    vehicles: {
        title: "Vehicle Report",
        description: "Vehicle-wise report and details.",
        endpoint: "/reports/vehicles",

        filters: [
            {
                key: "car_id",
                label: "Vehicle ID",
                type: "number"
            },
            {
                key: "status",
                label: "Status",
                type: "select",
                options: [
                    "",
                    "active",
                    "inactive"
                ]
            }
        ],

        exports: true,
        fileBase: "vehicles"
    },

    services: {
        title: "Service Report",
        description: "Service history and service-related data.",
        endpoint: "/reports/services",

        filters: [
            {
                key: "car_id",
                label: "Vehicle ID",
                type: "number"
            },
            {
                key: "status",
                label: "Status",
                type: "select",
                options: [
                    "",
                    "active",
                    "inactive"
                ]
            },
            {
                key: "service_type",
                label: "Service Type",
                type: "text"
            }
        ],

        exports: true,
        fileBase: "services"
    },

    fuel: {
        title: "Fuel Report",
        description: "Fuel records and fuel consumption data.",
        endpoint: "/reports/fuel",

        filters: [
            {
                key: "car_id",
                label: "Vehicle ID",
                type: "number"
            },
            {
                key: "fuel_type",
                label: "Fuel Type",
                type: "text"
            }
        ],

        exports: true,
        fileBase: "fuel"
    },

    expenses: {
        title: "Expense Report",
        description: "Vehicle expense and cost details.",
        endpoint: "/reports/expenses",

        filters: [
            {
                key: "car_id",
                label: "Vehicle ID",
                type: "number"
            },
            {
                key: "driver_id",
                label: "Driver ID",
                type: "number"
            },
            {
                key: "trip_id",
                label: "Trip ID",
                type: "number"
            },
            {
                key: "category",
                label: "Category",
                type: "text"
            },
            {
                key: "status",
                label: "Status",
                type: "select",
                options: [
                    "",
                    "active",
                    "inactive"
                ]
            }
        ],

        exports: true,
        fileBase: "expenses"
    },

    drivers: {
        title: "Driver Report",
        description: "Driver information and operational data.",
        endpoint: "/reports/drivers",

        filters: [
            {
                key: "driver_id",
                label: "Driver ID",
                type: "number"
            },
            {
                key: "status",
                label: "Status",
                type: "select",
                options: [
                    "",
                    "active",
                    "inactive",
                    "suspended"
                ]
            }
        ],

        exports: true,
        fileBase: "drivers",

        customerAllowed: false
    },

    trips: {
        title: "Trip Report",
        description: "Trip history and trip-related information.",
        endpoint: "/reports/trips",

        filters: [
            {
                key: "car_id",
                label: "Vehicle ID",
                type: "number"
            },
            {
                key: "driver_id",
                label: "Driver ID",
                type: "number"
            },
            {
                key: "status",
                label: "Status",
                type: "select",
                options: [
                    "",
                    "planned",
                    "ongoing",
                    "completed",
                    "cancelled"
                ]
            }
        ],

        exports: true,
        fileBase: "trips"
    },

    documents: {
        title: "Documents Report",
        description: "Vehicle document and expiry information.",
        endpoint: "/reports/documents",

        filters: [
            {
                key: "car_id",
                label: "Vehicle ID",
                type: "number"
            },
            {
                key: "document_type",
                label: "Document Type",
                type: "text"
            },
            {
                key: "status",
                label: "Status",
                type: "select",
                options: [
                    "",
                    "active",
                    "inactive"
                ]
            },
            {
                key: "insurance_status",
                label: "Insurance Status",
                type: "text"
            }
        ],

        exports: true,
        fileBase: "documents"
    },

    "vehicle-cost": {
        title: "Vehicle Cost Report",
        description: "Combined vehicle cost analysis.",
        endpoint: "/reports/vehicle-cost",

        filters: [
            {
                key: "car_id",
                label: "Vehicle ID",
                type: "number"
            }
        ],

        dateFilter: true,
        exports: true,
        fileBase: "vehicle_cost"
    },

    "download-history": {
        title: "Download History",
        description: "History of generated report downloads.",
        endpoint: "/reports/download-history",

        filters: [
            {
                key: "report_type",
                label: "Report Type",
                type: "text"
            },
            {
                key: "export_format",
                label: "Export Format",
                type: "select",
                options: [
                    "",
                    "csv",
                    "excel",
                    "pdf"
                ]
            }
        ],

        exports: false
    }
};


/* =========================================================
   GLOBAL STATE
   ========================================================= */

let reportState = {

    currentReport: "dashboard",

    page: 1,

    pageSize: 20,

    totalRecords: 0,

    totalPages: 0,

    filters: {},

    loading: false
};


/* =========================================================
   INITIALIZATION
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    initializeReports();

});


/* =========================================================
   INITIALIZE REPORT PAGE
   ========================================================= */

function initializeReports() {

    const user = getReportUser();

    if (!user) {
        return;
    }

    applyRoleVisibility(user);

    const reportType = getReportTypeFromUrl();

    if (!REPORT_CONFIG[reportType]) {

        reportState.currentReport = "dashboard";

    } else {

        reportState.currentReport = reportType;

    }

    renderReportPage();

    loadReport();

}


/* =========================================================
   GET USER
   ========================================================= */

function getReportUser() {

    try {

        const userData = localStorage.getItem("user");

        if (!userData) {
            return null;
        }

        return JSON.parse(userData);

    } catch (error) {

        console.error("Unable to read user:", error);

        return null;
    }
}


/* =========================================================
   ROLE VISIBILITY
   ========================================================= */

function applyRoleVisibility(user) {

    const role = String(user.role || "").toLowerCase();

    const driverMenu = document.querySelector(
        '[data-report="drivers"]'
    );

    if (driverMenu) {

        if (role === "customer") {

            driverMenu.style.display = "none";

        } else {

            driverMenu.style.display = "";
        }
    }
}


/* =========================================================
   GET REPORT TYPE FROM URL
   ========================================================= */

function getReportTypeFromUrl() {

    const params = new URLSearchParams(
        window.location.search
    );

    let reportType = params.get("report");

    if (reportType) {
        return reportType;
    }

    const hash = window.location.hash;

    if (hash) {

        const hashValue = hash.replace("#", "");

        if (REPORT_CONFIG[hashValue]) {
            return hashValue;
        }
    }

    return "dashboard";
}


/* =========================================================
   RENDER REPORT PAGE
   ========================================================= */

function renderReportPage() {

    const config =
        REPORT_CONFIG[reportState.currentReport];

    if (!config) {
        return;
    }

    const titleElement =
        document.getElementById("reportTitle");

    const descriptionElement =
        document.getElementById("reportDescription");

    if (titleElement) {

        titleElement.textContent =
            config.title;
    }

    if (descriptionElement) {

        descriptionElement.textContent =
            config.description;
    }

    renderReportFilters();

    renderReportActions();

}


/* =========================================================
   RENDER FILTERS
   ========================================================= */

function renderReportFilters() {

    const container =
        document.getElementById("reportFilters");

    if (!container) {
        return;
    }

    const config =
        REPORT_CONFIG[reportState.currentReport];

    let html = "";

    /* -------------------------
       DATE FILTER
       ------------------------- */

    if (config.dateFilter) {

        html += `
            <div class="col-md-3 mb-3">
                <label
                    for="reportFromDate"
                    class="form-label"
                >
                    From Date
                </label>

                <input
                    type="date"
                    id="reportFromDate"
                    class="form-control"
                >
            </div>
        `;

        html += `
            <div class="col-md-3 mb-3">
                <label
                    for="reportToDate"
                    class="form-label"
                >
                    To Date
                </label>

                <input
                    type="date"
                    id="reportToDate"
                    class="form-control"
                >
            </div>
        `;
    }

    /* -------------------------
       REPORT FILTERS
       ------------------------- */

    if (Array.isArray(config.filters)) {

        config.filters.forEach(function (filter) {

            html += createFilterHtml(filter);

        });
    }

    /* -------------------------
       BUTTONS
       ------------------------- */

    html += `
        <div class="col-md-3 mb-3 d-flex align-items-end">
            <button
                type="button"
                id="applyReportFilters"
                class="btn btn-primary me-2"
            >
                Apply
            </button>

            <button
                type="button"
                id="clearReportFilters"
                class="btn btn-secondary"
            >
                Clear
            </button>
        </div>
    `;

    container.innerHTML = html;

    bindFilterEvents();

}


/* =========================================================
   CREATE FILTER HTML
   ========================================================= */

function createFilterHtml(filter) {

    const id =
        `reportFilter_${filter.key}`;

    let inputHtml = "";

    /* NUMBER */

    if (filter.type === "number") {

        inputHtml = `
            <input
                type="number"
                id="${id}"
                class="form-control"
                placeholder="${escapeHtml(filter.label)}"
            >
        `;
    }

    /* SELECT */

    else if (filter.type === "select") {

        const options =
            (filter.options || [])
                .map(function (option) {

                    const selected =
                        option === ""
                            ? "selected"
                            : "";

                    const label =
                        option === ""
                            ? `Select ${filter.label}`
                            : option;

                    return `
                        <option
                            value="${escapeHtml(option)}"
                            ${selected}
                        >
                            ${escapeHtml(label)}
                        </option>
                    `;

                })
                .join("");

        inputHtml = `
            <select
                id="${id}"
                class="form-select"
            >
                ${options}
            </select>
        `;
    }

    /* TEXT */

    else {

        inputHtml = `
            <input
                type="text"
                id="${id}"
                class="form-control"
                placeholder="${escapeHtml(filter.label)}"
            >
        `;
    }

    return `
        <div class="col-md-3 mb-3">

            <label
                for="${id}"
                class="form-label"
            >
                ${escapeHtml(filter.label)}
            </label>

            ${inputHtml}

        </div>
    `;
}


/* =========================================================
   BIND FILTER EVENTS
   ========================================================= */

function bindFilterEvents() {

    const applyButton =
        document.getElementById(
            "applyReportFilters"
        );

    const clearButton =
        document.getElementById(
            "clearReportFilters"
        );

    if (applyButton) {

        applyButton.addEventListener(
            "click",
            function () {

                collectReportFilters();

                reportState.page = 1;

                loadReport();

            }
        );
    }

    if (clearButton) {

        clearButton.addEventListener(
            "click",
            function () {

                clearReportFilters();

            }
        );
    }

}


/* =========================================================
   COLLECT FILTERS
   ========================================================= */

function collectReportFilters() {

    const config =
        REPORT_CONFIG[reportState.currentReport];

    const filters = {};

    /* -------------------------
       DATE
       ------------------------- */

    if (config.dateFilter) {

        const fromDate =
            document.getElementById(
                "reportFromDate"
            );

        const toDate =
            document.getElementById(
                "reportToDate"
            );

        if (fromDate && fromDate.value) {

            filters.from_date =
                fromDate.value;
        }

        if (toDate && toDate.value) {

            filters.to_date =
                toDate.value;
        }
    }

    /* -------------------------
       OTHER FILTERS
       ------------------------- */

    if (Array.isArray(config.filters)) {

        config.filters.forEach(function (filter) {

            const element =
                document.getElementById(
                    `reportFilter_${filter.key}`
                );

            if (!element) {
                return;
            }

            const value =
                element.value;

            if (
                value !== undefined &&
                value !== null &&
                value !== ""
            ) {

                filters[filter.key] =
                    value;
            }
        });
    }

    reportState.filters =
        filters;

}


/* =========================================================
   CLEAR FILTERS
   ========================================================= */

function clearReportFilters() {

    reportState.filters = {};

    reportState.page = 1;

    renderReportFilters();

    loadReport();

}


/* =========================================================
   RENDER ACTIONS
   ========================================================= */

function renderReportActions() {

    const container =
        document.getElementById(
            "reportActions"
        );

    if (!container) {
        return;
    }

    const config =
        REPORT_CONFIG[
            reportState.currentReport
        ];

    if (!config) {
        return;
    }

    if (!config.exports) {

        container.innerHTML = "";

        return;
    }

    container.innerHTML = `

        <div class="d-flex gap-2 flex-wrap">

            <button
                type="button"
                class="btn btn-outline-success"
                id="exportCsvButton"
            >
                CSV
            </button>

            <button
                type="button"
                class="btn btn-outline-primary"
                id="exportExcelButton"
            >
                Excel
            </button>

            <button
                type="button"
                class="btn btn-outline-danger"
                id="exportPdfButton"
            >
                PDF
            </button>

        </div>

    `;

    const csvButton =
        document.getElementById(
            "exportCsvButton"
        );

    const excelButton =
        document.getElementById(
            "exportExcelButton"
        );

    const pdfButton =
        document.getElementById(
            "exportPdfButton"
        );

    if (csvButton) {

        csvButton.addEventListener(
            "click",
            function () {

                downloadReport("csv");

            }
        );
    }

    if (excelButton) {

        excelButton.addEventListener(
            "click",
            function () {

                downloadReport("excel");

            }
        );
    }

    if (pdfButton) {

        pdfButton.addEventListener(
            "click",
            function () {

                downloadReport("pdf");

            }
        );
    }

}


/* =========================================================
   LOAD REPORT
   ========================================================= */

async function loadReport() {

    const reportType =
        reportState.currentReport;

    if (!REPORT_CONFIG[reportType]) {

        showReportError(
            "Invalid report selected."
        );

        return;
    }

    if (reportType === "dashboard") {

        await loadDashboardReport();

        return;
    }

    await loadGenericReport(reportType);

}


/* =========================================================
   LOAD GENERIC REPORT
   ========================================================= */

async function loadGenericReport(reportType) {

    setLoading(true);

    hideReportError();

    try {

        const config =
            REPORT_CONFIG[reportType];

        const params =
            new URLSearchParams();

        Object.entries(
            reportState.filters || {}
        ).forEach(function ([key, value]) {

            if (
                value !== undefined &&
                value !== null &&
                value !== ""
            ) {

                params.append(
                    key,
                    value
                );
            }
        });

        params.append(
            "page",
            reportState.page || 1
        );

        params.append(
            "page_size",
            reportState.pageSize
        );

        const query =
            params.toString();

        const endpoint =
            `${config.endpoint}` +
            `${query ? `?${query}` : ""}`;

        const data =
            await apiRequest(endpoint);

        renderGenericReport(
            reportType,
            data
        );

    } catch (error) {

        console.error(
            `${reportType} report error:`,
            error
        );

        showReportError(
            error.message ||
            `Failed to load ${
                REPORT_CONFIG[reportType]?.title ||
                "report"
            }.`
        );

    } finally {

        setLoading(false);

    }

}


/* =========================================================
   GENERIC REPORT RENDERER
   ========================================================= */

function renderGenericReport(
    reportType,
    data
) {

    const container =
        document.getElementById(
            "reportContent"
        );

    if (!container) {
        return;
    }

    const rows =
        Array.isArray(data?.data)
            ? data.data
            : Array.isArray(data)
                ? data
                : [];

    updatePagination(
        data?.pagination
    );

    if (!rows.length) {

        container.innerHTML = `

            <div class="card border-0 shadow-sm">

                <div class="card-body text-center py-5">

                    <div class="fs-1 mb-3">
                        📊
                    </div>

                    <h5>
                        No records found
                    </h5>

                    <p class="text-muted mb-0">
                        No data is available
                        for the selected filters.
                    </p>

                </div>

            </div>

        `;

        return;
    }

    const keys =
        getTableKeys(rows);

    const headers =
        keys
            .map(function (key) {

                return `
                    <th>
                        ${escapeHtml(
                            formatColumnName(key)
                        )}
                    </th>
                `;

            })
            .join("");

    const body =
        rows
            .map(function (row) {

                const cells =
                    keys
                        .map(function (key) {

                            return `
                                <td>
                                    ${formatCellValue(
                                        row?.[key],
                                        key
                                    )}
                                </td>
                            `;

                        })
                        .join("");

                return `
                    <tr>
                        ${cells}
                    </tr>
                `;

            })
            .join("");

    container.innerHTML = `

        <div class="card border-0 shadow-sm">

            <div class="card-body p-0">

                <div class="table-responsive">

                    <table
                        class="table table-hover table-bordered mb-0"
                    >

                        <thead class="table-light">

                            <tr>
                                ${headers}
                            </tr>

                        </thead>

                        <tbody>
                            ${body}
                        </tbody>

                    </table>

                </div>

            </div>

        </div>

        <div id="reportPagination"></div>

    `;

    renderPagination();

}


/* =========================================================
   GET TABLE KEYS
   ========================================================= */

function getTableKeys(rows) {

    const keySet =
        new Set();

    rows.forEach(function (row) {

        if (!row || typeof row !== "object") {
            return;
        }

        Object.keys(row).forEach(function (key) {

            keySet.add(key);

        });

    });

    return Array.from(keySet);

}


/* =========================================================
   FORMAT COLUMN NAME
   ========================================================= */

function formatColumnName(key) {

    if (!key) {
        return "";
    }

    return String(key)
        .replace(/_/g, " ")
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/\b\w/g, function (char) {
            return char.toUpperCase();
        });

}


/* =========================================================
   FORMAT CELL VALUE
   ========================================================= */

function formatCellValue(value, key) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return `<span class="text-muted">-</span>`;

    }

    if (typeof value === "boolean") {

        return value
            ? `<span class="badge bg-success">Yes</span>`
            : `<span class="badge bg-secondary">No</span>`;

    }

    if (
        typeof value === "object"
    ) {

        try {

            return escapeHtml(
                JSON.stringify(value)
            );

        } catch (error) {

            return "-";

        }
    }

    if (
        key &&
        (
            key.toLowerCase().includes("date") ||
            key.toLowerCase().includes("datetime")
        )
    ) {

        return escapeHtml(
            formatDateValue(value)
        );

    }

    if (
        key &&
        (
            key.toLowerCase().includes("amount") ||
            key.toLowerCase().includes("cost") ||
            key.toLowerCase().includes("price")
        ) &&
        !isNaN(value)
    ) {

        return escapeHtml(
            Number(value).toFixed(2)
        );

    }

    return escapeHtml(
        String(value)
    );

}


/* =========================================================
   DATE FORMAT
   ========================================================= */

function formatDateValue(value) {

    if (!value) {
        return "-";
    }

    const date =
        new Date(value);

    if (isNaN(date.getTime())) {

        return String(value);

    }

    return date.toLocaleString();

}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHtml(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* =========================================================
   LOADING STATE
   ========================================================= */

function setLoading(isLoading) {

    reportState.loading =
        isLoading;

    const loadingElement =
        document.getElementById(
            "reportLoading"
        );

    if (loadingElement) {

        loadingElement.style.display =
            isLoading
                ? "block"
                : "none";
    }

}


/* =========================================================
   ERROR
   ========================================================= */

function showReportError(message) {

    const errorElement =
        document.getElementById(
            "reportError"
        );

    if (!errorElement) {
        return;
    }

    errorElement.textContent =
        message || "Something went wrong.";

    errorElement.style.display =
        "block";

}


function hideReportError() {

    const errorElement =
        document.getElementById(
            "reportError"
        );

    if (!errorElement) {
        return;
    }

    errorElement.textContent = "";

    errorElement.style.display =
        "none";

}


/* =========================================================
   PAGINATION DATA
   ========================================================= */

function updatePagination(
    pagination
) {

    if (!pagination) {
        return;
    }

    reportState.page =
        pagination.page ||
        reportState.page;

    reportState.pageSize =
        pagination.page_size ||
        reportState.pageSize;

    reportState.totalRecords =
        pagination.total_records ||
        0;

    reportState.totalPages =
        pagination.total_pages ||
        0;

}


/* =========================================================
   RENDER PAGINATION
   ========================================================= */

function renderPagination() {

    const container =
        document.getElementById(
            "reportPagination"
        );

    if (!container) {
        return;
    }

    const totalPages =
        reportState.totalPages;

    if (!totalPages || totalPages <= 1) {

        container.innerHTML = "";

        return;
    }

    let html = `
        <div class="d-flex justify-content-between align-items-center mt-3 mb-3">

            <div class="text-muted small">
                Total Records:
                ${reportState.totalRecords}
            </div>

            <div class="d-flex gap-1">
    `;

    html += `
        <button
            type="button"
            class="btn btn-sm btn-outline-secondary"
            ${
                reportState.page <= 1
                    ? "disabled"
                    : ""
            }
            onclick="changeReportPage(${
                reportState.page - 1
            })"
        >
            Previous
        </button>
    `;

    const startPage =
        Math.max(
            1,
            reportState.page - 2
        );

    const endPage =
        Math.min(
            totalPages,
            reportState.page + 2
        );

    for (
        let page = startPage;
        page <= endPage;
        page++
    ) {

        html += `
            <button
                type="button"
                class="btn btn-sm ${
                    page === reportState.page
                        ? "btn-primary"
                        : "btn-outline-primary"
                }"
                onclick="changeReportPage(${page})"
            >
                ${page}
            </button>
        `;
    }

    html += `
        <button
            type="button"
            class="btn btn-sm btn-outline-secondary"
            ${
                reportState.page >= totalPages
                    ? "disabled"
                    : ""
            }
            onclick="changeReportPage(${
                reportState.page + 1
            })"
        >
            Next
        </button>
    `;

    html += `
            </div>

        </div>
    `;

    container.innerHTML =
        html;

}


/* =========================================================
   CHANGE PAGE
   ========================================================= */

async function changeReportPage(page) {

    if (
        page < 1 ||
        page > reportState.totalPages
    ) {

        return;

    }

    reportState.page =
        page;

    await loadReport();

}


/* =========================================================
   DASHBOARD REPORT
   ========================================================= */

async function loadDashboardReport() {

    setLoading(true);

    hideReportError();

    try {

        const params =
            new URLSearchParams();

        if (
            reportState.filters?.from_date
        ) {

            params.append(
                "from_date",
                reportState.filters.from_date
            );
        }

        if (
            reportState.filters?.to_date
        ) {

            params.append(
                "to_date",
                reportState.filters.to_date
            );
        }

        const query =
            params.toString();

        const endpoint =
            `/reports/dashboard-summary` +
            `${query ? `?${query}` : ""}`;

        const data =
            await apiRequest(endpoint);

        renderDashboardReport(data);

    } catch (error) {

        console.error(
            "Dashboard report error:",
            error
        );

        showReportError(
            error.message ||
            "Failed to load dashboard summary."
        );

    } finally {

        setLoading(false);

    }

}


/* =========================================================
   RENDER DASHBOARD
   ========================================================= */

function renderDashboardReport(data) {

    const container =
        document.getElementById(
            "reportContent"
        );

    if (!container) {
        return;
    }

    const source =
        data?.data ||
        data ||
        {};

    const cards = [
        {
            label: "Vehicles",
            value:
                source.total_vehicles ??
                source.vehicles ??
                source.vehicle_count ??
                0,
            icon: "🚗"
        },
        {
            label: "Drivers",
            value:
                source.total_drivers ??
                source.drivers ??
                source.driver_count ??
                0,
            icon: "👨‍✈️"
        },
        {
            label: "Services",
            value:
                source.total_services ??
                source.services ??
                source.service_count ??
                0,
            icon: "🔧"
        },
        {
            label: "Fuel Records",
            value:
                source.total_fuel_records ??
                source.fuel_records ??
                source.fuel_count ??
                0,
            icon: "⛽"
        },
        {
            label: "Expenses",
            value:
                source.total_expenses ??
                source.expenses ??
                source.expense_count ??
                0,
            icon: "💰"
        },
        {
            label: "Trips",
            value:
                source.total_trips ??
                source.trips ??
                source.trip_count ??
                0,
            icon: "🛣️"
        },
        {
            label: "Documents",
            value:
                source.total_documents ??
                source.documents ??
                source.document_count ??
                0,
            icon: "📄"
        },
        {
            label: "Vehicle Cost",
            value:
                source.total_vehicle_cost ??
                source.vehicle_cost ??
                source.total_cost ??
                0,
            icon: "💵"
        }
    ];

    const cardsHtml =
        cards.map(function (card) {

            return `
                <div class="col-md-3 mb-4">

                    <div
                        class="card border-0 shadow-sm h-100"
                    >

                        <div class="card-body">

                            <div
                                class="d-flex justify-content-between align-items-center"
                            >

                                <div>

                                    <div
                                        class="text-muted small mb-1"
                                    >
                                        ${escapeHtml(
                                            card.label
                                        )}
                                    </div>

                                    <h3
                                        class="mb-0"
                                    >
                                        ${formatNumber(
                                            card.value
                                        )}
                                    </h3>

                                </div>

                                <div
                                    style="
                                        font-size: 32px;
                                    "
                                >
                                    ${card.icon}
                                </div>

                            </div>

                        </div>

                    </div>

                </div>
            `;

        })
        .join("");

    container.innerHTML = `

        <div class="row">

            ${cardsHtml}

        </div>

    `;

}


/* =========================================================
   NUMBER FORMAT
   ========================================================= */

function formatNumber(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return "0";

    }

    if (isNaN(value)) {

        return escapeHtml(
            String(value)
        );

    }

    return Number(value).toLocaleString();

}

/* =========================================================
   REPORT EXPORT
   ========================================================= */

async function downloadReport(format) {

    const reportType =
        reportState.currentReport;

    const config =
        REPORT_CONFIG[reportType];

    if (!config || !config.exports) {

        showReportError(
            "Export is not available for this report."
        );

        return;
    }

    try {

        setLoading(true);

        hideReportError();

        const params =
            new URLSearchParams();

        /*
         * Add currently selected filters
         */
        Object.entries(
            reportState.filters || {}
        ).forEach(function ([key, value]) {

            if (
                value !== undefined &&
                value !== null &&
                value !== ""
            ) {

                params.append(
                    key,
                    value
                );
            }

        });

        const query =
            params.toString();

        /*
         * Backend route:
         *
         * /reports/{report}/export/csv
         * /reports/{report}/export/excel
         * /reports/{report}/export/pdf
         */

        const endpoint =
            `${config.endpoint}/export/${format}` +
            `${query ? `?${query}` : ""}`;

        const token =
            localStorage.getItem(
                "access_token"
            );

        const headers = {};

        if (token) {

            headers.Authorization =
                `Bearer ${token}`;

        }

        const response =
            await fetch(
                `${API_BASE_URL}${endpoint}`,
                {
                    method: "GET",
                    headers: headers
                }
            );

        /*
         * Handle unauthorized response
         */
        if (response.status === 401) {

            localStorage.removeItem(
                "access_token"
            );

            localStorage.removeItem(
                "user"
            );

            window.location.href =
                "/frontend/login.html";

            return;
        }

        /*
         * Handle failed export
         */
        if (!response.ok) {

            let errorMessage =
                `Failed to download ${format} report.`;

            try {

                const errorData =
                    await response.json();

                if (
                    typeof errorData?.detail ===
                    "string"
                ) {

                    errorMessage =
                        errorData.detail;

                } else if (
                    errorData?.message
                ) {

                    errorMessage =
                        typeof errorData.message ===
                        "string"
                            ? errorData.message
                            : JSON.stringify(
                                errorData.message
                            );

                }

            } catch (error) {

                /*
                 * Response was not JSON.
                 * Keep default message.
                 */

            }

            throw new Error(
                errorMessage
            );
        }

        /*
         * Convert response into Blob
         */
        const blob =
            await response.blob();

        /*
         * Determine filename
         */
        let fileName =
            getDownloadFileName(
                response,
                config,
                format
            );

        /*
         * Force correct Excel extension.
         *
         * Important:
         * Excel must download as .xlsx
         */
        if (
            format === "excel"
        ) {

            if (
                !fileName
                    .toLowerCase()
                    .endsWith(".xlsx")
            ) {

                fileName =
                    `${config.fileBase || reportType}.xlsx`;
            }

        }

        /*
         * Create temporary download URL
         */
        const blobUrl =
            window.URL.createObjectURL(
                blob
            );

        const link =
            document.createElement("a");

        link.href =
            blobUrl;

        link.download =
            fileName;

        document.body.appendChild(
            link
        );

        link.click();

        link.remove();

        /*
         * Cleanup object URL
         */
        window.URL.revokeObjectURL(
            blobUrl
        );

    } catch (error) {

        console.error(
            "Report export error:",
            error
        );

        showReportError(
            error.message ||
            `Failed to download ${format} report.`
        );

    } finally {

        setLoading(false);

    }

}


/* =========================================================
   GET DOWNLOAD FILE NAME
   ========================================================= */

function getDownloadFileName(
    response,
    config,
    format
) {

    /*
     * First try Content-Disposition
     */
    const disposition =
        response.headers.get(
            "Content-Disposition"
        );

    if (disposition) {

        /*
         * filename*=UTF-8''filename.xlsx
         */
        const utfMatch =
            disposition.match(
                /filename\*=UTF-8''([^;]+)/i
            );

        if (utfMatch && utfMatch[1]) {

            try {

                return decodeURIComponent(
                    utfMatch[1]
                );

            } catch (error) {

                return utfMatch[1];
            }
        }

        /*
         * filename="file.xlsx"
         */
        const normalMatch =
            disposition.match(
                /filename="?([^"]+)"?/i
            );

        if (
            normalMatch &&
            normalMatch[1]
        ) {

            return normalMatch[1];
        }
    }

    /*
     * Fallback filename
     */

    const baseName =
        config.fileBase ||
        reportState.currentReport ||
        "report";

    const extension =
        format === "excel"
            ? "xlsx"
            : format;

    return `${baseName}.${extension}`;

}


/* =========================================================
   REPORT NAVIGATION
   ========================================================= */

function openReport(reportType) {

    if (!REPORT_CONFIG[reportType]) {

        console.error(
            "Unknown report:",
            reportType
        );

        return;
    }

    window.location.href =
        `/frontend/reports/reports.html?report=${encodeURIComponent(
            reportType
        )}`;

}


/* =========================================================
   SET CURRENT REPORT
   ========================================================= */

function setCurrentReport(reportType) {

    if (!REPORT_CONFIG[reportType]) {
        return;
    }

    reportState.currentReport =
        reportType;

    reportState.page =
        1;

    reportState.filters = {};

    renderReportPage();

    loadReport();

}


/* =========================================================
   REPORT REFRESH
   ========================================================= */

async function refreshReport() {

    await loadReport();

}


/* =========================================================
   REPORT SEARCH / FILTER KEY HANDLING
   ========================================================= */

document.addEventListener(
    "keydown",
    function (event) {

        /*
         * Press Enter inside a report filter
         * to apply filters.
         */

        if (
            event.key !== "Enter"
        ) {

            return;
        }

        const target =
            event.target;

        if (!target) {
            return;
        }

        const isFilter =
            target.id &&
            (
                target.id.startsWith(
                    "reportFilter_"
                ) ||
                target.id ===
                    "reportFromDate" ||
                target.id ===
                    "reportToDate"
            );

        if (!isFilter) {
            return;
        }

        const applyButton =
            document.getElementById(
                "applyReportFilters"
            );

        if (applyButton) {

            applyButton.click();

        }

    }
);


/* =========================================================
   REPORT PAGE SIZE
   ========================================================= */

function changeReportPageSize(
    pageSize
) {

    const size =
        Number(pageSize);

    if (
        !Number.isFinite(size) ||
        size <= 0
    ) {

        return;
    }

    reportState.pageSize =
        size;

    reportState.page =
        1;

    loadReport();

}


/* =========================================================
   REPORT DATE FILTER HELPERS
   ========================================================= */

function setReportDateRange(
    fromDate,
    toDate
) {

    const fromElement =
        document.getElementById(
            "reportFromDate"
        );

    const toElement =
        document.getElementById(
            "reportToDate"
        );

    if (fromElement) {

        fromElement.value =
            fromDate || "";

    }

    if (toElement) {

        toElement.value =
            toDate || "";

    }

}


/* =========================================================
   REPORT FILTER VALUE HELPER
   ========================================================= */

function getReportFilterValue(
    key
) {

    if (
        reportState.filters &&
        Object.prototype.hasOwnProperty.call(
            reportState.filters,
            key
        )
    ) {

        return reportState.filters[key];

    }

    return null;

}


/* =========================================================
   REPORT DATA VALUE HELPER
   ========================================================= */

function getDataValue(
    object,
    keys,
    defaultValue = null
) {

    if (
        !object ||
        typeof object !== "object"
    ) {

        return defaultValue;

    }

    for (
        const key of keys
    ) {

        if (
            object[key] !== undefined &&
            object[key] !== null
        ) {

            return object[key];

        }

    }

    return defaultValue;

}


/* =========================================================
   FORMAT CURRENCY
   ========================================================= */

function formatCurrency(
    value
) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return "0.00";

    }

    const number =
        Number(value);

    if (
        Number.isNaN(number)
    ) {

        return escapeHtml(
            String(value)
        );

    }

    return number.toLocaleString(
        undefined,
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    );

}


/* =========================================================
   FORMAT INTEGER
   ========================================================= */

function formatInteger(
    value
) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return "0";

    }

    const number =
        Number(value);

    if (
        Number.isNaN(number)
    ) {

        return escapeHtml(
            String(value)
        );

    }

    return Math.round(
        number
    ).toLocaleString();

}


/* =========================================================
   FORMAT STATUS BADGE
   ========================================================= */

function formatStatusBadge(
    status
) {

    if (
        status === null ||
        status === undefined ||
        status === ""
    ) {

        return `<span class="text-muted">-</span>`;
    }

    const normalized =
        String(status)
            .toLowerCase()
            .trim();

    let badgeClass =
        "bg-secondary";

    if (
        normalized === "active" ||
        normalized === "completed" ||
        normalized === "ongoing"
    ) {

        badgeClass =
            "bg-success";

    } else if (
        normalized === "inactive" ||
        normalized === "cancelled"
    ) {

        badgeClass =
            "bg-secondary";

    } else if (
        normalized === "suspended" ||
        normalized === "overdue"
    ) {

        badgeClass =
            "bg-danger";

    } else if (
        normalized === "planned" ||
        normalized === "pending"
    ) {

        badgeClass =
            "bg-warning text-dark";
    }

    return `
        <span
            class="badge ${badgeClass}"
        >
            ${escapeHtml(
                String(status)
            )}
        </span>
    `;

}


/* =========================================================
   SAFE API ERROR MESSAGE
   ========================================================= */

function getErrorMessage(
    error,
    fallback = "Something went wrong."
) {

    if (!error) {
        return fallback;
    }

    if (
        typeof error === "string"
    ) {

        return error;
    }

    if (
        error.message
    ) {

        return error.message;
    }

    return fallback;

}


/* =========================================================
   EMPTY STATE
   ========================================================= */

function renderEmptyState(
    message = "No records found."
) {

    const container =
        document.getElementById(
            "reportContent"
        );

    if (!container) {
        return;
    }

    container.innerHTML = `

        <div
            class="card border-0 shadow-sm"
        >

            <div
                class="card-body text-center py-5"
            >

                <div
                    style="
                        font-size: 42px;
                        margin-bottom: 12px;
                    "
                >
                    📊
                </div>

                <h5>
                    No Data Found
                </h5>

                <p
                    class="text-muted mb-0"
                >
                    ${escapeHtml(message)}
                </p>

            </div>

        </div>

    `;

}


/* =========================================================
   GLOBAL REPORT FUNCTIONS
   ========================================================= */

window.openReport =
    openReport;

window.setCurrentReport =
    setCurrentReport;

window.refreshReport =
    refreshReport;

window.changeReportPage =
    changeReportPage;

window.changeReportPageSize =
    changeReportPageSize;

window.downloadReport =
    downloadReport;

window.setReportDateRange =
    setReportDateRange;


/* =========================================================
   REPORT MODULE READY
   ========================================================= */

console.log(
    "Reports module loaded successfully."
);









































// document.addEventListener("DOMContentLoaded", () => {
//     initializeReports();
// });


// /* =========================================================
//    REPORT CONFIG
// ========================================================= */

// const REPORT_CONFIG = {

//     dashboard: {
//         title: "Dashboard Summary",
//         description: "Overview of your vehicle management data."
//     },

//     vehicles: {
//         title: "Vehicle Report",
//         description: "Vehicle-wise report and details."
//     },

//     services: {
//         title: "Service Report",
//         description: "Service history and service-related data."
//     },

//     fuel: {
//         title: "Fuel Report",
//         description: "Fuel records and fuel consumption data."
//     },

//     expenses: {
//         title: "Expense Report",
//         description: "Vehicle expense and cost details."
//     },

//     drivers: {
//         title: "Driver Report",
//         description: "Driver information and operational data."
//     },

//     trips: {
//         title: "Trip Report",
//         description: "Trip history and trip-related information."
//     },

//     documents: {
//         title: "Documents Report",
//         description: "Vehicle document and expiry information."
//     },

//     "vehicle-cost": {
//         title: "Vehicle Cost Report",
//         description: "Combined vehicle cost analysis."
//     },

//     "download-history": {
//         title: "Download History",
//         description: "History of generated report downloads."
//     }
// };


// /* =========================================================
//    REPORT STATE
// ========================================================= */

// const reportState = {

//     currentReport: "dashboard",

//     vehicles: {
//         carId: "",
//         status: "",
//         page: 1,
//         pageSize: 50
//     },

//     dashboard: {
//         fromDate: "",
//         toDate: ""
//     }
// };


// /* =========================================================
//    INITIALIZE
// ========================================================= */

// function initializeReports() {

//     const params =
//         new URLSearchParams(
//             window.location.search
//         );

//     const report =
//         params.get("report") || "dashboard";

//     reportState.currentReport = report;

//     loadReport(report);
// }


// /* =========================================================
//    LOAD REPORT
// ========================================================= */

// function loadReport(reportType) {

//     const config =
//         REPORT_CONFIG[reportType] ||
//         REPORT_CONFIG.dashboard;

//     reportState.currentReport =
//         REPORT_CONFIG[reportType]
//             ? reportType
//             : "dashboard";

//     updateReportHeader(config);

//     clearReportState();

//     renderReportFilters(reportState.currentReport);

//     renderReportActions(reportState.currentReport);


//     switch (reportState.currentReport) {

//         case "dashboard":
//             loadDashboardSummary();
//             break;

//         case "vehicles":
//             loadVehicleReport();
//             break;

//         case "services":
//             renderComingSoon("Service Report");
//             break;

//         case "fuel":
//             renderComingSoon("Fuel Report");
//             break;

//         case "expenses":
//             renderComingSoon("Expense Report");
//             break;

//         case "drivers":
//             renderComingSoon("Driver Report");
//             break;

//         case "trips":
//             renderComingSoon("Trip Report");
//             break;

//         case "documents":
//             renderComingSoon("Documents Report");
//             break;

//         case "vehicle-cost":
//             renderComingSoon("Vehicle Cost Report");
//             break;

//         case "download-history":
//             renderComingSoon("Download History");
//             break;

//         default:
//             loadDashboardSummary();
//     }
// }


// /* =========================================================
//    REPORT HEADER
// ========================================================= */

// function updateReportHeader(config) {

//     const title =
//         document.getElementById("reportTitle");

//     const description =
//         document.getElementById("reportDescription");

//     if (title) {
//         title.textContent =
//             config.title;
//     }

//     if (description) {
//         description.textContent =
//             config.description;
//     }
// }


// /* =========================================================
//    FILTERS
// ========================================================= */

// function renderReportFilters(reportType) {

//     const container =
//         document.getElementById("reportFilters");

//     if (!container) {
//         return;
//     }


//     if (reportType === "dashboard") {

//         container.innerHTML = `

//             <div class="filter-group">

//                 <label for="fromDate">
//                     From Date
//                 </label>

//                 <input
//                     type="date"
//                     id="fromDate"
//                     class="form-control"
//                 >

//             </div>


//             <div class="filter-group">

//                 <label for="toDate">
//                     To Date
//                 </label>

//                 <input
//                     type="date"
//                     id="toDate"
//                     class="form-control"
//                 >

//             </div>


//             <div class="filter-actions">

//                 <button
//                     type="button"
//                     id="applyFilters"
//                     class="btn btn-primary"
//                 >
//                     Apply Filters
//                 </button>

//                 <button
//                     type="button"
//                     id="resetFilters"
//                     class="btn btn-outline-secondary"
//                 >
//                     Reset
//                 </button>

//             </div>

//         `;

//         setupDashboardFilters();

//         return;
//     }


//     if (reportType === "vehicles") {

//         container.innerHTML = `

//             <div class="filter-group">

//                 <label for="vehicleIdFilter">
//                     Vehicle ID
//                 </label>

//                 <input
//                     type="number"
//                     id="vehicleIdFilter"
//                     class="form-control"
//                     min="1"
//                     placeholder="Enter vehicle ID"
//                 >

//             </div>


//             <div class="filter-group">

//                 <label for="vehicleStatusFilter">
//                     Status
//                 </label>

//                 <select
//                     id="vehicleStatusFilter"
//                     class="form-select"
//                 >

//                     <option value="">
//                         All Status
//                     </option>

//                     <option value="active">
//                         Active
//                     </option>

//                     <option value="inactive">
//                         Inactive
//                     </option>

//                 </select>

//             </div>


//             <div class="filter-actions">

//                 <button
//                     type="button"
//                     id="applyVehicleFilters"
//                     class="btn btn-primary"
//                 >
//                     Apply Filters
//                 </button>

//                 <button
//                     type="button"
//                     id="resetVehicleFilters"
//                     class="btn btn-outline-secondary"
//                 >
//                     Reset
//                 </button>

//             </div>

//         `;

//         restoreVehicleFilters();

//         setupVehicleFilters();

//         return;
//     }


//     container.innerHTML = "";
// }


// /* =========================================================
//    DASHBOARD FILTERS
// ========================================================= */

// function setupDashboardFilters() {

//     const applyButton =
//         document.getElementById("applyFilters");

//     const resetButton =
//         document.getElementById("resetFilters");


//     if (applyButton) {

//         applyButton.addEventListener(
//             "click",
//             () => {

//                 reportState.dashboard.fromDate =
//                     document.getElementById("fromDate")?.value || "";

//                 reportState.dashboard.toDate =
//                     document.getElementById("toDate")?.value || "";

//                 loadDashboardSummary();
//             }
//         );
//     }


//     if (resetButton) {

//         resetButton.addEventListener(
//             "click",
//             () => {

//                 reportState.dashboard.fromDate = "";
//                 reportState.dashboard.toDate = "";

//                 const fromDate =
//                     document.getElementById("fromDate");

//                 const toDate =
//                     document.getElementById("toDate");

//                 if (fromDate) {
//                     fromDate.value = "";
//                 }

//                 if (toDate) {
//                     toDate.value = "";
//                 }

//                 loadDashboardSummary();
//             }
//         );
//     }


//     const fromDate =
//         document.getElementById("fromDate");

//     const toDate =
//         document.getElementById("toDate");

//     if (fromDate) {
//         fromDate.value =
//             reportState.dashboard.fromDate;
//     }

//     if (toDate) {
//         toDate.value =
//             reportState.dashboard.toDate;
//     }
// }


// /* =========================================================
//    VEHICLE FILTERS
// ========================================================= */

// function setupVehicleFilters() {

//     const applyButton =
//         document.getElementById(
//             "applyVehicleFilters"
//         );

//     const resetButton =
//         document.getElementById(
//             "resetVehicleFilters"
//         );


//     if (applyButton) {

//         applyButton.addEventListener(
//             "click",
//             () => {

//                 const carId =
//                     document.getElementById(
//                         "vehicleIdFilter"
//                     )?.value || "";

//                 const status =
//                     document.getElementById(
//                         "vehicleStatusFilter"
//                     )?.value || "";


//                 reportState.vehicles.carId =
//                     carId;

//                 reportState.vehicles.status =
//                     status;

//                 reportState.vehicles.page = 1;

//                 loadVehicleReport();
//             }
//         );
//     }


//     if (resetButton) {

//         resetButton.addEventListener(
//             "click",
//             () => {

//                 reportState.vehicles.carId = "";
//                 reportState.vehicles.status = "";
//                 reportState.vehicles.page = 1;

//                 const vehicleId =
//                     document.getElementById(
//                         "vehicleIdFilter"
//                     );

//                 const status =
//                     document.getElementById(
//                         "vehicleStatusFilter"
//                     );

//                 if (vehicleId) {
//                     vehicleId.value = "";
//                 }

//                 if (status) {
//                     status.value = "";
//                 }

//                 loadVehicleReport();
//             }
//         );
//     }
// }


// function restoreVehicleFilters() {

//     const vehicleId =
//         document.getElementById(
//             "vehicleIdFilter"
//         );

//     const status =
//         document.getElementById(
//             "vehicleStatusFilter"
//         );


//     if (vehicleId) {

//         vehicleId.value =
//             reportState.vehicles.carId;
//     }


//     if (status) {

//         status.value =
//             reportState.vehicles.status;
//     }
// }


// /* =========================================================
//    REPORT ACTIONS
// ========================================================= */

// function renderReportActions(reportType) {

//     const container =
//         document.getElementById("reportActions");

//     if (!container) {
//         return;
//     }


//     if (reportType === "vehicles") {

//         container.innerHTML = `

//             <button
//                 type="button"
//                 class="btn btn-outline-success btn-sm"
//                 id="exportVehicleCsv"
//             >
//                 CSV
//             </button>

//             <button
//                 type="button"
//                 class="btn btn-outline-primary btn-sm"
//                 id="exportVehicleExcel"
//             >
//                 Excel
//             </button>

//             <button
//                 type="button"
//                 class="btn btn-outline-danger btn-sm"
//                 id="exportVehiclePdf"
//             >
//                 PDF
//             </button>

//         `;

//         setupVehicleExportButtons();

//         return;
//     }


//     container.innerHTML = "";
// }


// /* =========================================================
//    VEHICLE REPORT
// ========================================================= */

// async function loadVehicleReport() {

//     setLoading(true);

//     try {

//         const params =
//             new URLSearchParams();


//         if (reportState.vehicles.carId) {

//             params.append(
//                 "car_id",
//                 reportState.vehicles.carId
//             );
//         }


//         if (reportState.vehicles.status) {

//             params.append(
//                 "status",
//                 reportState.vehicles.status
//             );
//         }


//         params.append(
//             "page",
//             reportState.vehicles.page
//         );


//         params.append(
//             "page_size",
//             reportState.vehicles.pageSize
//         );


//         const queryString =
//             params.toString();


//         const endpoint =
//             `/reports/vehicles?${queryString}`;


//         const data =
//             await apiRequest(endpoint);


//         renderVehicleReport(data);

//     } catch (error) {

//         showReportError(
//             error.message ||
//             "Failed to load vehicle report."
//         );

//     } finally {

//         setLoading(false);
//     }
// }


// /* =========================================================
//    VEHICLE REPORT TABLE
// ========================================================= */

// function renderVehicleReport(data) {

//     const container =
//         document.getElementById(
//             "reportContent"
//         );

//     if (!container) {
//         return;
//     }


//     const rows =
//         Array.isArray(data?.data)
//             ? data.data
//             : [];


//     const pagination =
//         data?.pagination || {
//             page: 1,
//             page_size: 50,
//             total_records: 0,
//             total_pages: 0
//         };


//     if (rows.length === 0) {

//         container.innerHTML = `

//             <div class="report-empty">

//                 <div class="report-empty-icon">
//                     🚗
//                 </div>

//                 <h3>
//                     No vehicles found
//                 </h3>

//                 <p>
//                     No vehicle records match the
//                     selected filters.
//                 </p>

//             </div>

//         `;

//         return;
//     }


//     const tableRows =
//         rows.map(
//             vehicle => renderVehicleRow(vehicle)
//         ).join("");


//     container.innerHTML = `

//         <div class="report-table-wrapper">

//             <table class="report-table">

//                 <thead>

//                     <tr>

//                         <th>ID</th>

//                         <th>Registration</th>

//                         <th>Brand</th>

//                         <th>Model</th>

//                         <th>Fuel Type</th>

//                         <th>Year</th>

//                         <th>Color</th>

//                         <th>Status</th>

//                         <th>Owner</th>

//                         <th>Owner Email</th>

//                         <th>Owner Phone</th>

//                         <th>Services</th>

//                         <th>Fuel Records</th>

//                         <th>Total Expenses</th>

//                         <th>Trips</th>

//                     </tr>

//                 </thead>


//                 <tbody>

//                     ${tableRows}

//                 </tbody>

//             </table>

//         </div>


//         ${renderVehiclePagination(pagination)}

//     `;


//     setupVehiclePagination(
//         pagination
//     );
// }


// /* =========================================================
//    VEHICLE ROW
// ========================================================= */

// function renderVehicleRow(vehicle) {

//     const status =
//         String(
//             vehicle.status || ""
//         ).toLowerCase();


//     return `

//         <tr>

//             <td>
//                 ${vehicle.id ?? "-"}
//             </td>


//             <td>
//                 <strong>
//                     ${escapeHtml(
//         vehicle.registration_number
//     )}
//                 </strong>
//             </td>


//             <td>
//                 ${escapeHtml(
//         vehicle.brand
//     )}
//             </td>


//             <td>
//                 ${escapeHtml(
//         vehicle.model
//     )}
//             </td>


//             <td>
//                 ${escapeHtml(
//         vehicle.fuel_type
//     )}
//             </td>


//             <td>
//                 ${vehicle.year ?? "-"}
//             </td>


//             <td>
//                 ${escapeHtml(
//         vehicle.color || "-"
//     )}
//             </td>


//             <td>
//                 ${renderStatusBadge(
//         vehicle.status
//     )}
//             </td>


//             <td>
//                 ${escapeHtml(
//         vehicle.owner_name || "-"
//     )}
//             </td>


//             <td>
//                 ${escapeHtml(
//         vehicle.owner_email || "-"
//     )}
//             </td>


//             <td>
//                 ${escapeHtml(
//         vehicle.owner_phone || "-"
//     )}
//             </td>


//             <td>
//                 ${vehicle.total_services ?? 0}
//             </td>


//             <td>
//                 ${vehicle.total_fuel_records ?? 0}
//             </td>


//             <td>
//                 ${formatCurrency(
//         vehicle.total_expenses ?? 0
//     )}
//             </td>


//             <td>
//                 ${vehicle.total_trips ?? 0}
//             </td>

//         </tr>

//     `;
// }


// /* =========================================================
//    STATUS BADGE
// ========================================================= */

// function renderStatusBadge(status) {

//     const value =
//         String(status || "unknown");

//     const normalized =
//         value.toLowerCase();


//     let className =
//         "report-status-default";


//     if (normalized === "active") {

//         className =
//             "report-status-active";

//     } else if (normalized === "inactive") {

//         className =
//             "report-status-inactive";
//     }


//     return `

//         <span
//             class="report-status-badge ${className}"
//         >
//             ${escapeHtml(value)}
//         </span>

//     `;
// }


// /* =========================================================
//    VEHICLE PAGINATION
// ========================================================= */

// function renderVehiclePagination(
//     pagination
// ) {

//     const page =
//         Number(
//             pagination.page || 1
//         );

//     const pageSize =
//         Number(
//             pagination.page_size || 50
//         );

//     const totalRecords =
//         Number(
//             pagination.total_records || 0
//         );

//     const totalPages =
//         Number(
//             pagination.total_pages || 0
//         );


//     const start =
//         totalRecords === 0
//             ? 0
//             : ((page - 1) * pageSize) + 1;


//     const end =
//         Math.min(
//             page * pageSize,
//             totalRecords
//         );


//     return `

//         <div class="report-pagination">

//             <div class="pagination-info">

//                 Showing
//                 <strong>${start}</strong>
//                 -
//                 <strong>${end}</strong>
//                 of
//                 <strong>${totalRecords}</strong>
//                 vehicles

//             </div>


//             <div class="pagination-buttons">

//                 <button
//                     type="button"
//                     class="btn btn-outline-secondary btn-sm"
//                     id="vehiclePrevPage"
//                     ${page <= 1 ? "disabled" : ""}
//                 >
//                     Previous
//                 </button>


//                 <span class="pagination-page active">
//                     ${page}
//                 </span>


//                 <button
//                     type="button"
//                     class="btn btn-outline-secondary btn-sm"
//                     id="vehicleNextPage"
//                     ${page >= totalPages
//             ? "disabled"
//             : ""
//         }
//                 >
//                     Next
//                 </button>

//             </div>

//         </div>

//     `;
// }


// function setupVehiclePagination(
//     pagination
// ) {

//     const previousButton =
//         document.getElementById(
//             "vehiclePrevPage"
//         );

//     const nextButton =
//         document.getElementById(
//             "vehicleNextPage"
//         );


//     if (previousButton) {

//         previousButton.addEventListener(
//             "click",
//             () => {

//                 if (
//                     reportState.vehicles.page > 1
//                 ) {

//                     reportState.vehicles.page--;

//                     loadVehicleReport();
//                 }
//             }
//         );
//     }


//     if (nextButton) {

//         nextButton.addEventListener(
//             "click",
//             () => {

//                 if (
//                     reportState.vehicles.page <
//                     Number(
//                         pagination.total_pages || 0
//                     )
//                 ) {

//                     reportState.vehicles.page++;

//                     loadVehicleReport();
//                 }
//             }
//         );
//     }
// }


// /* =========================================================
//    VEHICLE EXPORT BUTTONS
// ========================================================= */

// function setupVehicleExportButtons() {

//     const csvButton =
//         document.getElementById(
//             "exportVehicleCsv"
//         );

//     const excelButton =
//         document.getElementById(
//             "exportVehicleExcel"
//         );

//     const pdfButton =
//         document.getElementById(
//             "exportVehiclePdf"
//         );


//     if (csvButton) {

//         csvButton.addEventListener(
//             "click",
//             () => {

//                 downloadVehicleReport(
//                     "csv"
//                 );
//             }
//         );
//     }


//     if (excelButton) {

//         excelButton.addEventListener(
//             "click",
//             () => {

//                 downloadVehicleReport(
//                     "excel"
//                 );
//             }
//         );
//     }


//     if (pdfButton) {

//         pdfButton.addEventListener(
//             "click",
//             () => {

//                 downloadVehicleReport(
//                     "pdf"
//                 );
//             }
//         );
//     }
// }


// /* =========================================================
//    VEHICLE EXPORT
// ========================================================= */

// async function downloadVehicleReport(format) {

//     try {

//         setLoading(true);

//         const params = new URLSearchParams();

//         if (reportState.vehicles.carId) {
//             params.append(
//                 "car_id",
//                 reportState.vehicles.carId
//             );
//         }

//         if (reportState.vehicles.status) {
//             params.append(
//                 "status",
//                 reportState.vehicles.status
//             );
//         }

//         const queryString = params.toString();

//         const endpoint =
//             `/reports/vehicles/export/${format}${queryString
//                 ? "?" + queryString
//                 : ""
//             }`;

//         const token =
//             localStorage.getItem("access_token");

//         const headers = {};

//         if (token) {
//             headers["Authorization"] =
//                 `Bearer ${token}`;
//         }

//         const response = await fetch(
//             `${API_BASE_URL}${endpoint}`,
//             {
//                 method: "GET",
//                 headers: headers
//             }
//         );


//         /* =========================
//            AUTH ERROR
//         ========================= */

//         if (response.status === 401) {

//             localStorage.removeItem(
//                 "access_token"
//             );

//             localStorage.removeItem(
//                 "user"
//             );

//             window.location.href =
//                 "/frontend/login.html";

//             return;
//         }


//         /* =========================
//            API ERROR
//         ========================= */

//         if (!response.ok) {

//             let message =
//                 "Failed to download report.";

//             try {

//                 const errorData =
//                     await response.json();

//                 if (
//                     typeof errorData?.detail ===
//                     "string"
//                 ) {
//                     message =
//                         errorData.detail;
//                 }

//             } catch (error) {
//                 // Response is not JSON.
//             }

//             throw new Error(message);
//         }


//         /* =========================
//            FILE TYPE
//         ========================= */

//         let mimeType =
//             "application/octet-stream";

//         let extension =
//             format;


//         if (format === "csv") {

//             mimeType =
//                 "text/csv";

//             extension =
//                 "csv";
//         }


//         if (format === "excel") {

//             mimeType =
//                 "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

//             extension =
//                 "xlsx";
//         }


//         if (format === "pdf") {

//             mimeType =
//                 "application/pdf";

//             extension =
//                 "pdf";
//         }


//         /* =========================
//            GET RESPONSE BYTES
//         ========================= */

//         const arrayBuffer =
//             await response.arrayBuffer();


//         if (!arrayBuffer ||
//             arrayBuffer.byteLength === 0) {

//             throw new Error(
//                 "Downloaded Excel file is empty."
//             );
//         }


//         const blob =
//             new Blob(
//                 [arrayBuffer],
//                 {
//                     type: mimeType
//                 }
//             );


//         /* =========================
//            FILE NAME
//         ========================= */

//         let fileName =
//             `vehicles.${extension}`;


//         const contentDisposition =
//             response.headers.get(
//                 "Content-Disposition"
//             );


//         if (contentDisposition) {

//             const utf8Match =
//                 contentDisposition.match(
//                     /filename\*=UTF-8''([^;]+)/i
//                 );


//             const normalMatch =
//                 contentDisposition.match(
//                     /filename="?([^"]+)"?/i
//                 );


//             if (utf8Match && utf8Match[1]) {

//                 fileName =
//                     decodeURIComponent(
//                         utf8Match[1]
//                     );

//             } else if (
//                 normalMatch &&
//                 normalMatch[1]
//             ) {

//                 fileName =
//                     normalMatch[1];
//             }
//         }


//         /* =========================
//            FORCE XLSX EXTENSION
//         ========================= */

//         if (format === "excel") {

//             if (
//                 !fileName
//                     .toLowerCase()
//                     .endsWith(".xlsx")
//             ) {

//                 fileName =
//                     "vehicles.xlsx";
//             }
//         }


//         /* =========================
//            CREATE DOWNLOAD
//         ========================= */

//         const blobUrl =
//             window.URL.createObjectURL(
//                 blob
//             );


//         const link =
//             document.createElement("a");

//         link.href =
//             blobUrl;

//         link.download =
//             fileName;

//         link.style.display =
//             "none";


//         document.body.appendChild(
//             link
//         );


//         link.click();


//         document.body.removeChild(
//             link
//         );


//         /*
//          * Important:
//          * URL ko immediately revoke nahi karna.
//          * Kuch browsers me large XLSX blob
//          * immediately revoke karne par download
//          * fail ho sakta hai.
//          */

//         setTimeout(() => {

//             window.URL.revokeObjectURL(
//                 blobUrl
//             );

//         }, 1000);


//     } catch (error) {

//         console.error(
//             "Vehicle report download error:",
//             error
//         );

//         showReportError(
//             error.message ||
//             "Failed to download report."
//         );

//     } finally {

//         setLoading(false);
//     }
// }


// /* =========================================================
//    DASHBOARD SUMMARY
// ========================================================= */

// async function loadDashboardSummary() {

//     setLoading(true);

//     try {

//         const params =
//             new URLSearchParams();


//         if (
//             reportState.dashboard.fromDate
//         ) {

//             params.append(
//                 "from_date",
//                 reportState.dashboard.fromDate
//             );
//         }


//         if (
//             reportState.dashboard.toDate
//         ) {

//             params.append(
//                 "to_date",
//                 reportState.dashboard.toDate
//             );
//         }


//         const queryString =
//             params.toString();


//         const endpoint =
//             `/reports/dashboard-summary${queryString
//                 ? "?" + queryString
//                 : ""
//             }`;


//         const data =
//             await apiRequest(
//                 endpoint
//             );


//         renderDashboardSummary(
//             data
//         );

//     } catch (error) {

//         showReportError(
//             error.message ||
//             "Failed to load report."
//         );

//     } finally {

//         setLoading(false);
//     }
// }


// /* =========================================================
//    DASHBOARD SUMMARY UI
// ========================================================= */

// function renderDashboardSummary(
//     data
// ) {

//     const container =
//         document.getElementById(
//             "reportContent"
//         );

//     if (!container) {
//         return;
//     }


//     const summary =
//         data?.summary ||
//         data ||
//         {};


//     container.innerHTML = `

//         <div class="report-summary-grid">

//             ${summaryCard(
//         "Total Vehicles",
//         summary.total_vehicles ?? 0,
//         "🚗"
//     )}

//             ${summaryCard(
//         "Total Services",
//         summary.total_services ?? 0,
//         "🔧"
//     )}

//             ${summaryCard(
//         "Fuel Records",
//         summary.total_fuel_records ?? 0,
//         "⛽"
//     )}

//             ${summaryCard(
//         "Total Expenses",
//         summary.total_expenses ?? 0,
//         "💰"
//     )}

//             ${summaryCard(
//         "Total Drivers",
//         summary.total_drivers ?? 0,
//         "👨‍✈️"
//     )}

//             ${summaryCard(
//         "Total Trips",
//         summary.total_trips ?? 0,
//         "🛣️"
//     )}

//             ${summaryCard(
//         "Documents",
//         summary.total_documents ?? 0,
//         "📄"
//     )}

//             ${summaryCard(
//         "Total Vehicle Cost",
//         formatCurrency(
//             summary.total_vehicle_cost ?? 0
//         ),
//         "💵"
//     )}

//         </div>

//     `;
// }


// function summaryCard(
//     label,
//     value,
//     icon
// ) {

//     return `

//         <div class="summary-card">

//             <div class="summary-card-content">

//                 <div class="summary-card-label">
//                     ${label}
//                 </div>

//                 <div class="summary-card-value">
//                     ${value}
//                 </div>

//             </div>

//             <div class="summary-card-icon">
//                 ${icon}
//             </div>

//         </div>

//     `;
// }


// /* =========================================================
//    COMING SOON
// ========================================================= */

// function renderComingSoon(
//     title
// ) {

//     const container =
//         document.getElementById(
//             "reportContent"
//         );

//     if (!container) {
//         return;
//     }


//     container.innerHTML = `

//         <div class="report-coming-soon">

//             <div class="coming-soon-icon">
//                 📊
//             </div>

//             <h3>
//                 ${title}
//             </h3>

//             <p>
//                 This report UI will be implemented
//                 in the next report phase.
//             </p>

//         </div>

//     `;
// }


// /* =========================================================
//    COMMON HELPERS
// ========================================================= */

// function clearReportState() {

//     const error =
//         document.getElementById(
//             "reportError"
//         );

//     const content =
//         document.getElementById(
//             "reportContent"
//         );


//     if (error) {

//         error.style.display =
//             "none";

//         error.textContent =
//             "";
//     }


//     if (content) {

//         content.innerHTML =
//             "";
//     }
// }


// function setLoading(
//     isLoading
// ) {

//     const loading =
//         document.getElementById(
//             "reportLoading"
//         );

//     if (!loading) {
//         return;
//     }


//     loading.style.display =
//         isLoading
//             ? "flex"
//             : "none";
// }


// function showReportError(
//     message
// ) {

//     const error =
//         document.getElementById(
//             "reportError"
//         );

//     if (!error) {
//         return;
//     }


//     error.textContent =
//         message;


//     error.style.display =
//         "block";
// }


// function formatCurrency(
//     value
// ) {

//     const amount =
//         Number(value || 0);


//     return amount.toLocaleString(
//         "en-IN",
//         {
//             style: "currency",
//             currency: "INR",
//             minimumFractionDigits: 2
//         }
//     );
// }


// function escapeHtml(value) {

//     if (
//         value === null ||
//         value === undefined
//     ) {

//         return "";
//     }


//     return String(value)
//         .replaceAll("&", "&amp;")
//         .replaceAll("<", "&lt;")
//         .replaceAll(">", "&gt;")
//         .replaceAll('"', "&quot;")
//         .replaceAll("'", "&#039;");
// }