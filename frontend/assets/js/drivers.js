let allDrivers = [];
let editingDriverId = null;


// =====================================================
// INITIAL LOAD
// =====================================================

document.addEventListener("DOMContentLoaded", () => {

    loadDrivers();

    const searchInput =
        document.getElementById("driverSearch");

    const statusSelect =
        document.getElementById("driverStatus");


    searchInput?.addEventListener(
        "input",
        applyDriverFilters
    );

    statusSelect?.addEventListener(
        "change",
        applyDriverFilters
    );


    const form =
        document.getElementById("driverForm");

    form?.addEventListener(
        "submit",
        handleDriverSubmit
    );

});


// =====================================================
// LOAD DRIVERS
// =====================================================

async function loadDrivers() {

    try {

        const data = await apiRequest(
            "/drivers/"
        );

        allDrivers = Array.isArray(data)
            ? data
            : [];

        updateDriverSummary();

        applyDriverFilters();

    } catch (error) {

        console.error(
            "Failed to load drivers:",
            error
        );

        showDriverError(
            error.message
        );

    }
}


// =====================================================
// SUMMARY
// =====================================================

function updateDriverSummary() {

    const total =
        allDrivers.length;

    const active =
        allDrivers.filter(
            driver => driver.status === "active"
        ).length;

    const inactive =
        allDrivers.filter(
            driver => driver.status === "inactive"
        ).length;

    const expiring =
        allDrivers.filter(
            driver => isLicenseExpiring(driver)
        ).length;


    document.getElementById(
        "totalDrivers"
    ).textContent = total;


    document.getElementById(
        "activeDrivers"
    ).textContent = active;


    document.getElementById(
        "inactiveDrivers"
    ).textContent = inactive;


    document.getElementById(
        "expiringLicenses"
    ).textContent = expiring;
}


// =====================================================
// FILTER
// =====================================================

function applyDriverFilters() {

    const search =
        (
            document.getElementById(
                "driverSearch"
            )?.value || ""
        )
            .trim()
            .toLowerCase();


    const status =
        document.getElementById(
            "driverStatus"
        )?.value || "";


    const filteredDrivers =
        allDrivers.filter(driver => {

            const searchableText = `
                ${driver.name || ""}
                ${driver.phone || ""}
                ${driver.license_number || ""}
                ${driver.email || ""}
            `.toLowerCase();


            const searchMatch =
                !search ||
                searchableText.includes(search);


            const statusMatch =
                !status ||
                driver.status === status;


            return searchMatch && statusMatch;

        });


    renderDrivers(filteredDrivers);
}


// =====================================================
// RENDER
// =====================================================

