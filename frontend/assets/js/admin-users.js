let allUsers = [];

let filteredUsers = [];

let currentPage = 1;

const USERS_PER_PAGE = 5;


/*
 * ==========================================
 * PAGE INITIALIZATION
 * ==========================================
 */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        /*
         * Admin protection
         */

        if (
            !requireRole(
                "admin",
                "super_admin"
            )
        ) {
            return;
        }


        /*
         * Load users
         */

        await loadUsers();


        /*
         * Refresh button
         */

        const refreshButton =
            document.getElementById(
                "refreshUsersButton"
            );


        if (refreshButton) {

            refreshButton.addEventListener(
                "click",
                async () => {

                    await loadUsers();

                }
            );

        }


        /*
         * Search
         */

        const searchInput =
            document.getElementById(
                "userSearch"
            );


        if (searchInput) {

            searchInput.addEventListener(
                "input",
                handleUserSearch
            );

        }

    }
);


/*
 * ==========================================
 * LOAD USERS
 * ==========================================
 */

async function loadUsers() {

    const tableBody =
        document.getElementById(
            "usersTableBody"
        );


    if (!tableBody) {
        return;
    }


    tableBody.innerHTML = `
        <tr>
            <td
                colspan="7"
                class="text-center py-5"
            >
                Loading users...
            </td>
        </tr>
    `;


    try {

        const users =
            await apiRequest(
                "/user/users"
            );


        allUsers =
            Array.isArray(users)
                ? users
                : [];


        filteredUsers =
            [...allUsers];


        currentPage = 1;


        updateUserCount();

        renderUsers();

        renderPagination();


    } catch (error) {

        console.error(
            "Failed to load users:",
            error
        );


        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="7"
                    class="text-center text-danger py-5"
                >
                    Failed to load users.
                </td>
            </tr>
        `;


        showError(
            error.message ||
            "Unable to load users."
        );

    }

}


/*
 * ==========================================
 * SEARCH
 * ==========================================
 */

function handleUserSearch(event) {

    const searchValue =
        event.target.value
            .trim()
            .toLowerCase();


    if (!searchValue) {

        filteredUsers =
            [...allUsers];

    } else {

        filteredUsers =
            allUsers.filter(user => {

                const name =
                    String(
                        user.name || ""
                    ).toLowerCase();

                const email =
                    String(
                        user.email || ""
                    ).toLowerCase();

                const phone =
                    String(
                        user.phone || ""
                    ).toLowerCase();

                return (
                    name.includes(searchValue) ||
                    email.includes(searchValue) ||
                    phone.includes(searchValue)
                );

            });

    }


    currentPage = 1;


    updateUserCount();

    renderUsers();

    renderPagination();

}


/*
 * ==========================================
 * UPDATE USER COUNT
 * ==========================================
 */

function updateUserCount() {

    const countElement =
        document.getElementById(
            "userCount"
        );


    if (!countElement) {
        return;
    }


    countElement.textContent =
        filteredUsers.length;

}


/*
 * ==========================================
 * RENDER USERS
 * ==========================================
 */

function renderUsers() {

    const tableBody =
        document.getElementById(
            "usersTableBody"
        );


    if (!tableBody) {
        return;
    }


    if (filteredUsers.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="7"
                    class="text-center text-muted py-5"
                >
                    No users found.
                </td>
            </tr>
        `;

        return;

    }


    const startIndex =
        (currentPage - 1) *
        USERS_PER_PAGE;


    const endIndex =
        startIndex +
        USERS_PER_PAGE;


    const pageUsers =
        filteredUsers.slice(
            startIndex,
            endIndex
        );


    tableBody.innerHTML =
        pageUsers
            .map(user => {

                return createUserRow(
                    user
                );

            })
            .join("");


    updatePaginationInfo();

}


/*
 * ==========================================
 * CREATE USER ROW
 * ==========================================
 */

function createUserRow(user) {

    const protectedUser =
        isProtectedUser(user);


    return `
        <tr>

            <td class="px-4">
                ${escapeHtml(user.id)}
            </td>


            <td>

                <strong>
                    ${escapeHtml(user.name)}
                </strong>

                ${
                    user.role === "super_admin"
                        ? `
                            <div>
                                <span class="badge text-bg-dark mt-1">
                                    Super Admin
                                </span>
                            </div>
                          `
                        : ""
                }

            </td>


            <td>
                ${escapeHtml(user.email)}
            </td>


            <td>
                ${escapeHtml(user.phone)}
            </td>


            <td>
                ${createRoleSelect(
                    user,
                    protectedUser
                )}
            </td>


            <td>
                ${createStatusBadge(
                    user.is_active
                )}
            </td>


            <td>

                ${createActionButton(
                    user,
                    protectedUser
                )}

            </td>

        </tr>
    `;
}


