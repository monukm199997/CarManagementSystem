// ============================================
// CAR DOCUMENT HISTORY
// ============================================

let carId = null;
let currentCar = null;
let carDocuments = [];


// ============================================
// PAGE INITIALIZATION
// ============================================

document.addEventListener("DOMContentLoaded", () => {

    initializeHistoryPage();

});


// ============================================
// INITIALIZE PAGE
// ============================================

async function initializeHistoryPage() {

    try {

        const params =
            new URLSearchParams(
                window.location.search
            );

        carId = params.get("car_id");


        if (!carId) {

            showHistoryError(
                "Vehicle ID is missing."
            );

            return;
        }


        await loadVehicle();

        await loadCarDocuments();

    } catch (error) {

        console.error(
            "Failed to initialize document history:",
            error
        );

        showHistoryError(
            error.message ||
            "Failed to load document history."
        );
    }
}


// ============================================
// LOAD VEHICLE
// ============================================

async function loadVehicle() {

    currentCar =
        await apiRequest(
            `/cars/${carId}`
        );


    const registrationElement =
        document.getElementById(
            "vehicleRegistration"
        );


    const detailsElement =
        document.getElementById(
            "vehicleDetails"
        );


    if (registrationElement) {

        registrationElement.textContent =
            currentCar.registration_number ||
            "Unknown Vehicle";
    }


    if (detailsElement) {

        const details = [

            currentCar.brand,

            currentCar.model,

            currentCar.year
                ? String(currentCar.year)
                : null,

            currentCar.fuel_type

        ]
            .filter(Boolean)
            .join(" • ");


        detailsElement.textContent =
            details ||
            "Vehicle information unavailable";
    }
}


// ============================================
// LOAD DOCUMENTS
// ============================================

async function loadCarDocuments() {

    const loadingElement =
        document.getElementById(
            "historyLoading"
        );


    const emptyElement =
        document.getElementById(
            "historyEmpty"
        );


    const tableContainer =
        document.getElementById(
            "historyTableContainer"
        );


    try {

        if (loadingElement) {
            loadingElement.style.display =
                "block";
        }


        if (emptyElement) {
            emptyElement.style.display =
                "none";
        }


        if (tableContainer) {
            tableContainer.style.display =
                "none";
        }


        const data =
            await apiRequest(
                `/vehicle-documents/car/${carId}`
            );


        carDocuments =
            Array.isArray(data)
                ? data
                : [];


        updateHistorySummary();


        if (carDocuments.length === 0) {

            if (loadingElement) {
                loadingElement.style.display =
                    "none";
            }

            if (emptyElement) {
                emptyElement.style.display =
                    "block";
            }

            return;
        }


        renderDocumentHistory();


        if (loadingElement) {
            loadingElement.style.display =
                "none";
        }


        if (tableContainer) {
            tableContainer.style.display =
                "block";
        }

    } catch (error) {

        console.error(
            "Failed to load car documents:",
            error
        );

        showHistoryError(
            error.message ||
            "Failed to load documents."
        );
    }
}


// ============================================
// EXPIRY STATUS
// ============================================

function getExpiryStatus(
    expiryDate,
    documentStatus
) {

    if (documentStatus === "inactive") {
        return "inactive";
    }


    if (!expiryDate) {
        return "no_expiry";
    }


    const expiry =
        new Date(
            `${expiryDate}T00:00:00`
        );


    if (isNaN(expiry.getTime())) {
        return "no_expiry";
    }


    const today =
        new Date();

    today.setHours(
        0,
        0,
        0,
        0
    );


    expiry.setHours(
        0,
        0,
        0,
        0
    );


    const diffTime =
        expiry.getTime() -
        today.getTime();


    const daysRemaining =
        Math.ceil(
            diffTime /
            (1000 * 60 * 60 * 24)
        );


    if (daysRemaining < 0) {
        return "expired";
    }


    if (daysRemaining <= 30) {
        return "expiring_soon";
    }


    return "active";
}


// ============================================
// EXPIRY DAYS
// ============================================

function getExpiryDays(expiryDate) {

    if (!expiryDate) {
        return null;
    }


    const expiry =
        new Date(
            `${expiryDate}T00:00:00`
        );


    if (isNaN(expiry.getTime())) {
        return null;
    }


    const today =
        new Date();


    today.setHours(
        0,
        0,
        0,
        0
    );


    expiry.setHours(
        0,
        0,
        0,
        0
    );


    const diffTime =
        expiry.getTime() -
        today.getTime();


    return Math.ceil(
        diffTime /
        (1000 * 60 * 60 * 24)
    );
}


// ============================================
// EXPIRY BADGE
// ============================================

function getExpiryBadge(
    expiryDate,
    documentStatus
) {

    const status =
        getExpiryStatus(
            expiryDate,
            documentStatus
        );


    // Expired
    if (status === "expired") {

        const days =
            Math.abs(
                getExpiryDays(
                    expiryDate
                )
            );


        return `
            <span class="history-expiry-badge history-expired">
                🔴 Expired
                ${
                    days > 0
                        ? `(${days} days ago)`
                        : ""
                }
            </span>
        `;
    }


    // Expiring soon
    if (status === "expiring_soon") {

        const days =
            getExpiryDays(
                expiryDate
            );


        return `
            <span class="history-expiry-badge history-warning">
                🟠 Expiring in
                ${days}
                day${days === 1 ? "" : "s"}
            </span>
        `;
    }


    // Active
    if (status === "active") {

        const days =
            getExpiryDays(
                expiryDate
            );


        return `
            <span class="history-expiry-badge history-active">
                🟢 Active
                ${
                    days !== null
                        ? `(${days} days)`
                        : ""
                }
            </span>
        `;
    }


    // No expiry
    if (status === "no_expiry") {

        return `
            <span class="history-expiry-badge history-no-expiry">
                ⚪ No Expiry
            </span>
        `;
    }


    // Inactive
    if (status === "inactive") {

        return `
            <span class="history-expiry-badge history-inactive">
                ⚫ Inactive
            </span>
        `;
    }


    return `
        <span class="history-expiry-badge">
            ${status}
        </span>
    `;
}


