// ============================================
// COMMON LAYOUT
// NAVBAR + SIDEBAR
// ============================================

document.addEventListener(
    "DOMContentLoaded",
    initializeLayout
);


function initializeLayout() {

    console.log(
        "Common layout initializing..."
    );


    const user =
        getLayoutUser();


    if (!user) {

        console.warn(
            "No logged-in user found."
        );

        return;
    }


    renderNavbar(user);

    renderSidebar(user);

    setupLayoutEvents();


    console.log(
        "Common layout loaded successfully."
    );
}


// ============================================
// GET USER
// ============================================

function getLayoutUser() {

    const user =
        localStorage.getItem("user");


    if (!user) {
        return null;
    }


    try {

        return JSON.parse(user);

    } catch (error) {

        console.error(
            "Invalid user data:",
            error
        );

        return null;
    }
}


// ============================================
// ROLE FORMAT
// ============================================

function formatLayoutRole(role) {

    if (!role) {
        return "";
    }


    return role
        .replace(/_/g, " ")
        .replace(
            /\b\w/g,
            char =>
                char.toUpperCase()
        );
}


// ============================================
// NAVBAR
// ============================================

function renderNavbar(user) {

    const navbar =
        document.getElementById(
            "appNavbar"
        );


    if (!navbar) {

        console.error(
            "appNavbar element not found."
        );

        return;
    }


    navbar.innerHTML = `

        <nav class="dashboard-navbar">

            <div class="navbar-brand-custom">

                <span class="navbar-brand-icon">
                    🚗
                </span>

                <span>
                    Car Management System
                </span>

            </div>


            <div class="navbar-user">

                <span class="navbar-notification">
                    🔔
                </span>


                <div class="navbar-user-info">

                    <strong>
                        ${escapeLayoutHtml(
        user.name || "User"
    )}
                    </strong>

                    <small>
                        ${escapeLayoutHtml(
        formatLayoutRole(
            user.role
        )
    )}
                    </small>

                </div>


                <button
                    type="button"
                    id="logoutButton"
                    class="btn btn-sm btn-outline-light"
                >
                    Logout
                </button>

            </div>

        </nav>

    `;
}


// ============================================
// SIDEBAR MENU
// ============================================

const MENU_ITEMS = [

    {
        key: "dashboard",
        label: "Dashboard",
        icon: "📊",
        url: "/frontend/dashboard.html",
        roles: [
            "customer",
            "staff",
            "manager",
            "admin",
            "super_admin"
        ]
    },


    {
        key: "cars",
        label: "Cars",
        icon: "🚗",
        url: "/frontend/cars/cars.html",
        roles: [
            "customer",
            "staff",
            "manager",
            "admin",
            "super_admin"
        ]
    },


    {
        key: "services",
        label: "Services",
        icon: "🔧",
        url: "/frontend/services/services.html",
        roles: [
            "customer",
            "staff",
            "manager",
            "admin",
            "super_admin"
        ]
    },

    {
        key: "documents",
        label: "Documents",
        icon: "📄",
        url: "/frontend/documents/documents.html",
        roles: [
            "customer",
            "staff",
            "manager",
            "admin",
            "super_admin"
        ]
    },


    {
        key: "fuel",
        label: "Fuel",
        icon: "⛽",
        url: "/frontend/fuel/fuel.html",
        roles: [
            "customer",
            "staff",
            "manager",
            "admin",
            "super_admin"
        ]
    },


    {
        key: "expenses",
        label: "Expenses",
        icon: "💰",
        url: "/frontend/expenses/expenses.html",
        roles: [
            "customer",
            "staff",
            "manager",
            "admin",
            "super_admin"
        ]
    },

    {
        key: "drivers",
        label: "Drivers",
        icon: "👨‍✈️",
        url: "/frontend/drivers/drivers.html",
        roles: [
            "staff",
            "manager",
            "admin",
            "super_admin"
        ]
    },
    {
        key: "trips",
        label: "Trips",
        icon: "🛣️",
        url: "/frontend/trips/trips.html",
        roles: [
            "staff",
            "manager",
            "admin",
            "super_admin"
        ]
    },
    {
        key: "trip-analytics",
        label: "Trip Analytics",
        icon: "📊",
        url: "/frontend/trips/trip-analytics.html",
        roles: [
            "staff",
            "manager",
            "admin",
            "super_admin"
        ]
    },

    {
        key: "reports",
        label: "Reports",
        icon: "📈",
        url: "/frontend/reports/reports.html",
        roles: [
            "manager",
            "admin",
            "super_admin"
        ]
    },


    {
        key: "admin",
        label: "Admin Panel",
        icon: "🛠",
        url: "/frontend/admin/dashboard.html",
        roles: [
            "admin",
            "super_admin"
        ]
    }

];


