// ============================================
// DOCUMENT ANALYTICS
// ============================================

let analyticsData = null;

let expiryChart = null;

let documentTypeChart = null;


// ============================================
// PAGE INITIALIZATION
// ============================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        initializeAnalytics();

    }
);


// ============================================
// INITIALIZE ANALYTICS
// ============================================

async function initializeAnalytics() {

    try {

        showAnalyticsLoading();

        await loadDocumentAnalytics();

    } catch (error) {

        console.error(
            "Failed to load document analytics:",
            error
        );

        showAnalyticsError(
            error.message ||
            "Failed to load document analytics."
        );

    }

}


// ============================================
// LOAD ANALYTICS
// ============================================

async function loadDocumentAnalytics() {

    const data =
        await apiRequest(
            "/vehicle-documents/analytics"
        );


    analyticsData = data;


    updateSummaryCards(
        data.summary
    );


    updateDocumentTypeTable(
        data
    );


    renderExpiryChart(
        data.summary
    );


    renderDocumentTypeChart(
        data.by_document_type
    );


    showAnalyticsContent();

}


// ============================================
// UPDATE SUMMARY CARDS
// ============================================

function updateSummaryCards(summary) {

    if (!summary) {
        return;
    }


    const totalElement =
        document.getElementById(
            "totalDocuments"
        );


    const activeElement =
        document.getElementById(
            "activeDocuments"
        );


    const expiringElement =
        document.getElementById(
            "expiringDocuments"
        );


    const expiredElement =
        document.getElementById(
            "expiredDocuments"
        );


    const inactiveElement =
        document.getElementById(
            "inactiveDocuments"
        );


    const noExpiryElement =
        document.getElementById(
            "noExpiryDocuments"
        );


    if (totalElement) {

        totalElement.textContent =
            summary.total_documents ?? 0;

    }


    if (activeElement) {

        activeElement.textContent =
            summary.active_documents ?? 0;

    }


    if (expiringElement) {

        expiringElement.textContent =
            summary.expiring_soon_documents ?? 0;

    }


    if (expiredElement) {

        expiredElement.textContent =
            summary.expired_documents ?? 0;

    }


    if (inactiveElement) {

        inactiveElement.textContent =
            summary.inactive_documents ?? 0;

    }


    if (noExpiryElement) {

        noExpiryElement.textContent =
            summary.no_expiry_documents ?? 0;

    }

}


// ============================================
// EXPIRY CHART
// ============================================

function renderExpiryChart(summary) {

    const canvas =
        document.getElementById(
            "expiryChart"
        );

    if (!canvas || !summary) {
        return;
    }

    if (expiryChart) {
        expiryChart.destroy();
    }

    const values = [
        Number(summary.active_documents) || 0,
        Number(summary.expiring_soon_documents) || 0,
        Number(summary.expired_documents) || 0,
        Number(summary.inactive_documents) || 0,
        Number(summary.no_expiry_documents) || 0
    ];

    const labels = [
        "Active",
        "Expiring Soon",
        "Expired",
        "Inactive",
        "No Expiry"
    ];

    expiryChart = new Chart(
        canvas,
        {
            type: "doughnut",

            data: {
                labels: labels,

                datasets: [
                    {
                        data: values,
                        borderWidth: 2,
                        hoverOffset: 6
                    }
                ]
            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                cutout: "62%",

                plugins: {

                    legend: {
                        position: "bottom",

                        labels: {
                            padding: 18,
                            usePointStyle: true
                        }
                    },

                    tooltip: {

                        callbacks: {

                            label: function(context) {

                                const value =
                                    context.raw || 0;

                                return `${context.label}: ${value}`;
                            }

                        }

                    }

                }
            }
        }
    );
}

// ============================================
// DOCUMENT TYPE CHART
// ============================================