function renderDrivers(drivers) {

    const tbody =
        document.getElementById(
            "driversTableBody"
        );


    const count =
        document.getElementById(
            "driverCount"
        );


    count.textContent =
        `${drivers.length} driver${drivers.length === 1 ? "" : "s"}`;


    if (!drivers.length) {

        tbody.innerHTML = `
            <tr>
                <td
                    colspan="7"
                    class="empty-cell"
                >
                    No drivers found.
                </td>
            </tr>
        `;

        return;
    }


    tbody.innerHTML =
        drivers.map(
            (driver, index) => {

                const expiryStatus =
                    getLicenseExpiryStatus(
                        driver.license_expiry_date
                    );


                return `
                    <tr>

                        <td>
                            ${index + 1}
                        </td>

                        <td>
                            <div class="driver-name">
                                ${escapeHtml(driver.name)}
                            </div>

                            ${driver.email
                        ? `<div class="driver-email">
                                        ${escapeHtml(driver.email)}
                                       </div>`
                        : ""
                    }
                        </td>

                        <td>
                            ${escapeHtml(driver.phone)}
                        </td>

                        <td>
                            ${escapeHtml(driver.license_number)}
                        </td>
                        <td>
                            ${driver.assigned_car
                        ? `
                                        <div class="assigned-car-name">
                                            ${escapeHtml(
                            driver.assigned_car.registration_number
                        )}
                                        </div>

                                        <div class="assigned-car-info">
                                            ${escapeHtml(
                            driver.assigned_car.brand || ""
                        )}
                                            ${escapeHtml(
                            driver.assigned_car.model || ""
                        )}
                                        </div>
                                    `
                        : `
                                        <span class="no-car-assigned">
                                            No Car Assigned
                                        </span>
                                    `
                    }
                        </td>

                        <td>
                            ${formatDate(
                        driver.license_expiry_date
                    )}

                            ${expiryStatus
                        ? `<span class="license-badge ${expiryStatus.className}">
                                        ${expiryStatus.label}
                                       </span>`
                        : ""
                    }
                        </td>

                        <td>
                            <span class="status-badge ${driver.status}">
                                ${capitalize(driver.status)}
                            </span>
                        </td>

                        <td>

                            <div class="action-buttons">

                                <button
                                    class="action-btn view"
                                    onclick="viewDriver(${driver.id})"
                                >
                                    View
                                </button>
                                <button
                                    class="action-btn history"
                                    onclick="viewDriverHistory(${driver.id})"
                                >
                                    History
                                </button>

                                <button
                                    class="action-btn edit"
                                    onclick="editDriver(${driver.id})"
                                >
                                    Edit
                                </button>

                                <button
                                    class="action-btn car"
                                    onclick="openCarAssignmentModal(${driver.id})"
                                >
                                    Car
                                </button>

                                ${driver.status === "active"

                        ? `
                                            <button
                                                class="action-btn danger"
                                                onclick="deactivateDriver(${driver.id})"
                                            >
                                                Deactivate
                                            </button>
                                          `

                        : `
                                            <button
                                                class="action-btn success"
                                                onclick="activateDriver(${driver.id})"
                                            >
                                                Activate
                                            </button>
                                          `
                    }

                            </div>

                        </td>

                    </tr>
                `;

            }
        ).join("");
}


// =====================================================
// ADD DRIVER
// =====================================================

function openAddDriverModal() {

    editingDriverId = null;

    document.getElementById(
        "driverModalTitle"
    ).textContent = "Add Driver";


    document.getElementById(
        "driverForm"
    ).reset();


    document.getElementById(
        "driverId"
    ).value = "";


    clearDriverError();


    document.getElementById(
        "driverModal"
    ).classList.add("show");
}


// =====================================================
// EDIT DRIVER
// =====================================================

function editDriver(driverId) {

    const driver =
        allDrivers.find(
            item => item.id === driverId
        );


    if (!driver) {

        alert("Driver not found.");

        return;
    }


    editingDriverId = driverId;


    document.getElementById(
        "driverModalTitle"
    ).textContent = "Edit Driver";


    document.getElementById(
        "driverId"
    ).value = driver.id;


    document.getElementById(
        "driverName"
    ).value = driver.name || "";


    document.getElementById(
        "driverEmail"
    ).value = driver.email || "";


    document.getElementById(
        "driverPhone"
    ).value = driver.phone || "";


    document.getElementById(
        "driverLicense"
    ).value =
        driver.license_number || "";


    document.getElementById(
        "driverLicenseIssue"
    ).value =
        driver.license_issue_date || "";


    document.getElementById(
        "driverLicenseExpiry"
    ).value =
        driver.license_expiry_date || "";


    document.getElementById(
        "driverJoiningDate"
    ).value =
        driver.joining_date || "";


    document.getElementById(
        "driverEmergencyName"
    ).value =
        driver.emergency_contact_name || "";


    document.getElementById(
        "driverEmergencyPhone"
    ).value =
        driver.emergency_contact_phone || "";


    document.getElementById(
        "driverAddress"
    ).value =
        driver.address || "";


    document.getElementById(
        "driverNotes"
    ).value =
        driver.notes || "";


    clearDriverError();


    document.getElementById(
        "driverModal"
    ).classList.add("show");
}


// =====================================================
// SUBMIT
// =====================================================