/*
 * ==========================================
 * ROLE SELECT
 * ==========================================
 */

function createRoleSelect(
    user,
    protectedUser
) {

    const roles = [
        {
            value: "customer",
            label: "Customer"
        },
        {
            value: "staff",
            label: "Staff"
        },
        {
            value: "manager",
            label: "Manager"
        },
        {
            value: "admin",
            label: "Admin"
        },
        {
            value: "super_admin",
            label: "Super Admin"
        }
    ];


    return `
        <select
            id="role-${user.id}"
            class="form-select form-select-sm role-select"
            ${protectedUser ? "disabled" : ""}
        >

            ${roles.map(role => `
                <option
                    value="${role.value}"
                    ${
                        user.role === role.value
                            ? "selected"
                            : ""
                    }
                >
                    ${role.label}
                </option>
            `).join("")}

        </select>
    `;
}


/*
 * ==========================================
 * UPDATE ROLE
 * ==========================================
 */

async function updateUserRole(userId) {

    const select =
        document.getElementById(
            `role-${userId}`
        );


    if (!select) {
        return;
    }


    const newRole =
        select.value;


    const row =
        select.closest("tr");


    const nameElement =
        row?.querySelector(
            "td:nth-child(2) strong"
        );


    const userName =
        nameElement
            ? nameElement.textContent.trim()
            : "this user";


    const roleName =
        formatRoleName(newRole);


    const confirmed =
        window.confirm(
            `Are you sure you want to change ${userName}'s role to ${roleName}?`
        );


    if (!confirmed) {
        return;
    }


    hideMessages();


    try {

        select.disabled = true;


        const updateButton =
            row?.querySelector(
                ".update-role-btn"
            );


        if (updateButton) {

            updateButton.disabled = true;

            updateButton.textContent =
                "Updating...";

        }


        const response =
            await apiRequest(
                `/user/users/${userId}/role`,
                {
                    method: "PATCH",

                    body: JSON.stringify({
                        role: newRole
                    })
                }
            );


        await loadUsers();


        showSuccess(
            `Role updated successfully for ${response.name}.`
        );


    } catch (error) {

        console.error(
            "Role update failed:",
            error
        );


        await loadUsers();


        showError(
            error.message ||
            "Failed to update user role."
        );

    }

}


/*
 * ==========================================
 * STATUS BUTTON
 * ==========================================
 */

function createActionButton(
    user,
    protectedUser
) {

    if (protectedUser) {

        return `
            <span class="text-muted small">
                🔒 Protected
            </span>
        `;

    }


    if (user.is_active) {

        return `
            <div class="d-flex gap-2">

                <button
                    type="button"
                    class="btn btn-sm btn-primary update-role-btn"
                    onclick="updateUserRole(${user.id})"
                >
                    Update Role
                </button>


                <button
                    type="button"
                    class="btn btn-sm btn-outline-danger"
                    onclick="toggleUserStatus(
                        ${user.id},
                        true
                    )"
                >
                    Deactivate
                </button>

            </div>
        `;

    }


    return `
        <button
            type="button"
            class="btn btn-sm btn-outline-success"
            onclick="toggleUserStatus(
                ${user.id},
                false
            )"
        >
            Activate
        </button>
    `;

}


/*
 * ==========================================
 * ACTIVATE / DEACTIVATE USER
 * ==========================================
 */

async function toggleUserStatus(
    userId,
    currentlyActive
) {

    const user =
        allUsers.find(
            item =>
                Number(item.id) ===
                Number(userId)
        );


    if (!user) {
        return;
    }


    const action =
        currentlyActive
            ? "deactivate"
            : "activate";


    const actionText =
        currentlyActive
            ? "Deactivate"
            : "Activate";


    const confirmed =
        window.confirm(
            `Are you sure you want to ${action} ${user.name}?`
        );


    if (!confirmed) {
        return;
    }


    hideMessages();


    try {

        await apiRequest(
            `/user/users/${userId}/status`,
            {
                method: "PATCH"
            }
        );


        await loadUsers();


        showSuccess(
            `${user.name} has been ${action}d successfully.`
        );


    } catch (error) {

        console.error(
            `${actionText} user failed:`,
            error
        );


        await loadUsers();


        showError(
            error.message ||
            `Failed to ${action} user.`
        );

    }

}


/*
 * ==========================================
 * PAGINATION
 * ==========================================
 */