function renderDocumentTypeChart(
    documentTypes
) {

    const canvas =
        document.getElementById(
            "documentTypeChart"
        );

    if (!canvas) {
        return;
    }

    if (documentTypeChart) {
        documentTypeChart.destroy();
    }

    const types =
        Array.isArray(documentTypes)
            ? documentTypes
            : [];

    const labels =
        types.map(
            item =>
                item.document_type ||
                "Unknown"
        );

    const values =
        types.map(
            item =>
                Number(item.count) || 0
        );

    documentTypeChart =
        new Chart(
            canvas,
            {
                type: "bar",

                data: {

                    labels: labels,

                    datasets: [
                        {
                            label: "Documents",

                            data: values,

                            borderWidth: 1,

                            borderRadius: 6
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
                                precision: 0
                            }

                        }

                    },

                    plugins: {

                        legend: {
                            display: false
                        },

                        tooltip: {

                            callbacks: {

                                label: function(context) {

                                    return `Documents: ${context.raw}`;
                                }

                            }

                        }

                    }

                }

            }
        );
}


// ============================================
// DOCUMENT TYPE TABLE
// ============================================

function updateDocumentTypeTable(
    data
) {

    const tbody =
        document.getElementById(
            "documentTypeTableBody"
        );


    if (!tbody) {
        return;
    }


    tbody.innerHTML = "";


    const types =
        Array.isArray(
            data?.by_document_type
        )
            ? data.by_document_type
            : [];


    const total =
        Number(
            data?.summary?.total_documents
        ) || 0;


    if (types.length === 0) {

        const row =
            document.createElement("tr");


        row.innerHTML = `
            <td
                colspan="4"
                style="text-align: center;"
            >
                No document type data available.
            </td>
        `;


        tbody.appendChild(row);

        return;
    }


    types.forEach(
        (item, index) => {

            const count =
                Number(
                    item.count
                ) || 0;


            const percentage =
                total > 0
                    ? (
                        count / total
                    ) * 100
                    : 0;


            const row =
                document.createElement(
                    "tr"
                );


            row.innerHTML = `

                <td>
                    ${index + 1}
                </td>

                <td>
                    <strong>
                        ${
                            item.document_type ||
                            "Unknown"
                        }
                    </strong>
                </td>

                <td>
                    ${count}
                </td>

                <td>
                    ${percentage.toFixed(1)}%
                </td>

            `;


            tbody.appendChild(row);

        }
    );

}


// ============================================
// LOADING STATE
// ============================================

function showAnalyticsLoading() {

    const loadingElement =
        document.getElementById(
            "analyticsLoading"
        );


    const contentElement =
        document.getElementById(
            "analyticsContent"
        );


    const errorElement =
        document.getElementById(
            "analyticsError"
        );


    if (loadingElement) {

        loadingElement.style.display =
            "block";

    }


    if (contentElement) {

        contentElement.style.display =
            "none";

    }


    if (errorElement) {

        errorElement.style.display =
            "none";

    }

}


// ============================================
// SHOW CONTENT
// ============================================

function showAnalyticsContent() {

    const loadingElement =
        document.getElementById(
            "analyticsLoading"
        );


    const contentElement =
        document.getElementById(
            "analyticsContent"
        );


    const errorElement =
        document.getElementById(
            "analyticsError"
        );


    if (loadingElement) {

        loadingElement.style.display =
            "none";

    }


    if (contentElement) {

        contentElement.style.display =
            "block";

    }


    if (errorElement) {

        errorElement.style.display =
            "none";

    }

}


// ============================================
// ERROR STATE
// ============================================

function showAnalyticsError(
    message
) {

    const loadingElement =
        document.getElementById(
            "analyticsLoading"
        );


    const contentElement =
        document.getElementById(
            "analyticsContent"
        );


    const errorElement =
        document.getElementById(
            "analyticsError"
        );


    if (loadingElement) {

        loadingElement.style.display =
            "none";

    }


    if (contentElement) {

        contentElement.style.display =
            "none";

    }


    if (errorElement) {

        errorElement.style.display =
            "block";

        errorElement.textContent =
            message;

    }

}


// ============================================
// BACK TO DOCUMENTS
// ============================================

function goBackToDocuments() {

    window.location.href =
        "/frontend/documents/documents.html";

}