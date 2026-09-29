let currentDocument = null;
let currentCar = null;


document.addEventListener(
    "DOMContentLoaded",
    async () => {

        if (!requireLogin()) {
            return;
        }


        const params =
            new URLSearchParams(
                window.location.search
            );


        const documentId =
            params.get("id");


        if (!documentId) {

            showDocumentError(
                "Document ID is missing."
            );

            return;
        }


        await loadDocumentDetails(
            documentId
        );

    }
);


/* ========================================
   LOAD DOCUMENT DETAILS
======================================== */

async function loadDocumentDetails(documentId) {

    showDocumentLoading();


    try {

        // --------------------------------
        // DOCUMENT
        // --------------------------------

        currentDocument =
            await apiRequest(
                `/vehicle-documents/${documentId}`
            );


        // --------------------------------
        // VEHICLE
        // --------------------------------

        if (currentDocument?.car_id) {

            try {

                currentCar =
                    await apiRequest(
                        `/cars/${currentDocument.car_id}`
                    );

            } catch (error) {

                console.warn(
                    "Vehicle details could not be loaded:",
                    error
                );

                currentCar = null;
            }

        }


        renderDocumentDetails();


    } catch (error) {

        console.error(
            "Failed to load document details:",
            error
        );


        showDocumentError(
            error.message ||
            "Failed to load document details."
        );

    }

}


/* ========================================
   RENDER DETAILS
======================================== */

function renderDocumentDetails() {

    if (!currentDocument) {
        return;
    }


    // --------------------------------
    // DOCUMENT INFORMATION
    // --------------------------------

    setText(
        "detailDocumentType",
        currentDocument.document_type
    );


    setText(
        "detailDocumentNumber",
        currentDocument.document_number
    );


    setText(
        "detailIssueDate",
        formatDocumentDate(
            currentDocument.issue_date
        )
    );


    setText(
        "detailExpiryDate",
        formatDocumentDate(
            currentDocument.expiry_date
        )
    );


    setText(
        "detailCreatedAt",
        formatDocumentDateTime(
            currentDocument.created_at
        )
    );


    // --------------------------------
    // VEHICLE INFORMATION
    // --------------------------------

    if (currentCar) {

        setText(
            "detailRegistration",
            currentCar.registration_number
        );

        setText(
            "detailBrand",
            currentCar.brand
        );

        setText(
            "detailModel",
            currentCar.model
        );

        setText(
            "detailFuelType",
            currentCar.fuel_type
        );

        setText(
            "detailYear",
            currentCar.year
        );

        setText(
            "detailColor",
            currentCar.color
        );

    } else {

        setText(
            "detailRegistration",
            `Car #${currentDocument.car_id}`
        );

    }


    // --------------------------------
    // NOTES
    // --------------------------------

    const notesElement =
        document.getElementById(
            "detailNotes"
        );


    if (notesElement) {

        notesElement.textContent =
            currentDocument.notes ||
            "No notes added.";

    }


    // --------------------------------
    // STATUS
    // --------------------------------

    renderDocumentStatus(
        currentDocument
    );


    // --------------------------------
    // FILE
    // --------------------------------

    renderDocumentFile(
        currentDocument.file_path
    );


    // --------------------------------
    // SHOW CONTENT
    // --------------------------------

    const loading =
        document.getElementById(
            "documentLoading"
        );

    const content =
        document.getElementById(
            "documentContent"
        );


    if (loading) {
        loading.style.display = "none";
    }


    if (content) {
        content.style.display = "block";
    }

}


/* ========================================
   STATUS
======================================== */

function renderDocumentStatus(doc) {

    const container =
        document.getElementById(
            "documentStatus"
        );


    if (!container) {
        return;
    }


    let status = "Active";
    let statusClass = "active";


    if (doc.status === "inactive") {

        status = "Inactive";
        statusClass = "inactive";

    } else if (doc.expiry_date) {

        const expiry =
            new Date(doc.expiry_date);

        const today =
            new Date();

        today.setHours(
            0,
            0,
            0,
            0
        );


        if (expiry < today) {

            status = "Expired";
            statusClass = "expired";

        }

    }


    container.innerHTML = `
        <span class="document-status ${statusClass}">
            ${status}
        </span>
    `;

}


