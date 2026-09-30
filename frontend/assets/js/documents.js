let allDocuments = [];
let allCars = [];

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        await initializeDocumentsPage();

        setupDocumentFilters();

        setupDocumentEvents();

        await handleEditQuery();

    }
);

async function initializeDocumentsPage() {

    try {

        await loadCars();
        await loadDocuments();

    } catch (error) {

        console.error("Documents page initialization failed:", error);

    }

}


/* =========================
   LOAD CARS
========================= */

async function loadCars() {

    try {

        const response = await apiRequest("/cars/");

        allCars = Array.isArray(response)
            ? response
            : response?.items || [];

        populateCarDropdowns();

    } catch (error) {

        console.error("Failed to load cars:", error);

    }

}


function populateCarDropdowns() {

    const filter = document.getElementById("carFilter");
    const modalCar = document.getElementById("documentCar");

    if (!filter || !modalCar) {
        return;
    }

    filter.innerHTML = `
        <option value="">All Vehicles</option>
    `;

    modalCar.innerHTML = `
        <option value="">Select Vehicle</option>
    `;


    allCars.forEach(car => {

        const label =
            `${car.registration_number || "N/A"} - ${car.brand || ""} ${car.model || ""}`;

        filter.innerHTML += `
            <option value="${car.id}">
                ${escapeHtml(label)}
            </option>
        `;

        modalCar.innerHTML += `
            <option value="${car.id}">
                ${escapeHtml(label)}
            </option>
        `;

    });

}


/* =========================
   LOAD DOCUMENTS
========================= */

async function loadDocuments() {

    const tbody =
        document.getElementById("documentsTableBody");

    tbody.innerHTML = `
        <tr>
            <td colspan="9" class="loading-cell">
                Loading documents...
            </td>
        </tr>
    `;

    try {

        const response =
            await apiRequest("/vehicle-documents/");

        allDocuments = Array.isArray(response)
            ? response
            : response?.items || [];


        populateDocumentTypeFilter();
        updateExpirySummary();
        // Initially show all
        renderDocuments(allDocuments);

    } catch (error) {

        console.error(
            "Failed to load documents:",
            error
        );

        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="empty-cell">
                    ${escapeHtml(error.message)}
                </td>
            </tr>
        `;
    }
}


/* =========================
   RENDER DOCUMENTS
========================= */

function renderDocuments(documents = allDocuments) {

    const tbody =
        document.getElementById(
            "documentsTableBody"
        );

    const documentCount =
        document.getElementById(
            "documentCount"
        );


    documentCount.textContent =
        `${documents.length} document${documents.length !== 1 ? "s" : ""}`;


    if (!documents.length) {

        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="empty-cell">
                    No documents found.
                </td>
            </tr>
        `;

        return;
    }


    tbody.innerHTML = documents
        .map((doc, index) => {

            const car =
                getCarById(doc.car_id);

            const vehicleName = car
                ? car.registration_number || "N/A"
                : `Car #${doc.car_id}`;


            const statusClass =
                getStatusClass(doc);


            return `
                <tr>

                    <td>
                        ${index + 1}
                    </td>

                    <td>
                        <strong>
                            ${escapeHtml(vehicleName)}
                        </strong>
                    </td>

                    <td>
                        ${escapeHtml(
                doc.document_type || "-"
            )}
                    </td>

                    <td>
                        ${escapeHtml(
                doc.document_number || "-"
            )}
                    </td>

                    <td>
                        ${formatDate(
                doc.issue_date
            )}
                    </td>

                    <td>
                        ${formatDate(
                doc.expiry_date
            )}
                    </td>

                    <td>
                        ${getExpiryBadge(
                doc.expiry_date,
                doc.status
            )}
                    </td>

                    <td>
                        <span class="status-badge ${statusClass}">
                            ${getDisplayStatus(doc)}
                        </span>
                    </td>

                    <td>

                                ${doc.file_path
                    ? `
                                            <a
                                                href="${getFileUrl(doc.file_path)}"
                                                target="_blank"
                                                class="file-link"
                                            >
                                                View File
                                            </a>
                                        `
                    : `
                                            <span class="no-file">
                                                No File
                                            </span>
                                        `
                }

                    </td>

                    <td>

                        <div class="action-buttons">

                            <button
                                class="btn-small btn-view"
                                onclick="viewDocument(${doc.id})"
                            >
                                View
                            </button>

                            <button
                                type="button"
                                class="btn-history"
                                onclick="viewCarDocumentHistory(${doc.car_id})"
                            >
                                History
                            </button>

                            <button
                                class="btn-small btn-edit"
                                onclick="editDocument(${doc.id})"
                            >
                                Edit
                            </button>

                            <button
                                class="btn-small btn-upload"
                                onclick="uploadDocument(${doc.id})"
                            >
                                Upload
                            </button>

                            <button
                                class="btn-small btn-delete"
                                onclick="deleteDocument(${doc.id})"
                            >
                                Delete
                            </button>

                        </div>

                    </td>

                </tr>
            `;

        })
        .join("");
}