async function handleDriverSubmit(event) {

    event.preventDefault();

    clearDriverError();


    const payload = {

        name:
            document.getElementById(
                "driverName"
            ).value.trim(),

        email:
            document.getElementById(
                "driverEmail"
            ).value.trim() || null,

        phone:
            document.getElementById(
                "driverPhone"
            ).value.trim(),

        license_number:
            document.getElementById(
                "driverLicense"
            ).value.trim(),

        license_issue_date:
            document.getElementById(
                "driverLicenseIssue"
            ).value || null,

        license_expiry_date:
            document.getElementById(
                "driverLicenseExpiry"
            ).value || null,

        joining_date:
            document.getElementById(
                "driverJoiningDate"
            ).value || null,

        emergency_contact_name:
            document.getElementById(
                "driverEmergencyName"
            ).value.trim() || null,

        emergency_contact_phone:
            document.getElementById(
                "driverEmergencyPhone"
            ).value.trim() || null,

        address:
            document.getElementById(
                "driverAddress"
            ).value.trim() || null,

        notes:
            document.getElementById(
                "driverNotes"
            ).value.trim() || null
    };


    try {

        if (editingDriverId) {

            await apiRequest(
                `/drivers/${editingDriverId}`,
                {
                    method: "PUT",
                    body: JSON.stringify(payload)
                }
            );

            alert(
                "Driver updated successfully."
            );

        } else {

            await apiRequest(
                "/drivers/",
                {
                    method: "POST",
                    body: JSON.stringify(payload)
                }
            );

            alert(
                "Driver created successfully."
            );
        }


        closeDriverModal();

        await loadDrivers();

    } catch (error) {

        showDriverError(
            error.message
        );
    }
}


// =====================================================
// DEACTIVATE
// =====================================================

async function deactivateDriver(driverId) {

    const confirmed =
        confirm(
            "Are you sure you want to deactivate this driver?"
        );


    if (!confirmed) return;


    try {

        await apiRequest(
            `/drivers/${driverId}`,
            {
                method: "DELETE"
            }
        );


        alert(
            "Driver deactivated successfully."
        );


        await loadDrivers();

    } catch (error) {

        alert(
            error.message
        );
    }
}


// =====================================================
// ACTIVATE
// =====================================================

async function activateDriver(driverId) {

    try {

        await apiRequest(
            `/drivers/${driverId}/activate`,
            {
                method: "PATCH"
            }
        );


        alert(
            "Driver activated successfully."
        );


        await loadDrivers();

    } catch (error) {

        alert(
            error.message
        );
    }
}


// =====================================================
// VIEW
// =====================================================

function viewDriver(driverId) {
    if (!driverId) {
        alert("Driver ID is missing.");
        return;
    }

    window.location.href =
        `/frontend/drivers/driver-details.html?driver_id=${driverId}`;
}

// =====================================================
// CLOSE MODAL
// =====================================================

function closeDriverModal() {

    document.getElementById(
        "driverModal"
    ).classList.remove("show");

    editingDriverId = null;
}


// =====================================================
// RESET FILTER
// =====================================================

function resetDriverFilters() {

    document.getElementById(
        "driverSearch"
    ).value = "";


    document.getElementById(
        "driverStatus"
    ).value = "";


    applyDriverFilters();
}


// =====================================================
// LICENSE EXPIRY
// =====================================================

function isLicenseExpiring(driver) {

    if (
        !driver.license_expiry_date ||
        driver.status !== "active"
    ) {
        return false;
    }


    const expiry =
        new Date(
            `${driver.license_expiry_date}T00:00:00`
        );


    const today =
        new Date();

    today.setHours(0, 0, 0, 0);


    const diff =
        Math.ceil(
            (
                expiry.getTime()
                - today.getTime()
            )
            /
            (1000 * 60 * 60 * 24)
        );


    return diff >= 0 && diff <= 30;
}


function getLicenseExpiryStatus(expiryDate) {

    if (!expiryDate) return null;


    const expiry =
        new Date(
            `${expiryDate}T00:00:00`
        );


    const today =
        new Date();

    today.setHours(0, 0, 0, 0);


    const diff =
        Math.ceil(
            (
                expiry.getTime()
                - today.getTime()
            )
            /
            (1000 * 60 * 60 * 24)
        );


    if (diff < 0) {

        return {
            label: "Expired",
            className: "expired"
        };

    }


    if (diff <= 30) {

        return {
            label: `${diff} days`,
            className: "expiring"
        };

    }


    return {
        label: "Valid",
        className: "valid"
    };
}


// =====================================================
// HELPERS
// =====================================================

function formatDate(dateString) {

    if (!dateString) {
        return "-";
    }


    const date =
        new Date(
            `${dateString}T00:00:00`
        );


    if (isNaN(date.getTime())) {
        return "-";
    }


    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }
    );
}


