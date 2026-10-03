document.addEventListener(
    "DOMContentLoaded",
    initializeNotifications
);


async function initializeNotifications() {

    setupNotificationFilters();

    const markAllButton =
        document.getElementById("markAllReadButton");

    if (markAllButton) {

        markAllButton.addEventListener(
            "click",
            markAllNotificationsAsRead
        );
    }

    await loadNotifications();
}


/* =====================================================
   LOAD NOTIFICATIONS
===================================================== */

async function loadNotifications() {

    const list =
        document.getElementById("notificationList");

    if (!list) return;

    list.innerHTML = `
        <div class="notification-loading">
            Loading notifications...
        </div>
    `;

    try {

        const statusFilter =
            document.getElementById(
                "notificationStatusFilter"
            )?.value || "all";

        const typeFilter =
            document.getElementById(
                "notificationTypeFilter"
            )?.value || "";


        const params =
            new URLSearchParams();


        if (statusFilter !== "all") {

            params.set(
                "is_read",
                statusFilter
            );
        }


        if (typeFilter) {

            params.set(
                "notification_type",
                typeFilter
            );
        }


        params.set("limit", "100");


        const query =
            params.toString();

        const endpoint =
            query
                ? `/notifications/?${query}`
                : "/notifications/";


        const notifications =
            await apiRequest(endpoint);


        renderNotifications(notifications);

    } catch (error) {

        console.error(
            "Failed to load notifications:",
            error
        );

        list.innerHTML = `
            <div class="notification-empty">
                Failed to load notifications.
            </div>
        `;
    }
}


/* =====================================================
   RENDER
===================================================== */

function renderNotifications(notifications) {

    const list =
        document.getElementById(
            "notificationList"
        );

    if (!list) return;


    if (!notifications.length) {

        list.innerHTML = `
            <div class="notification-empty">
                No notifications found.
            </div>
        `;

        return;
    }


    list.innerHTML =
        notifications
            .map(renderNotification)
            .join("");


    setupNotificationActions();
}


/* =====================================================
   SINGLE NOTIFICATION
===================================================== */

function renderNotification(notification) {

    const unreadClass =
        notification.is_read
            ? ""
            : "unread";


    const icon =
        getNotificationIcon(
            notification.type
        );


    const priorityClass =
        `priority-${notification.priority}`;


    const time =
        formatNotificationDate(
            notification.created_at
        );


    return `
        <div
            class="notification-item ${unreadClass}"
            data-id="${notification.id}"
        >

            <div class="notification-icon">
                ${icon}
            </div>


            <div class="notification-content">

                <div class="notification-title">
                    ${escapeNotificationHtml(
        notification.title
    )}
                </div>


                <div class="notification-message">
                    ${escapeNotificationHtml(
        notification.message
    )}
                </div>


                <div class="notification-meta">

                    <span class="notification-priority ${priorityClass}">
                        ${escapeNotificationHtml(
        notification.priority
    )}
                    </span>

                    <span>
                        ${time}
                    </span>

                    ${notification.entity_type
            ? `
                                <span>
                                    ${escapeNotificationHtml(
                notification.entity_type
            )}
                                </span>
                              `
            : ""
        }

                </div>

            </div>


            <div class="notification-actions">

                ${!notification.is_read
            ? `
                            <button
                                type="button"
                                class="btn btn-sm btn-outline-primary mark-read-button"
                                data-id="${notification.id}"
                            >
                                Mark read
                            </button>
                          `
            : `
                            <button
                                type="button"
                                class="btn btn-sm btn-outline-secondary mark-unread-button"
                                data-id="${notification.id}"
                            >
                                Mark unread
                            </button>
                          `
        }


                <button
                    type="button"
                    class="btn btn-sm btn-outline-danger delete-notification-button"
                    data-id="${notification.id}"
                >
                    Delete
                </button>

            </div>

        </div>
    `;
}


/* =====================================================
   ACTIONS
===================================================== */

function setupNotificationActions() {

    document
        .querySelectorAll(".mark-read-button")
        .forEach(button => {

            button.addEventListener(
                "click",
                async () => {

                    await updateNotificationReadStatus(
                        button.dataset.id,
                        true
                    );
                }
            );
        });


    document
        .querySelectorAll(".mark-unread-button")
        .forEach(button => {

            button.addEventListener(
                "click",
                async () => {

                    await updateNotificationReadStatus(
                        button.dataset.id,
                        false
                    );
                }
            );
        });


    document
        .querySelectorAll(
            ".delete-notification-button"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                async () => {

                    await deleteNotification(
                        button.dataset.id
                    );
                }
            );
        });
}


/* =====================================================
   MARK READ / UNREAD
===================================================== */

async function updateNotificationReadStatus(
    notificationId,
    isRead
) {

    try {

        await apiRequest(
            `/notifications/${notificationId}/read`,
            {
                method: "PATCH",
                body: JSON.stringify({
                    is_read: isRead
                })
            }
        );


        await loadNotifications();

    } catch (error) {

        alert(
            error.message ||
            "Unable to update notification."
        );
    }
}


/* =====================================================
   MARK ALL READ
===================================================== */

async function markAllNotificationsAsRead() {

    try {

        await apiRequest(
            "/notifications/read-all",
            {
                method: "PATCH"
            }
        );


        await loadNotifications();

    } catch (error) {

        alert(
            error.message ||
            "Unable to mark notifications as read."
        );
    }
}


/* =====================================================
   DELETE
===================================================== */

async function deleteNotification(
    notificationId
) {

    const confirmed =
        confirm(
            "Are you sure you want to delete this notification?"
        );

    if (!confirmed) return;


    try {

        await apiRequest(
            `/notifications/${notificationId}`,
            {
                method: "DELETE"
            }
        );


        await loadNotifications();

    } catch (error) {

        alert(
            error.message ||
            "Unable to delete notification."
        );
    }
}


/* =====================================================
   FILTERS
===================================================== */

function setupNotificationFilters() {

    document
        .getElementById(
            "notificationStatusFilter"
        )
        ?.addEventListener(
            "change",
            loadNotifications
        );


    document
        .getElementById(
            "notificationTypeFilter"
        )
        ?.addEventListener(
            "change",
            loadNotifications
        );
}


/* =====================================================
   ICON
===================================================== */

function getNotificationIcon(type) {

    const icons = {

        document_expiry: "📄",

        license_expiry: "🪪",

        service_due: "🔧",

        insurance_expiry: "🛡️",

        tax_expiry: "💳",

        trip_alert: "🛣️",

        expense_alert: "💰",

        system: "🔔"

    };


    return icons[type] || "🔔";
}


/* =====================================================
   DATE FORMAT
===================================================== */

function formatNotificationDate(
    value
) {

    if (!value) return "";


    const date =
        new Date(value);


    if (Number.isNaN(date.getTime())) {
        return value;
    }


    return date.toLocaleString(
        "en-IN",
        {
            dateStyle: "medium",
            timeStyle: "short"
        }
    );
}


/* =====================================================
   HTML ESCAPE
===================================================== */

function escapeNotificationHtml(
    value
) {

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