function renderPagination() {

    const pagination =
        document.getElementById(
            "pagination"
        );


    if (!pagination) {
        return;
    }


    const totalPages =
        Math.ceil(
            filteredUsers.length /
            USERS_PER_PAGE
        );


    pagination.innerHTML = "";


    if (totalPages <= 1) {
        return;
    }


    /*
     * Previous
     */

    pagination.innerHTML += `
        <li
            class="page-item ${
                currentPage === 1
                    ? "disabled"
                    : ""
            }"
        >

            <button
                class="page-link"
                onclick="changePage(
                    ${currentPage - 1}
                )"
            >
                Previous
            </button>

        </li>
    `;


    /*
     * Pages
     */

    for (
        let page = 1;
        page <= totalPages;
        page++
    ) {

        pagination.innerHTML += `
            <li
                class="page-item ${
                    page === currentPage
                        ? "active"
                        : ""
                }"
            >

                <button
                    class="page-link"
                    onclick="changePage(
                        ${page}
                    )"
                >
                    ${page}
                </button>

            </li>
        `;

    }


    /*
     * Next
     */

    pagination.innerHTML += `
        <li
            class="page-item ${
                currentPage === totalPages
                    ? "disabled"
                    : ""
            }"
        >

            <button
                class="page-link"
                onclick="changePage(
                    ${currentPage + 1}
                )"
            >
                Next
            </button>

        </li>
    `;

}


/*
 * ==========================================
 * CHANGE PAGE
 * ==========================================
 */

function changePage(page) {

    const totalPages =
        Math.ceil(
            filteredUsers.length /
            USERS_PER_PAGE
        );


    if (
        page < 1 ||
        page > totalPages
    ) {
        return;
    }


    currentPage = page;


    renderUsers();

    renderPagination();

}


/*
 * ==========================================
 * PAGINATION INFO
 * ==========================================
 */

function updatePaginationInfo() {

    const info =
        document.getElementById(
            "paginationInfo"
        );


    if (!info) {
        return;
    }


    if (filteredUsers.length === 0) {

        info.textContent =
            "Showing 0 of 0 users";

        return;

    }


    const start =
        (currentPage - 1) *
        USERS_PER_PAGE + 1;


    const end =
        Math.min(
            currentPage *
            USERS_PER_PAGE,
            filteredUsers.length
        );


    info.textContent =
        `Showing ${start}-${end} of ${filteredUsers.length} users`;

}


/*
 * ==========================================
 * USER COUNT
 * ==========================================
 */

function createStatusBadge(isActive) {

    if (isActive) {

        return `
            <span class="badge text-bg-success">
                Active
            </span>
        `;

    }


    return `
        <span class="badge text-bg-secondary">
            Inactive
        </span>
    `;

}


/*
 * ==========================================
 * PROTECTED USER
 * ==========================================
 */

function isProtectedUser(user) {

    const currentUser =
        getStoredUser();


    if (!currentUser) {
        return false;
    }


    /*
     * Current user
     */

    if (
        Number(currentUser.id) ===
        Number(user.id)
    ) {
        return true;
    }


    /*
     * Super Admin
     */

    if (
        user.role === "super_admin"
    ) {
        return true;
    }


    return false;

}


/*
 * ==========================================
 * FORMAT ROLE
 * ==========================================
 */

function formatRoleName(role) {

    const roleNames = {

        customer: "Customer",

        staff: "Staff",

        manager: "Manager",

        admin: "Admin",

        super_admin: "Super Admin"

    };


    return (
        roleNames[role] ||
        role
    );

}


/*
 * ==========================================
 * SUCCESS MESSAGE
 * ==========================================
 */

function showSuccess(message) {

    const element =
        document.getElementById(
            "successMessage"
        );


    if (!element) {
        return;
    }


    element.textContent =
        `✓ ${message}`;


    element.classList.remove(
        "d-none"
    );


    setTimeout(() => {

        element.classList.add(
            "d-none"
        );

        element.textContent = "";

    }, 3000);

}


/*
 * ==========================================
 * ERROR MESSAGE
 * ==========================================
 */

function showError(message) {

    const element =
        document.getElementById(
            "errorMessage"
        );


    if (!element) {
        return;
    }


    element.textContent =
        `✕ ${message}`;


    element.classList.remove(
        "d-none"
    );

}


/*
 * ==========================================
 * HIDE MESSAGES
 * ==========================================
 */

function hideMessages() {

    const success =
        document.getElementById(
            "successMessage"
        );


    const error =
        document.getElementById(
            "errorMessage"
        );


    if (success) {

        success.classList.add(
            "d-none"
        );

        success.textContent = "";

    }


    if (error) {

        error.classList.add(
            "d-none"
        );

        error.textContent = "";

    }

}


/*
 * ==========================================
 * HTML ESCAPE
 * ==========================================
 */

function escapeHtml(value) {

    if (
        value === null ||
        value === undefined
    ) {
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