// ============================================
// CURRENT PAGE
// ============================================

function getCurrentMenuKey() {

    const path =
        window.location.pathname
            .toLowerCase();


    if (
        path.includes(
            "/admin/"
        )
    ) {
        return "admin";
    }


    if (
        path.includes(
            "/cars/"
        )
    ) {
        return "cars";
    }


    if (
        path.includes(
            "/services/"
        )
    ) {
        return "services";
    }


    if (
        path.includes(
            "/fuel/"
        )
    ) {
        return "fuel";
    }


    if (
        path.includes(
            "/expenses/"
        )
    ) {
        return "expenses";
    }


    if (
        path.includes(
            "/reports/"
        )
    ) {
        return "reports";
    }


    if (
        path.endsWith(
            "/dashboard.html"
        )
    ) {
        return "dashboard";
    }


    return "";
}


// ============================================
// SIDEBAR
// ============================================

function renderSidebar(user) {

    const sidebar =
        document.getElementById(
            "appSidebar"
        );


    if (!sidebar) {

        console.error(
            "appSidebar element not found."
        );

        return;
    }


    const currentPage =
        getCurrentMenuKey();


    const visibleItems =
        MENU_ITEMS.filter(
            item =>
                item.roles.includes(
                    user.role
                )
        );


    const menuHtml =
        visibleItems
            .map(item => {

                const activeClass =
                    item.key === currentPage
                        ? "active"
                        : "";


                return `

                    <li class="${activeClass}">

                        <a href="${item.url}">

                            <span class="sidebar-icon">
                                ${item.icon}
                            </span>

                            <span>
                                ${item.label}
                            </span>

                        </a>

                    </li>

                `;

            })
            .join("");


    sidebar.innerHTML = `

        <aside
            id="dashboardSidebar"
            class="dashboard-sidebar"
        >

            <div class="sidebar-title">
                MAIN MENU
            </div>


            <ul class="sidebar-menu">

                ${menuHtml}

            </ul>


            <div class="sidebar-title mt-4">
                ACCOUNT
            </div>


            <ul class="sidebar-menu">

                <li>

                    <a
                        href="#"
                        id="sidebarLogout"
                    >

                        <span class="sidebar-icon">
                            🚪
                        </span>

                        <span>
                            Logout
                        </span>

                    </a>

                </li>

            </ul>

        </aside>

    `;
}


// ============================================
// EVENTS
// ============================================

function setupLayoutEvents() {

    const logoutButton =
        document.getElementById(
            "logoutButton"
        );


    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            () => {

                if (
                    typeof logout ===
                    "function"
                ) {

                    logout();

                }

            }
        );

    }


    const sidebarLogout =
        document.getElementById(
            "sidebarLogout"
        );


    if (sidebarLogout) {

        sidebarLogout.addEventListener(
            "click",
            event => {

                event.preventDefault();


                if (
                    typeof logout ===
                    "function"
                ) {

                    logout();

                }

            }
        );

    }

}


// ============================================
// HTML ESCAPE
// ============================================

function escapeLayoutHtml(value) {

    if (value == null) {
        return "";
    }


    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}