// ============================================
// DOCUMENT STATUS BADGE
// ============================================

function getDocumentStatusBadge(status) {

    if (status === "active") {

        return `
            <span class="history-status-badge status-active">
                Active
            </span>
        `;
    }


    if (status === "inactive") {

        return `
            <span class="history-status-badge status-inactive">
                Inactive
            </span>
        `;
    }


    return `
        <span class="history-status-badge">
            ${status || "-"}
        </span>
    `;
}


// ============================================
// FORMAT DATE
// ============================================

function formatHistoryDate(dateValue) {

    if (!dateValue) {
        return "-";
    }


    const date =
        new Date(
            `${dateValue}T00:00:00`
        );


    if (isNaN(date.getTime())) {
        return "-";
    }


    return date.toLocaleDateString(
        "en-GB"
    );
}


// ============================================
// UPDATE SUMMARY
// ============================================

function updateHistorySummary() {

    let active = 0;

    let expiringSoon = 0;

    let expired = 0;


    carDocuments.forEach(document => {

        const status =
            getExpiryStatus(
                document.expiry_date,
                document.status
            );


        if (status === "active") {
            active++;
        }


        else if (
            status === "expiring_soon"
        ) {
            expiringSoon++;
        }


        else if (
            status === "expired"
        ) {
            expired++;
        }

    });


    const totalElement =
        document.getElementById(
            "historyTotal"
        );


    const activeElement =
        document.getElementById(
            "historyActive"
        );


    const expiringElement =
        document.getElementById(
            "historyExpiring"
        );


    const expiredElement =
        document.getElementById(
            "historyExpired"
        );


    if (totalElement) {
        totalElement.textContent =
            carDocuments.length;
    }


    if (activeElement) {
        activeElement.textContent =
            active;
    }


    if (expiringElement) {
        expiringElement.textContent =
            expiringSoon;
    }


    if (expiredElement) {
        expiredElement.textContent =
            expired;
    }
}


// ============================================
// RENDER DOCUMENT HISTORY
// ============================================

function renderDocumentHistory() {

    const tbody =
        document.getElementById(
            "documentHistoryBody"
        );


    if (!tbody) {
        return;
    }


    tbody.innerHTML = "";


    carDocuments.forEach(
        (doc, index) => {

            const row =
                document.createElement("tr");


            row.innerHTML = `

                <td>
                    ${index + 1}
                </td>


                <td>
                    <strong>
                        ${
                            doc.document_type ||
                            "-"
                        }
                    </strong>
                </td>


                <td>
                    ${
                        doc.document_number ||
                        "-"
                    }
                </td>


                <td>
                    ${
                        formatHistoryDate(
                            doc.issue_date
                        )
                    }
                </td>


                <td>
                    ${
                        formatHistoryDate(
                            doc.expiry_date
                        )
                    }
                </td>


                <td>
                    ${
                        getExpiryBadge(
                            doc.expiry_date,
                            doc.status
                        )
                    }
                </td>


                <td>
                    ${
                        getDocumentStatusBadge(
                            doc.status
                        )
                    }
                </td>


                <td>

                    <div class="history-actions">

                        <button
                            type="button"
                            class="history-view-btn"
                            onclick="viewDocument(
                                ${doc.id}
                            )"
                        >
                            View
                        </button>


                        <button
                            type="button"
                            class="history-edit-btn"
                            onclick="editDocument(
                                ${doc.id}
                            )"
                        >
                            Edit
                        </button>

                    </div>

                </td>

            `;


            tbody.appendChild(row);

        }
    );
}


// ============================================
// VIEW DOCUMENT
// ============================================

function viewDocument(documentId) {

    window.location.href =
        `/frontend/documents/document-details.html?id=${documentId}`;
}


// ============================================
// EDIT DOCUMENT
// ============================================

function editDocument(documentId) {

    window.location.href =
        `/frontend/documents/documents.html?edit=${documentId}`;
}


// ============================================
// BACK TO DOCUMENTS
// ============================================

function goBackToDocuments() {

    window.location.href =
        "/frontend/documents/documents.html";
}


// ============================================
// ERROR MESSAGE
// ============================================

function showHistoryError(message) {

    const loadingElement =
        document.getElementById(
            "historyLoading"
        );


    if (loadingElement) {

        loadingElement.style.display =
            "block";

        loadingElement.textContent =
            message;

        loadingElement.style.color =
            "#dc2626";
    }


    const emptyElement =
        document.getElementById(
            "historyEmpty"
        );


    if (emptyElement) {
        emptyElement.style.display =
            "none";
    }


    const tableContainer =
        document.getElementById(
            "historyTableContainer"
        );


    if (tableContainer) {
        tableContainer.style.display =
            "none";
    }
}