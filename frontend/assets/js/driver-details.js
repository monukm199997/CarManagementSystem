/* =========================================================
   DRIVER DETAILS
========================================================= */

let driverId = null;
let driverData = null;


/* =========================================================
   PAGE LOAD
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    const params = new URLSearchParams(
        window.location.search
    );

    driverId = params.get("driver_id");

    if (!driverId) {
        showDriverError("Driver ID is missing.");
        return;
    }

    loadDriverDetails();
});


/* =========================================================
   LOAD DRIVER DETAILS
========================================================= */

async function loadDriverDetails() {

    showDriverLoading();

    try {

        const driver = await apiRequest(
            `/drivers/${driverId}`
        );

        driverData = driver;

        renderDriverDetails(driver);

        await loadCurrentCarAssignment(driverId);

        hideDriverLoading();

        document.getElementById(
            "driverDetailsContent"
        ).style.display = "block";

    } catch (error) {

        console.error(
            "Failed to load driver details:",
            error
        );

        showDriverError(
            error.message || "Failed to load driver details."
        );
    }
}


/* =========================================================
   RENDER DRIVER
========================================================= */

function renderDriverDetails(driver) {

    const name =
        driver.name || "Unknown Driver";

    const initials =
        getInitials(name);

    /* -----------------------------------------
       Header
    ----------------------------------------- */

    document.getElementById(
        "driverSubtitle"
    ).textContent =
        `${driver.phone || "No phone"} • License: ${driver.license_number || "N/A"
        }`;


    /* -----------------------------------------
       Profile
    ----------------------------------------- */

    document.getElementById(
        "driverAvatar"
    ).textContent = initials;

    document.getElementById(
        "driverName"
    ).textContent = name;

    document.getElementById(
        "driverPhone"
    ).textContent =
        driver.phone || "No phone number";

    document.getElementById(
        "driverLicense"
    ).textContent =
        `License: ${driver.license_number || "N/A"}`;

    document.getElementById(
        "driverId"
    ).textContent =
        driver.id ?? "-";

    document.getElementById(
        "joiningDate"
    ).textContent =
        formatDate(driver.joining_date);


    /* -----------------------------------------
       Driver Status
    ----------------------------------------- */

    const statusElement =
        document.getElementById("driverStatus");

    statusElement.textContent =
        capitalize(driver.status || "unknown");

    statusElement.className =
        `status-badge status-${String(
            driver.status || "unknown"
        ).toLowerCase()}`;


    /* -----------------------------------------
       Summary
    ----------------------------------------- */

    document.getElementById(
        "driverEmail"
    ).textContent =
        driver.email || "No email";

    document.getElementById(
        "emergencyContact"
    ).textContent =
        driver.emergency_contact_name || "Not provided";

    document.getElementById(
        "emergencyPhone"
    ).textContent =
        driver.emergency_contact_phone || "No phone";


    /* -----------------------------------------
       Personal Information
    ----------------------------------------- */

    document.getElementById(
        "detailName"
    ).textContent =
        driver.name || "-";

    document.getElementById(
        "detailPhone"
    ).textContent =
        driver.phone || "-";

    document.getElementById(
        "detailEmail"
    ).textContent =
        driver.email || "-";

    document.getElementById(
        "detailAddress"
    ).textContent =
        driver.address || "Not provided";


    /* -----------------------------------------
       License Information
    ----------------------------------------- */

    document.getElementById(
        "detailLicenseNumber"
    ).textContent =
        driver.license_number || "-";

    document.getElementById(
        "detailLicenseIssue"
    ).textContent =
        formatDate(driver.license_issue_date);

    document.getElementById(
        "detailLicenseExpiry"
    ).textContent =
        formatDate(driver.license_expiry_date);


    const licenseStatus =
        getLicenseStatus(
            driver.license_expiry_date
        );

    const licenseStatusElement =
        document.getElementById(
            "detailLicenseStatus"
        );

    licenseStatusElement.textContent =
        licenseStatus.label;

    licenseStatusElement.className =
        `detail-value ${licenseStatus.className}`;


    /* -----------------------------------------
       License Summary
    ----------------------------------------- */

    const licenseSummary =
        document.getElementById(
            "licenseStatus"
        );

    licenseSummary.textContent =
        licenseStatus.label;

    licenseSummary.className =
        `summary-value ${licenseStatus.className}`;

    document.getElementById(
        "licenseExpiry"
    ).textContent =
        driver.license_expiry_date
            ? `Expires ${formatDate(
                driver.license_expiry_date
            )}`
            : "No expiry date";


    /* -----------------------------------------
       Emergency Contact
    ----------------------------------------- */

    document.getElementById(
        "detailEmergencyName"
    ).textContent =
        driver.emergency_contact_name ||
        "Not provided";

    document.getElementById(
        "detailEmergencyPhone"
    ).textContent =
        driver.emergency_contact_phone ||
        "Not provided";


    /* -----------------------------------------
       Notes
    ----------------------------------------- */

    document.getElementById(
        "driverNotes"
    ).textContent =
        driver.notes ||
        "No notes available.";


    /* -----------------------------------------
       System Information
    ----------------------------------------- */

    document.getElementById(
        "systemDriverId"
    ).textContent =
        driver.id ?? "-";

    document.getElementById(
        "createdAt"
    ).textContent =
        formatDateTime(driver.created_at);
}