function capitalize(value) {

    if (!value) return "";

    return value.charAt(0).toUpperCase()
        + value.slice(1);
}


function escapeHtml(value) {

    const div =
        document.createElement("div");

    div.textContent =
        value ?? "";

    return div.innerHTML;
}


function showDriverError(message) {

    const element =
        document.getElementById(
            "driverFormError"
        );

    if (element) {
        element.textContent =
            message || "Something went wrong.";
    }
}


function clearDriverError() {

    const element =
        document.getElementById(
            "driverFormError"
        );

    if (element) {
        element.textContent = "";
    }
}


// Close modal when clicking outside

document.getElementById(
    "driverModal"
)?.addEventListener(
    "click",
    function (event) {

        if (event.target === this) {
            closeDriverModal();
        }

    }
);


// =====================================================
// CAR ASSIGNMENT
// =====================================================

async function openCarAssignmentModal(driverId) {

    const driver = allDrivers.find(
        item => item.id === driverId
    );

    if (!driver) {
        alert("Driver not found.");
        return;
    }


    document.getElementById(
        "assignmentDriverId"
    ).value = driverId;


    document.getElementById(
        "assignmentDriverName"
    ).textContent =
        `Driver: ${driver.name}`;


    document.getElementById(
        "assignmentFrom"
    ).value =
        new Date().toISOString().split("T")[0];


    document.getElementById(
        "assignmentTo"
    ).value = "";


    document.getElementById(
        "assignmentNotes"
    ).value = "";


    clearAssignmentError();


    try {

        await loadCarsForAssignment();

        await loadCurrentCarAssignment(
            driverId
        );


        // -----------------------------------------
        // Driver status check
        // -----------------------------------------

        if (driver.status !== "active") {

            disableAssignmentForm();


            const container =
                document.getElementById(
                    "currentCarAssignment"
                );


            container.innerHTML += `
                <div class="assignment-status-warning">
                    <strong>
                        Driver is ${capitalize(driver.status)}.
                    </strong>

                    <span>
                        A car cannot be assigned to this driver
                        while the driver is not active.
                    </span>
                </div>
            `;
        }


        document.getElementById(
            "carAssignmentModal"
        ).classList.add("show");


    } catch (error) {

        showAssignmentError(
            error.message
        );
    }
}

function disableAssignmentForm() {

    document.getElementById(
        "assignmentCarId"
    ).disabled = true;


    document.getElementById(
        "assignmentFrom"
    ).disabled = true;


    document.getElementById(
        "assignmentTo"
    ).disabled = true;


    document.getElementById(
        "assignmentNotes"
    ).disabled = true;


    const submitButton =
        document.querySelector(
            "#carAssignmentForm button[type='submit']"
        );


    if (submitButton) {
        submitButton.disabled = true;
    }
}

// =====================================================
// LOAD CARS
// =====================================================

async function loadCarsForAssignment() {

    const cars =
        await apiRequest("/cars/");


    const select =
        document.getElementById(
            "assignmentCarId"
        );


    select.innerHTML = `
        <option value="">
            Select Car
        </option>
    `;


    cars.forEach(car => {

        const option =
            document.createElement("option");

        option.value = car.id;

        option.textContent =
            `${car.registration_number} - ${car.brand || ""} ${car.model || ""}`;

        select.appendChild(option);

    });
}