function applyDocumentFilters() {

    const carId =
        document.getElementById(
            "carFilter"
        )?.value || "";


    const documentType =
        document.getElementById(
            "documentTypeFilter"
        )?.value || "";


    const expiryStatus =
        document.getElementById(
            "expiryStatusFilter"
        )?.value || "";


    const search =
        (
            document.getElementById(
                "documentSearch"
            )?.value || ""
        )
            .trim()
            .toLowerCase();


    const filteredDocuments =
        allDocuments.filter(doc => {

            const carMatch =
                !carId ||
                String(doc.car_id) ===
                String(carId);

            const typeMatch =
                !documentType ||
                String(doc.document_type || "")
                    .toLowerCase() ===
                String(documentType)
                    .toLowerCase();

            const documentExpiryStatus =
                getExpiryStatus(
                    doc.expiry_date,
                    doc.status
                );


            const expiryMatch =
                !expiryStatus ||
                documentExpiryStatus ===
                expiryStatus;

            const car =
                getCarById(doc.car_id);


            const searchableText = `
                ${doc.document_type || ""}
                ${doc.document_number || ""}
                ${doc.notes || ""}
                ${car?.registration_number || ""}
                ${car?.brand || ""}
                ${car?.model || ""}
            `
                .toLowerCase();


            const searchMatch =
                !search ||
                searchableText.includes(search);

            return (
                carMatch &&
                typeMatch &&
                expiryMatch &&
                searchMatch
            );

        });


    renderDocuments(
        filteredDocuments
    );
}

/* =========================
   ADD DOCUMENT
========================= */

function openDocumentModal() {

    document.getElementById("documentModal")
        .style.display = "flex";

    document.getElementById("modalTitle")
        .textContent = "Add Vehicle Document";

    document.getElementById("documentForm")
        .reset();

    document.getElementById("documentId")
        .value = "";

    clearDocumentMessage();

}


/* =========================
   CLOSE MODAL
========================= */

function closeDocumentModal() {

    document.getElementById("documentModal")
        .style.display = "none";

}


/* =========================
   SAVE DOCUMENT
========================= */

document.getElementById("documentForm")
    .addEventListener("submit", async function (event) {

        event.preventDefault();

        const documentId =
            document.getElementById("documentId").value;


        const payload = {

            car_id: Number(
                document.getElementById("documentCar").value
            ),

            document_type:
                document.getElementById("documentType").value,

            document_number:
                document.getElementById("documentNumber").value
                    .trim() || null,

            issue_date:
                document.getElementById("issueDate").value
                || null,

            expiry_date:
                document.getElementById("expiryDate").value
                || null,

            notes:
                document.getElementById("documentNotes").value
                    .trim() || null

        };


        try {

            if (!payload.car_id) {
                throw new Error("Please select a vehicle.");
            }

            if (!payload.document_type) {
                throw new Error("Please select document type.");
            }


            if (documentId) {

                await apiRequest(
                    `/vehicle-documents/${documentId}`,
                    {
                        method: "PUT",
                        body: JSON.stringify({
                            document_type: payload.document_type,
                            document_number: payload.document_number,
                            issue_date: payload.issue_date,
                            expiry_date: payload.expiry_date,
                            notes: payload.notes
                        })
                    }
                );

            } else {

                await apiRequest(
                    "/vehicle-documents/",
                    {
                        method: "POST",
                        body: JSON.stringify(payload)
                    }
                );

            }


            closeDocumentModal();

            await loadDocuments();

        } catch (error) {

            showDocumentMessage(
                error.message,
                "error"
            );

        }

    });


/* =========================
   EDIT DOCUMENT
========================= */

function editDocument(documentId) {

    const doc =
        allDocuments.find(item =>
            item.id === documentId
        );

    if (!doc) {
        return;
    }

    document.getElementById("documentId").value = doc.id;
    document.getElementById("documentCar").value = doc.car_id;
    document.getElementById("documentType").value = doc.document_type || "";
    document.getElementById("documentNumber").value = doc.document_number || "";
    document.getElementById("issueDate").value = doc.issue_date || "";
    document.getElementById("expiryDate").value = doc.expiry_date || "";
    document.getElementById("documentNotes").value = doc.notes || "";

    document.getElementById("modalTitle").textContent =
        "Edit Vehicle Document";

    document.getElementById("documentModal").style.display = "flex";
}

/* =========================
   UPLOAD DOCUMENT
========================= */