/* =========================================================
   CURRENT CAR ASSIGNMENT
========================================================= */

async function loadCurrentCarAssignment(driverId) {

    const container =
        document.getElementById(
            "currentCarAssignment"
        );

    try {

        const assignment =
            await apiRequest(
                `/driver-vehicle-assignments/driver/${driverId}/current`
            );

        if (!assignment) {
            renderNoAssignedCar();
            return;
        }


        let car = null;

        try {

            const cars =
                await apiRequest("/cars/");

            if (Array.isArray(cars)) {

                car = cars.find(
                    item =>
                        item.id === assignment.car_id
                );

            } else if (
                cars &&
                Array.isArray(cars.items)
            ) {

                car = cars.items.find(
                    item =>
                        item.id === assignment.car_id
                );

            }

        } catch (carError) {

            console.warn(
                "Unable to load car details:",
                carError
            );
        }


        renderAssignedCar(
            assignment,
            car
        );

    } catch (error) {

        /*
         * 404 means driver currently has
         * no active car assignment.
         */

        if (
            error.message &&
            (
                error.message.includes("not currently assigned") ||
                error.message.includes("404")
            )
        ) {
            renderNoAssignedCar();
            return;
        }

        console.warn(
            "Current assignment unavailable:",
            error
        );

        renderNoAssignedCar();
    }
}


/* =========================================================
   RENDER ASSIGNED CAR
========================================================= */

function renderAssignedCar(
    assignment,
    car
) {

    const container =
        document.getElementById(
            "currentCarAssignment"
        );

    const registration =
        car?.registration_number ||
        `Car #${assignment.car_id}`;

    const brand =
        car?.brand || "";

    const model =
        car?.model || "";

    const carInfo =
        [brand, model]
            .filter(Boolean)
            .join(" ");

    container.innerHTML = `
        <div class="assigned-car-box">

            <div class="assigned-car-main">

                <div class="assigned-car-icon">
                    🚗
                </div>

                <div>

                    <div class="assigned-car-name">
                        ${escapeHtml(registration)}
                    </div>

                    <div class="assigned-car-info">
                        ${carInfo
            ? escapeHtml(carInfo)
            : "Car details unavailable"
        }
                    </div>

                </div>

            </div>

            <div class="assignment-date">

                <span class="assignment-date-label">
                    Assigned From
                </span>

                <span class="assignment-date-value">
                    ${formatDate(
            assignment.assigned_from
        )}
                </span>

            </div>

        </div>
    `;
}


