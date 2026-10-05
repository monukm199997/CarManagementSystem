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
        document.getElementById("appNavbar");


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


                <!-- NOTIFICATION -->
                <div class="navbar-notification-wrapper">

                    <button
                        type="button"
                        id="notificationBell"
                        class="navbar-notification"
                        aria-label="Notifications"
                    >
                        🔔

                        <span
                            id="notificationBadge"
                            class="notification-badge"
                            style="display: none;"
                        >
                            0
                        </span>
                    </button>


                    <div
                        id="notificationDropdown"
                        class="notification-dropdown"
                    >

                        <div
                            class="notification-dropdown-header"
                        >

                            <strong>
                                Notifications
                            </strong>

                            <span
                                id="notificationDropdownCount"
                                class="notification-dropdown-count"
                            >
                                0 unread
                            </span>

                        </div>


                        <div
                            id="notificationDropdownList"
                            class="notification-dropdown-list"
                        >
                            <div
                                class="notification-dropdown-loading"
                            >
                                Loading...
                            </div>
                        </div>


                        <div
                            class="notification-dropdown-footer"
                        >

                            <a
                                href="/frontend/notifications/notifications.html"
                            >
                                View all notifications →
                            </a>

                        </div>

                    </div>

                </div>


                <!-- USER -->
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
        key: "expenses",
        label: "Expenses",
        icon: "💰",
        url: "/frontend/expenses/expenses.html",
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
    },

    {
        key: "settings",
        label: "Settings",
        icon: "⚙️",
        url: "/frontend/admin/settings.html",
        roles: [
            "customer",
            "staff",
            "manager",
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
            "/admin/settings.html"
        )
    ) {
        return "settings";
    }

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

    const notificationBell =
        document.getElementById(
            "notificationBell"
        );


    const notificationDropdown =
        document.getElementById(
            "notificationDropdown"
        );


    if (
        notificationBell &&
        notificationDropdown
    ) {

        notificationBell.addEventListener(
            "click",
            event => {

                event.stopPropagation();

                notificationDropdown.classList.toggle(
                    "show"
                );

            }
        );


        notificationDropdown.addEventListener(
            "click",
            event => {

                event.stopPropagation();

            }
        );


        document.addEventListener(
            "click",
            () => {

                notificationDropdown.classList.remove(
                    "show"
                );

            }
        );
    }

    loadNavbarNotifications();

    setInterval(
        loadNavbarNotifications,
        30000
    );

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


// ============================================
// NOTIFICATION CENTER
// ============================================

async function loadNavbarNotifications() {

    const badge =
        document.getElementById(
            "notificationBadge"
        );

    const countText =
        document.getElementById(
            "notificationDropdownCount"
        );

    const list =
        document.getElementById(
            "notificationDropdownList"
        );


    if (!badge || !list) {
        return;
    }


    try {

        const countResponse =
            await apiRequest(
                "/notifications/unread-count"
            );


        const unreadCount =
            Number(
                countResponse?.unread_count || 0
            );


        updateNotificationBadge(
            unreadCount
        );


        if (countText) {

            countText.textContent =
                `${unreadCount} unread`;
        }


        const notifications =
            await apiRequest(
                "/notifications/?limit=5"
            );


        renderNavbarNotifications(
            notifications
        );

    } catch (error) {

        console.error(
            "Failed to load navbar notifications:",
            error
        );

        list.innerHTML = `
            <div class="notification-dropdown-empty">
                Unable to load notifications.
            </div>
        `;
    }
}


function updateNotificationBadge(
    unreadCount
) {

    const badge =
        document.getElementById(
            "notificationBadge"
        );


    if (!badge) {
        return;
    }


    if (unreadCount <= 0) {

        badge.style.display = "none";

        return;
    }


    badge.style.display = "flex";


    if (unreadCount > 99) {

        badge.textContent = "99+";

    } else {

        badge.textContent =
            unreadCount;
    }
}

function renderNavbarNotifications(
    notifications
) {

    const list =
        document.getElementById(
            "notificationDropdownList"
        );


    if (!list) {
        return;
    }


    if (!notifications.length) {

        list.innerHTML = `
            <div class="notification-dropdown-empty">
                No notifications.
            </div>
        `;

        return;
    }


    list.innerHTML =
        notifications
            .map(notification => {

                const unreadClass =
                    notification.is_read
                        ? ""
                        : "unread";


                const icon =
                    getNavbarNotificationIcon(
                        notification.type
                    );


                return `

                    <div
                        class="navbar-notification-item ${unreadClass}"
                        data-notification-id="${notification.id}"
                    >

                        <div
                            class="navbar-notification-item-icon"
                        >
                            ${icon}
                        </div>


                        <div
                            class="navbar-notification-item-content"
                        >

                            <div
                                class="navbar-notification-item-title"
                            >
                                ${escapeLayoutHtml(
                    notification.title
                )}
                            </div>


                            <div
                                class="navbar-notification-item-message"
                            >
                                ${escapeLayoutHtml(
                    notification.message
                )}
                            </div>


                            <div
                                class="navbar-notification-item-time"
                            >
                                ${formatNavbarNotificationTime(
                    notification.created_at
                )}
                            </div>

                        </div>

                    </div>

                `;

            })
            .join("");


    setupNavbarNotificationItems();
}


function setupNavbarNotificationItems() {

    document
        .querySelectorAll(
            ".navbar-notification-item"
        )
        .forEach(item => {

            item.addEventListener(
                "click",
                async () => {

                    const notificationId =
                        item.dataset.notificationId;


                    const notification =
                        await apiRequest(
                            `/notifications/${notificationId}`
                        );


                    if (
                        notification &&
                        !notification.is_read
                    ) {

                        await apiRequest(
                            `/notifications/${notificationId}/read`,
                            {
                                method: "PATCH",
                                body: JSON.stringify({
                                    is_read: true
                                })
                            }
                        );
                    }


                    window.location.href =
                        "/frontend/notifications/notifications.html";
                }
            );

        });
}


function getNavbarNotificationIcon(
    type
) {

    const icons = {

        document_expiry: "📄",

        license_expiry: "🪪",

        service_due: "🔧",

        insurance_expiry: "🛡️",

        trip_alert: "🛣️",

        expense_alert: "💰",

        system: "🔔"

    };


    return icons[type] || "🔔";
}


function formatNavbarNotificationTime(
    value
) {

    if (!value) {
        return "";
    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "";
    }


    return date.toLocaleString(
        "en-IN",
        {
            dateStyle: "medium",
            timeStyle: "short"
        }
    );
}