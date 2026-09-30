let driverId = null;

let driverData = null;

let driverHistory = [];


// =====================================================
// INITIAL LOAD
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const params =
            new URLSearchParams(
                window.location.search
            );

        driverId =
            params.get("driver_id");


        if (!driverId) {

            showHistoryError(
                "Driver ID is missing."
            );

            return;
        }


        loadDriverHistory();

    }
);


// =====================================================
// LOAD DRIVER + HISTORY
// =====================================================

async function loadDriverHistory() {

    try {

        const driver =
            await apiRequest(
                `/drivers/${driverId}`
            );


        driverData = driver;


        const history =
            await apiRequest(
                `/drivers/${driverId}/history`
            );


        driverHistory =
            Array.isArray(history)
                ? history
                : [];


        renderDriverInformation();

        renderHistorySummary();

        renderDriverHistory();


    } catch (error) {

        console.error(
            "Failed to load driver history:",
            error
        );


        showHistoryError(
            error.message
        );

    }
}


// =====================================================
// DRIVER INFORMATION
// =====================================================

function renderDriverInformation() {

    document.getElementById(
        "driverHistoryTitle"
    ).textContent =
        `${driverData.name} - Driver History`;


    document.getElementById(
        "driverHistorySubtitle"
    ).textContent =
        `${driverData.phone} • License: ${driverData.license_number}`;


    document.getElementById(
        "historyDriverName"
    ).textContent =
        driverData.name;


    const statusElement =
        document.getElementById(
            "historyDriverStatus"
        );


    statusElement.innerHTML = `
        <span class="history-status ${driverData.status}">
            ${capitalize(driverData.status)}
        </span>
    `;
}


// =====================================================
// SUMMARY
// =====================================================

function renderHistorySummary() {

    document.getElementById(
        "totalAssignments"
    ).textContent =
        driverHistory.length;


    const currentAssignment =
        driverHistory.find(
            item =>
                item.status === "active"
                &&
                !item.assigned_to
        );


    if (currentAssignment) {

        document.getElementById(
            "currentCar"
        ).textContent =
            currentAssignment.registration_number;

    } else {

        document.getElementById(
            "currentCar"
        ).textContent =
            "No Car";

    }
}


// =====================================================
// RENDER HISTORY
// =====================================================

function renderDriverHistory() {

    const tbody =
        document.getElementById(
            "driverHistoryTableBody"
        );


    if (!driverHistory.length) {

        tbody.innerHTML = `
            <tr>

                <td
                    colspan="7"
                    class="empty-cell"
                >
                    No car assignment history found.
                </td>

            </tr>
        `;

        return;
    }


    tbody.innerHTML =
        driverHistory
            .map(
                (assignment, index) => {

                    const duration =
                        calculateDuration(
                            assignment.assigned_from,
                            assignment.assigned_to
                        );


                    return `
                        <tr>

                            <td>
                                ${index + 1}
                            </td>


                            <td>

                                <div class="history-car-name">

                                    ${escapeHtml(
                        assignment.registration_number
                        || `Car #${assignment.car_id}`
                    )}

                                </div>


                                ${assignment.brand
                            || assignment.model

                            ? `
                                            <div class="history-car-info">
                                                ${escapeHtml(
                                assignment.brand || ""
                            )}
                                                ${escapeHtml(
                                assignment.model || ""
                            )}
                                            </div>
                                          `

                            : ""
                        }

                            </td>


                            <td>
                                ${formatDate(
                            assignment.assigned_from
                        )}
                            </td>


                            <td>

                                ${assignment.assigned_to

                            ? formatDate(
                                assignment.assigned_to
                            )

                            : `
                                            <span class="current-label">
                                                Current
                                            </span>
                                          `
                        }

                            </td>


                            <td>
                                ${duration}
                            </td>


                            <td>

                                <span
                                    class="assignment-status ${assignment.status}"
                                >
                                    ${capitalize(
                            assignment.status
                        )}
                                </span>

                            </td>


                            <td>

                                ${assignment.notes
                            ? escapeHtml(
                                assignment.notes
                            )
                            : "-"
                        }

                            </td>

                        </tr>
                    `;
                }
            )
            .join("");
}


// =====================================================
// DURATION
// =====================================================

function calculateDuration(
    startDate,
    endDate
) {

    if (!startDate) {
        return "-";
    }


    const start =
        new Date(
            `${startDate}T00:00:00`
        );


    const end =
        endDate
            ? new Date(
                `${endDate}T00:00:00`
            )
            : new Date();


    if (
        isNaN(start.getTime())
        ||
        isNaN(end.getTime())
    ) {

        return "-";
    }


    const diff =
        Math.max(
            0,
            Math.ceil(
                (
                    end.getTime()
                    - start.getTime()
                )
                /
                (1000 * 60 * 60 * 24)
            )
        );


    if (diff === 0) {

        return "1 day";
    }


    return `${diff} days`;
}


// =====================================================
// BACK
// =====================================================

function goBackToDrivers() {

    window.location.href =
        "/frontend/drivers/drivers.html";
}


// =====================================================
// ERROR
// =====================================================

function showHistoryError(message) {

    const tbody =
        document.getElementById(
            "driverHistoryTableBody"
        );


    if (tbody) {

        tbody.innerHTML = `
            <tr>

                <td
                    colspan="7"
                    class="error-cell"
                >
                    ${escapeHtml(
            message || "Something went wrong."
        )}
                </td>

            </tr>
        `;

    }
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