/* =========================================================
   NO CAR
========================================================= */

function renderNoAssignedCar() {

    const container =
        document.getElementById(
            "currentCarAssignment"
        );

    container.innerHTML = `
        <div class="no-assigned-car">

            <div class="no-car-icon">
                🚗
            </div>

            <div>

                <strong>
                    No Car Assigned
                </strong>

                <p>
                    This driver currently has no assigned car.
                </p>

            </div>

        </div>
    `;
}


/* =========================================================
   LICENSE STATUS
========================================================= */

function getLicenseStatus(expiryDate) {

    if (!expiryDate) {

        return {
            label: "No Expiry Date",
            className: "status-inactive"
        };

    }

    const expiry =
        new Date(expiryDate);

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


    if (expiry < today) {

        return {
            label: "Expired",
            className: "status-expired"
        };

    }


    const diff =
        Math.ceil(
            (
                expiry - today
            ) /
            (
                1000 *
                60 *
                60 *
                24
            )
        );


    if (diff <= 30) {

        return {
            label: "Expiring Soon",
            className: "status-expiring"
        };

    }


    return {
        label: "Valid",
        className: "status-valid"
    };
}


/* =========================================================
   EDIT DRIVER
========================================================= */

function editDriver() {

    if (!driverId) {
        return;
    }

    /*
     * Driver edit currently lives on the
     * Drivers page inside the edit modal.
     *
     * Send the user back to Drivers page
     * and pass the driver ID.
     */

    window.location.href =
        `/frontend/drivers/drivers.html?edit_driver=${driverId}`;
}


/* =========================================================
   HISTORY
========================================================= */

function viewDriverHistory() {

    if (!driverId) {

        alert(
            "Driver ID is missing."
        );

        return;
    }

    window.location.href =
        `/frontend/drivers/driver-history.html?driver_id=${driverId}`;
}


/* =========================================================
   BACK
========================================================= */

function goBackToDrivers() {

    window.location.href =
        "/frontend/drivers/drivers.html";
}


/* =========================================================
   LOADING
========================================================= */

function showDriverLoading() {

    document.getElementById(
        "driverLoading"
    ).style.display = "flex";

    document.getElementById(
        "driverError"
    ).style.display = "none";

    document.getElementById(
        "driverDetailsContent"
    ).style.display = "none";
}


function hideDriverLoading() {

    document.getElementById(
        "driverLoading"
    ).style.display = "none";
}


/* =========================================================
   ERROR
========================================================= */

function showDriverError(message) {

    document.getElementById(
        "driverLoading"
    ).style.display = "none";

    document.getElementById(
        "driverDetailsContent"
    ).style.display = "none";

    document.getElementById(
        "driverError"
    ).style.display = "block";

    document.getElementById(
        "driverErrorMessage"
    ).textContent =
        message || "Something went wrong.";
}


/* =========================================================
   HELPERS
========================================================= */

function getInitials(name) {

    if (!name) {
        return "D";
    }

    const parts =
        name.trim().split(/\s+/);

    if (parts.length === 1) {

        return parts[0]
            .substring(0, 2)
            .toUpperCase();

    }

    return (
        parts[0][0] +
        parts[parts.length - 1][0]
    ).toUpperCase();
}


function capitalize(value) {

    if (!value) {
        return "";
    }

    return value.charAt(0).toUpperCase() +
        value.slice(1);
}


function formatDate(dateString) {

    if (!dateString) {
        return "Not provided";
    }

    const date =
        new Date(dateString);

    if (Number.isNaN(date.getTime())) {
        return dateString;
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


function formatDateTime(dateString) {

    if (!dateString) {
        return "Not available";
    }

    const date =
        new Date(dateString);

    if (Number.isNaN(date.getTime())) {
        return dateString;
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


function escapeHtml(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}