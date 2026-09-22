document.addEventListener("DOMContentLoaded", () => {

    /*
     * Protect dashboard
     */
    if (!requireLogin()) {
        return;
    }


    /*
     * Get logged-in user
     */
    const user = getStoredUser();


    /*
     * Welcome username
     */
    const welcomeUser =
        document.getElementById("welcomeUser");

    if (user && welcomeUser) {
        welcomeUser.textContent = user.name;
    }


    /*
     * Sidebar elements
     */
    const sidebar =
        document.getElementById("dashboardSidebar");

    const sidebarToggle =
        document.getElementById("sidebarToggle");

    const sidebarOverlay =
        document.getElementById("sidebarOverlay");


    /*
     * Open sidebar
     */
    if (sidebarToggle) {

        sidebarToggle.addEventListener(
            "click",
            () => {

                sidebar.classList.toggle("show");

                sidebarOverlay.classList.toggle("show");

            }
        );

    }


    /*
     * Close sidebar
     */
    if (sidebarOverlay) {

        sidebarOverlay.addEventListener(
            "click",
            closeSidebar
        );

    }


    /*
     * Sidebar links
     */
    document
        .querySelectorAll(".dashboard-sidebar a")
        .forEach(link => {

            link.addEventListener(
                "click",
                () => {

                    if (
                        window.innerWidth <= 991
                    ) {
                        closeSidebar();
                    }

                }
            );

        });


    /*
     * Sidebar logout
     */
    const sidebarLogout =
        document.getElementById("sidebarLogout");

    if (sidebarLogout) {

        sidebarLogout.addEventListener(
            "click",
            event => {

                event.preventDefault();

                logout();

            }
        );

    }

    loadUpcomingServices();
});


/*
 * Close sidebar function
 */
function closeSidebar() {

    const sidebar =
        document.getElementById("dashboardSidebar");

    const sidebarOverlay =
        document.getElementById("sidebarOverlay");

    if (sidebar) {
        sidebar.classList.remove("show");
    }

    if (sidebarOverlay) {
        sidebarOverlay.classList.remove("show");
    }

}


// ========================================
// UPCOMING SERVICES
// ========================================

async function loadUpcomingServices() {

    const loadingElement =
        document.getElementById(
            "upcomingServicesLoading"
        );

    const emptyElement =
        document.getElementById(
            "upcomingServicesEmpty"
        );

    const errorElement =
        document.getElementById(
            "upcomingServicesError"
        );

    const listElement =
        document.getElementById(
            "upcomingServicesList"
        );


    if (!listElement) {
        return;
    }


    try {

        const services =
            await apiRequest(
                "/services/upcoming_services?days=7"
            );


        if (loadingElement) {
            loadingElement.classList.add(
                "d-none"
            );
        }


        if (
            !services ||
            services.length === 0
        ) {

            if (emptyElement) {
                emptyElement.classList.remove(
                    "d-none"
                );
            }

            return;
        }


        renderUpcomingServices(
            services
        );


        listElement.classList.remove(
            "d-none"
        );


    } catch (error) {

        console.error(
            "Failed to load upcoming services:",
            error
        );


        if (loadingElement) {
            loadingElement.classList.add(
                "d-none"
            );
        }


        if (errorElement) {

            errorElement.textContent =
                error.message ||
                "Failed to load upcoming services.";

            errorElement.classList.remove(
                "d-none"
            );

        }

    }

}


function renderUpcomingServices(services) {

    const listElement =
        document.getElementById(
            "upcomingServicesList"
        );


    if (!listElement) {
        return;
    }


    listElement.innerHTML = "";


    services.forEach(service => {

        const serviceElement =
            document.createElement("div");


        serviceElement.className =
            "upcoming-service-item";


        const dueDate =
            formatUpcomingDate(
                service.next_service_due
            );


        const daysRemaining =
            calculateDaysRemaining(
                service.next_service_due
            );


        serviceElement.innerHTML = `

            <div class="upcoming-service-main">

                <div class="upcoming-service-icon">
                    🔧
                </div>


                <div class="upcoming-service-info">

                    <div class="upcoming-service-car">
                        Car #${service.car_id}
                    </div>


                    <div class="upcoming-service-type">
                        ${escapeDashboardHtml(
            capitalizeDashboardWords(
                service.service_type
            )
        )}
                    </div>


                    <div class="upcoming-service-center">
                        ${escapeDashboardHtml(
            capitalizeDashboardWords(
                service.service_center
            )
        )}
                    </div>

                </div>

            </div>


            <div class="upcoming-service-date">

                <div class="upcoming-due-label">
                    Due Date
                </div>

                <div class="upcoming-due-date">
                    ${dueDate}
                </div>

                <div class="upcoming-days">
                    ${daysRemaining}
                </div>

            </div>


            <div class="upcoming-service-cost">

                <div class="upcoming-cost-label">
                    Cost
                </div>

                <div class="upcoming-cost-value">
                    ${formatDashboardCurrency(
            service.cost
        )}
                </div>

            </div>


            <div class="upcoming-service-action">

                <button
                    type="button"
                    class="btn btn-sm btn-outline-primary"
                    onclick="viewUpcomingService(${service.id})"
                >
                    View
                </button>

            </div>

        `;


        listElement.appendChild(
            serviceElement
        );

    });

}

function viewUpcomingService(serviceId) {

    window.location.href =
        `services/service-details.html?id=${serviceId}`;

}


function calculateDaysRemaining(dateValue) {

    if (!dateValue) {
        return "";
    }


    const today =
        new Date();


    today.setHours(
        0, 0, 0, 0
    );


    const dueDate =
        new Date(dateValue);


    dueDate.setHours(
        0, 0, 0, 0
    );


    const difference =
        dueDate.getTime() -
        today.getTime();


    const days =
        Math.ceil(
            difference /
            (1000 * 60 * 60 * 24)
        );


    if (days === 0) {
        return "Due today";
    }


    if (days === 1) {
        return "Due tomorrow";
    }


    if (days > 1) {
        return `${days} days remaining`;
    }


    return "Due";
}


function formatUpcomingDate(value) {

    if (!value) {
        return "-";
    }


    const date =
        new Date(value);


    if (Number.isNaN(
        date.getTime()
    )) {
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

function formatDashboardCurrency(value) {

    if (value == null) {
        return "-";
    }


    return Number(value).toLocaleString(
        "en-IN",
        {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 2
        }
    );

}


function capitalizeDashboardWords(value) {

    if (!value) {
        return "-";
    }


    return String(value)
        .toLowerCase()
        .replace(
            /\b\w/g,
            char => char.toUpperCase()
        );

}


function escapeDashboardHtml(value) {

    if (value == null) {
        return "";
    }


    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}