async function uploadDocument(documentId) {

    const input = document.createElement("input");

    input.type = "file";

    input.accept =
        ".pdf,.jpg,.jpeg,.png,.webp";


    input.onchange = async () => {

        const file = input.files[0];

        if (!file) {
            return;
        }


        const formData = new FormData();

        formData.append("file", file);


        try {

            const token =
                localStorage.getItem("access_token");

            const response = await fetch(
                `${API_BASE_URL}/vehicle-documents/${documentId}/upload`,
                {
                    method: "POST",

                    headers: {
                        Authorization: `Bearer ${token}`
                    },

                    body: formData
                }
            );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data?.detail ||
                    "File upload failed."
                );

            }


            await loadDocuments();

            alert("Document uploaded successfully.");

        } catch (error) {

            alert(error.message);

        }

    };


    input.click();

}


/* =========================
   DELETE DOCUMENT
========================= */

async function deleteDocument(documentId) {

    const confirmed =
        confirm(
            "Are you sure you want to delete this document?"
        );

    if (!confirmed) {
        return;
    }


    try {

        await apiRequest(
            `/vehicle-documents/${documentId}`,
            {
                method: "DELETE"
            }
        );

        await loadDocuments();

    } catch (error) {

        alert(error.message);

    }

}


/* =========================
   HELPERS
========================= */

function getCarById(carId) {

    return allCars.find(car =>
        Number(car.id) === Number(carId)
    );

}


function formatDate(value) {

    if (!value) {
        return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString("en-IN");

}


function getStatusClass(document) {

    if (document.status === "inactive") {
        return "status-inactive";
    }

    if (!document.expiry_date) {
        return "status-active";
    }


    const expiry =
        new Date(document.expiry_date);

    const today = new Date();

    today.setHours(0, 0, 0, 0);


    if (expiry < today) {
        return "status-expired";
    }


    return "status-active";

}


function getDisplayStatus(document) {

    if (document.status === "inactive") {
        return "Inactive";
    }


    if (document.expiry_date) {

        const expiry =
            new Date(document.expiry_date);

        const today = new Date();

        today.setHours(0, 0, 0, 0);


        if (expiry < today) {
            return "Expired";
        }

    }


    return "Active";

}


function getFileUrl(filePath) {

    if (!filePath) {
        return "#";
    }

    if (filePath.startsWith("http")) {
        return filePath;
    }

    return `${API_BASE_URL}${filePath}`;

}


function showDocumentMessage(message, type) {

    const element =
        document.getElementById("documentMessage");

    element.textContent = message;

    element.className =
        `form-message ${type}`;

}


function clearDocumentMessage() {

    const element =
        document.getElementById("documentMessage");

    element.textContent = "";

    element.className =
        "form-message";

}


function escapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}

function setupDocumentEvents() {

    const addDocumentButton =
        document.getElementById("addDocumentButton");

    if (addDocumentButton) {

        addDocumentButton.addEventListener(
            "click",
            openDocumentModal
        );

    }

}


function setupDocumentFilters() {

    // -------------------------
    // CAR FILTER
    // -------------------------

    const carFilter =
        document.getElementById(
            "carFilter"
        );

    if (carFilter) {

        carFilter.addEventListener(
            "change",
            applyDocumentFilters
        );

    }


    // -------------------------
    // DOCUMENT TYPE FILTER
    // -------------------------

    const typeFilter =
        document.getElementById(
            "documentTypeFilter"
        );

    if (typeFilter) {

        typeFilter.addEventListener(
            "change",
            applyDocumentFilters
        );

    }


    // -------------------------
    // SEARCH INPUT
    // -------------------------

    const searchInput =
        document.getElementById(
            "documentSearch"
        );

    if (searchInput) {

        searchInput.addEventListener(
            "input",
            applyDocumentFilters
        );

    }


    // -------------------------
    // SEARCH BUTTON
    // -------------------------

    const searchButton =
        document.getElementById(
            "documentSearchButton"
        );

    if (searchButton) {

        searchButton.addEventListener(
            "click",
            applyDocumentFilters
        );

    }

    const expiryStatusFilter =
        document.getElementById("expiryStatusFilter");

    if (expiryStatusFilter) {
        expiryStatusFilter.addEventListener(
            "change",
            applyDocumentFilters
        );
    }

}

function viewDocument(documentId) {

    window.location.href =
        `/frontend/documents/document-details.html?id=${documentId}`;

}


async function handleEditQuery() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    const editId =
        params.get("edit");


    if (!editId) {
        return;
    }


    const documentId =
        Number(editId);


    const doc =
        allDocuments.find(
            item =>
                Number(item.id) === documentId
        );


    if (!doc) {
        return;
    }


    editDocument(documentId);

}