/* ========================================
   FILE PREVIEW
======================================== */

function renderDocumentFile(filePath) {

    const preview =
        document.getElementById(
            "documentPreview"
        );


    const openButton =
        document.getElementById(
            "openDocumentFile"
        );


    if (!preview) {
        return;
    }


    if (!filePath) {

        preview.innerHTML = `
            <div class="no-document-file">
                No file uploaded for this document.
            </div>
        `;


        if (openButton) {
            openButton.style.display = "none";
        }

        return;
    }


    const fileUrl =
        getDocumentFileUrl(
            filePath
        );


    if (openButton) {

        openButton.href =
            fileUrl;

        openButton.style.display =
            "inline-block";

    }


    const extension =
        getFileExtension(
            filePath
        );


    // --------------------------------
    // PDF
    // --------------------------------

    if (extension === "pdf") {

        preview.innerHTML = `
            <iframe
                src="${fileUrl}"
                title="Document PDF Preview"
            ></iframe>
        `;

        return;
    }


    // --------------------------------
    // IMAGE
    // --------------------------------

    if (
        extension === "jpg" ||
        extension === "jpeg" ||
        extension === "png" ||
        extension === "webp"
    ) {

        preview.innerHTML = `
            <img
                src="${fileUrl}"
                alt="Vehicle Document"
            >
        `;

        return;
    }


    // --------------------------------
    // OTHER FILE
    // --------------------------------

    preview.innerHTML = `
        <div class="no-document-file">

            <p>
                Preview is not available for this file type.
            </p>

            <a
                href="${fileUrl}"
                target="_blank"
                class="btn-primary"
            >
                Open Document
            </a>

        </div>
    `;

}


/* ========================================
   EDIT DOCUMENT
======================================== */

function editCurrentDocument() {

    if (!currentDocument) {
        return;
    }


    window.location.href =
        `/frontend/documents/documents.html?edit=${currentDocument.id}`;

}


/* ========================================
   FILE URL
======================================== */

function getDocumentFileUrl(filePath) {

    if (!filePath) {
        return "#";
    }


    if (
        filePath.startsWith("http://") ||
        filePath.startsWith("https://")
    ) {

        return filePath;

    }


    return `${API_BASE_URL}${filePath}`;

}


/* ========================================
   FILE EXTENSION
======================================== */

function getFileExtension(filePath) {

    return filePath
        .split("?")[0]
        .split(".")
        .pop()
        .toLowerCase();

}


/* ========================================
   DATE FORMAT
======================================== */

function formatDocumentDate(value) {

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


/* ========================================
   DATE TIME FORMAT
======================================== */

function formatDocumentDateTime(value) {

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


/* ========================================
   SET TEXT
======================================== */

function setText(
    elementId,
    value
) {

    const element =
        document.getElementById(
            elementId
        );


    if (!element) {
        return;
    }


    element.textContent =
        value ?? "-";

}


/* ========================================
   LOADING
======================================== */

function showDocumentLoading() {

    const loading =
        document.getElementById(
            "documentLoading"
        );

    const content =
        document.getElementById(
            "documentContent"
        );

    const error =
        document.getElementById(
            "documentError"
        );


    if (loading) {
        loading.style.display = "block";
    }


    if (content) {
        content.style.display = "none";
    }


    if (error) {
        error.style.display = "none";
    }

}


/* ========================================
   ERROR
======================================== */

function showDocumentError(message) {

    const loading =
        document.getElementById(
            "documentLoading"
        );

    const content =
        document.getElementById(
            "documentContent"
        );

    const error =
        document.getElementById(
            "documentError"
        );


    if (loading) {
        loading.style.display = "none";
    }


    if (content) {
        content.style.display = "none";
    }


    if (error) {

        error.textContent =
            message;

        error.style.display =
            "block";

    }

}