// =====================================================
// CURRENT ASSIGNMENT
// =====================================================

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


        // Show actual current assignment dates

        document.getElementById(
            "assignmentFrom"
        ).value =
            assignment.assigned_from || "";

        document.getElementById(
            "assignmentTo"
        ).value =
            assignment.assigned_to || "";


        const cars =
            await apiRequest("/cars/");


        const car =
            cars.find(
                item =>
                    item.id === assignment.car_id
            );


        container.innerHTML = `
            <div class="current-car-card">

                <div class="current-car-title">
                    Current Car
                </div>

                <div class="current-car-name">
                    ${car
                ? escapeHtml(
                    car.registration_number
                )
                : `Car #${assignment.car_id}`
            }
                </div>

                ${car
                ? `
                            <div class="current-car-info">
                                ${escapeHtml(car.brand || "")}
                                ${escapeHtml(car.model || "")}
                            </div>
                          `
                : ""
            }

                <div class="current-car-date">
                    Assigned from:
                    ${formatDate(assignment.assigned_from)}
                </div>

                <button
                    type="button"
                    class="action-btn danger"
                    onclick="endCarAssignment(${assignment.id})"
                >
                    End Assignment
                </button>

            </div>
        `;


        // Existing assignment means don't allow
        // another assignment until it is ended.

        document.getElementById(
            "assignmentCarId"
        ).disabled = true;


        document.getElementById(
            "assignmentFrom"
        ).disabled = true;


        document.getElementById(
            "assignmentTo"
        ).disabled = true;


        document.getElementById(
            "assignmentNotes"
        ).disabled = true;


        document.querySelector(
            "#carAssignmentForm button[type='submit']"
        ).disabled = true;


    } catch (error) {

        // 404 means no current assignment.
        // That's normal.

        if (
            error.message.includes(
                "not currently assigned"
            )
        ) {

            container.innerHTML = `
                <div class="no-current-car">
                    No car is currently assigned.
                </div>
            `;


            document.getElementById(
                "assignmentCarId"
            ).disabled = false;


            document.getElementById(
                "assignmentFrom"
            ).disabled = false;


            document.getElementById(
                "assignmentTo"
            ).disabled = false;


            document.getElementById(
                "assignmentNotes"
            ).disabled = false;


            document.querySelector(
                "#carAssignmentForm button[type='submit']"
            ).disabled = false;


            return;
        }


        throw error;
    }
}


// =====================================================
// CREATE ASSIGNMENT
// =====================================================

document.getElementById(
    "carAssignmentForm"
)?.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();

        clearAssignmentError();


        const payload = {

            driver_id: Number(
                document.getElementById(
                    "assignmentDriverId"
                ).value
            ),

            car_id: Number(
                document.getElementById(
                    "assignmentCarId"
                ).value
            ),

            assigned_from:
                document.getElementById(
                    "assignmentFrom"
                ).value,

            assigned_to:
                document.getElementById(
                    "assignmentTo"
                ).value || null,

            notes:
                document.getElementById(
                    "assignmentNotes"
                ).value.trim() || null

        };


        if (!payload.car_id) {

            showAssignmentError(
                "Please select a car."
            );

            return;
        }


        try {

            await apiRequest(
                "/driver-vehicle-assignments/",
                {
                    method: "POST",
                    body: JSON.stringify(payload)
                }
            );


            alert(
                "Car assigned successfully."
            );


            closeCarAssignmentModal();


            await loadDrivers();

        } catch (error) {

            showAssignmentError(
                error.message
            );
        }

    }
);


// =====================================================
// END ASSIGNMENT
// =====================================================

async function endCarAssignment(
    assignmentId
) {

    const confirmed =
        confirm(
            "Are you sure you want to end this car assignment?"
        );


    if (!confirmed) {
        return;
    }


    try {

        await apiRequest(
            `/driver-vehicle-assignments/${assignmentId}/end`,
            {
                method: "PATCH"
            }
        );


        alert(
            "Car assignment ended successfully."
        );


        const driverId =
            Number(
                document.getElementById(
                    "assignmentDriverId"
                ).value
            );


        await loadCurrentCarAssignment(
            driverId
        );


    } catch (error) {

        showAssignmentError(
            error.message
        );
    }
}


// =====================================================
// CLOSE ASSIGNMENT MODAL
// =====================================================

function closeCarAssignmentModal() {

    document.getElementById(
        "carAssignmentModal"
    ).classList.remove("show");
}


// =====================================================
// ASSIGNMENT ERROR
// =====================================================

function showAssignmentError(message) {

    const element =
        document.getElementById(
            "assignmentError"
        );

    if (element) {
        element.textContent =
            message || "Something went wrong.";
    }
}


function clearAssignmentError() {

    const element =
        document.getElementById(
            "assignmentError"
        );

    if (element) {
        element.textContent = "";
    }
}

// =====================================================
// DRIVER HISTORY
// =====================================================

function viewDriverHistory(driverId) {

    if (!driverId) {
        alert("Driver ID is missing.");
        return;
    }

    window.location.href =
        `/frontend/drivers/driver-history.html?driver_id=${driverId}`;
}