function getExpiryStatus(expiryDate, documentStatus) {

    if (documentStatus === "inactive") {
        return "inactive";
    }

    if (!expiryDate) {
        return "no_expiry";
    }

    // Handle YYYY-MM-DD safely
    const expiry = new Date(`${expiryDate}T00:00:00`);

    if (isNaN(expiry.getTime())) {
        return "no_expiry";
    }

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    expiry.setHours(0, 0, 0, 0);

    const diffTime = expiry.getTime() - today.getTime();

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

function getExpiryDays(expiryDate) {

    if (!expiryDate) {
        return null;
    }

    const expiry =
        new Date(`${expiryDate}T00:00:00`);

    if (isNaN(expiry.getTime())) {
        return null;
    }

    const today = new Date();

    today.setHours(0, 0, 0, 0);
    expiry.setHours(0, 0, 0, 0);

    const diffTime =
        expiry.getTime() -
        today.getTime();

    return Math.ceil(
        diffTime /
        (1000 * 60 * 60 * 24)
    );
}

function getExpiryBadge(expiryDate, documentStatus) {

    const expiryStatus =
        getExpiryStatus(
            expiryDate,
            documentStatus
        );


    // -----------------------------
    // Expired
    // -----------------------------

    if (expiryStatus === "expired") {

        const days =
            Math.abs(
                getExpiryDays(expiryDate)
            );

        return `
            <span class="expiry-badge expiry-expired">
                🔴 Expired
                ${days > 0
                ? `(${days} days ago)`
                : ""
            }
            </span>
        `;
    }


    // -----------------------------
    // Expiring Soon
    // -----------------------------

    if (expiryStatus === "expiring_soon") {

        const days =
            getExpiryDays(expiryDate);

        return `
            <span class="expiry-badge expiry-warning">
                🟠 Expiring in
                ${days} day${days === 1 ? "" : "s"}
            </span>
        `;
    }


    // -----------------------------
    // Active
    // -----------------------------

    if (expiryStatus === "active") {

        const days =
            getExpiryDays(expiryDate);

        return `
            <span class="expiry-badge expiry-active">
                🟢 Active
                ${days !== null
                ? `(${days} days)`
                : ""
            }
            </span>
        `;
    }


    // -----------------------------
    // No Expiry
    // -----------------------------

    if (expiryStatus === "no_expiry") {

        return `
            <span class="expiry-badge expiry-no-expiry">
                ⚪ No Expiry
            </span>
        `;
    }


    return `
        <span class="expiry-badge">
            ${expiryStatus}
        </span>
    `;
}


function updateExpirySummary() {

    const total = allDocuments.length;

    let active = 0;
    let expiringSoon = 0;
    let expired = 0;
    let noExpiry = 0;

    allDocuments.forEach(document => {

        const status = getExpiryStatus(
            document.expiry_date,
            document.status
        );

        if (status === "active") {
            active++;
        }
        else if (status === "expiring_soon") {
            expiringSoon++;
        }
        else if (status === "expired") {
            expired++;
        }
        else if (status === "no_expiry") {
            noExpiry++;
        }
    });

    const totalElement =
        document.getElementById("totalDocumentsCount");

    const activeElement =
        document.getElementById("activeDocumentsCount");

    const expiringElement =
        document.getElementById("expiringDocumentsCount");

    const expiredElement =
        document.getElementById("expiredDocumentsCount");

    const noExpiryElement =
        document.getElementById("noExpiryDocumentsCount");

    if (totalElement) {
        totalElement.textContent = total;
    }

    if (activeElement) {
        activeElement.textContent = active;
    }

    if (expiringElement) {
        expiringElement.textContent = expiringSoon;
    }

    if (expiredElement) {
        expiredElement.textContent = expired;
    }

    if (noExpiryElement) {
        noExpiryElement.textContent = noExpiry;
    }
}


function populateDocumentTypeFilter() {

    const select =
        document.getElementById(
            "documentTypeFilter"
        );

    if (!select) {
        return;
    }

    // Existing selected value preserve karo
    const currentValue = select.value;

    // Unique document types
    const documentTypes = [
        ...new Set(
            allDocuments
                .map(doc =>
                    String(
                        doc.document_type || ""
                    ).trim()
                )
                .filter(Boolean)
        )
    ].sort();


    // Reset dropdown
    select.innerHTML = `
        <option value="">
            All Types
        </option>
    `;


    // Add document types
    documentTypes.forEach(type => {

        const option =
            document.createElement("option");

        option.value = type;
        option.textContent = type;

        select.appendChild(option);
    });


    // Restore selected value if still available
    if (
        documentTypes.includes(currentValue)
    ) {
        select.value = currentValue;
    }
}


function viewCarDocumentHistory(carId) {

    if (!carId) {
        alert("Vehicle ID is missing.");
        return;
    }

    window.location.href =
        `/frontend/documents/car-document-history.html?car_id=${carId}`;
}


function openDocumentAnalytics() {

    window.location.href =
        "/frontend/documents/document-analytics.html";
}